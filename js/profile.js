import { supabase } from './supabase.js';
import { checkSession } from './auth.js';
import { BADGES, checkAndAwardBadges } from './gamification.js';

// ─── Cached state ───────────────────────────────────────────────
let currentUser = null;       // The logged-in user
let currentProfile = null;    // Own profile data (edit mode)
let viewedUserId = null;      // If set, we are in friend-view mode
let isFriendView = false;     // True when viewing someone else's profile

// ─── Utility helpers ─────────────────────────────────────────────
function formatCount(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function avatarUrl(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ea7a2b&color=fff&size=150&bold=true`;
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="review-star ${i < rating ? 'filled' : ''}">★</span>`
  ).join('');
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Modal helpers ───────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('modal-open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('modal-open');
}

// Close modal when clicking backdrop
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('modal-open');
  });
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.modal-open').forEach(el =>
      el.classList.remove('modal-open')
    );
  }
});

// ─── MAIN INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check session
  const { data: { session } } = await checkSession();

  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = session.user;

  // 2. Check if viewing a friend's profile via ?id= param
  const params = new URLSearchParams(window.location.search);
  const friendId = params.get('id');

  if (friendId && friendId !== currentUser.id) {
    // ── FRIEND-VIEW MODE ──────────────────────────────────────
    isFriendView = true;
    viewedUserId = friendId;
    enterFriendViewMode(friendId);
  } else {
    // ── OWN PROFILE MODE ─────────────────────────────────────
    isFriendView = false;
    viewedUserId = currentUser.id;
    enterOwnProfileMode();
  }
});

// ─── OWN PROFILE MODE ────────────────────────────────────────────
async function enterOwnProfileMode() {
  document.title = 'BiteMap - My Profile';

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    document.getElementById('profile-name').textContent = currentUser.email.split('@')[0];
    document.getElementById('profile-handle').textContent = `@${currentUser.email.split('@')[0]}`;
    document.getElementById('profile-bio').textContent = 'Welcome to BiteMap!';
    return;
  }

  currentProfile = profile;
  renderProfile(profile);

  // Catch-up badge check (awards badges from historical actions)
  checkAndAwardBadges(currentUser.id);

  await fetchAndRenderStats(currentUser.id);

  document.getElementById('recs-title').textContent =
    `${(profile.username || currentUser.email.split('@')[0])}'s Top Picks`;
  loadRecentPicks(currentUser.id);

  // Own-profile-only UI
  wireEditProfile();
  wireStatCards(currentUser.id);

  loadTaggedRestaurants(currentUser.id, false);
}

// ─── FRIEND-VIEW MODE ────────────────────────────────────────────
async function enterFriendViewMode(friendId) {
  // Update back link
  const backLink = document.getElementById('back-link');
  if (backLink) {
    backLink.href = 'friends.html';
    backLink.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      Back to Friends
    `;
  }

  // Fetch friend's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendId)
    .single();

  if (error || !profile) {
    console.error('Error loading friend profile:', error);
    document.getElementById('profile-name').textContent = 'Unknown User';
    document.getElementById('profile-bio').textContent = 'Profile not found.';
    return;
  }

  document.title = `BiteMap - ${profile.username || 'Friend'}'s Profile`;

  // Show friend-view banner
  const banner = document.getElementById('friend-view-banner');
  if (banner) {
    banner.style.display = 'flex';
    document.getElementById('friend-banner-text').textContent =
      `Viewing ${profile.username || 'this user'}'s profile`;
  }

  // Render the friend's profile data
  renderProfile(profile, true);

  // Swap buttons: hide Edit, show Follow
  document.getElementById('btn-edit-profile').style.display = 'none';
  const followBtn = document.getElementById('btn-follow-profile');
  followBtn.style.display = 'inline-flex';

  // Set initial follow state
  await refreshFollowButton(friendId, followBtn);

  // Follow button click handler
  followBtn.addEventListener('click', () => toggleFollow(friendId, followBtn));

  // Stats
  await fetchAndRenderStats(friendId);

  document.getElementById('recs-title').textContent =
    `${profile.username || 'Their'}'s Top Picks`;
  loadRecentPicks(friendId);

  // Wire stat card modals to friend's data
  wireStatCards(friendId);

  // Load their dining map (read-only, no remove buttons)
  loadTaggedRestaurants(friendId, true);
}

// ─── RENDER PROFILE ──────────────────────────────────────────────
function renderProfile(profile, readOnly = false) {
  const displayName = profile.username || (isFriendView ? 'User' : currentUser.email.split('@')[0]);

  document.getElementById('profile-name').textContent = displayName;
  document.getElementById('profile-handle').textContent = `@${displayName}`;
  document.getElementById('profile-bio').textContent =
    profile.bio || (readOnly
      ? 'This user hasn\'t added a bio yet.'
      : 'Welcome to BiteMap! Add a bio to tell others about your food journey.');

  // Avatar
  const avatarEl = document.getElementById('profile-avatar');
  avatarEl.src = profile.avatar_url || avatarUrl(displayName);
  avatarEl.alt = displayName;

  // Level & XP
  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const xpForNextLevel = level * 100;
  const progress = Math.min((xp % xpForNextLevel) / xpForNextLevel * 100, 100);

  document.getElementById('stat-level').textContent = level;
  document.getElementById('stat-xp').textContent = `${xp} XP`;
  document.getElementById('level-progress-fill').style.width = `${progress}%`;

  // Render earned badges
  renderInlineBadges(profile.badges || []);
  renderAchievements(profile.badges || []);
}

// ─── FETCH & RENDER STATS ────────────────────────────────────────
async function fetchAndRenderStats(userId) {
  const [
    { count: reviewCount },
    { count: followerCount },
    { count: followingCount }
  ] = await Promise.all([
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  document.getElementById('stat-reviews').textContent = formatCount(reviewCount || 0);
  document.getElementById('stat-followers').textContent = formatCount(followerCount || 0);
  document.getElementById('stat-following').textContent = formatCount(followingCount || 0);
}

// ─── WIRE STAT CARDS (click to open popups) ──────────────────────
function wireStatCards(userId) {
  document.getElementById('stat-card-reviews').addEventListener('click', () => openReviewsModal(userId));
  document.getElementById('stat-card-followers').addEventListener('click', () => openFollowersModal(userId));
  document.getElementById('stat-card-following').addEventListener('click', () => openFollowingModal(userId));

  document.getElementById('close-followers-modal').addEventListener('click', () => closeModal('modal-followers'));
  document.getElementById('close-following-modal').addEventListener('click', () => closeModal('modal-following'));
  document.getElementById('close-reviews-modal').addEventListener('click', () => closeModal('modal-reviews'));
}

// ─── FOLLOWERS POPUP ─────────────────────────────────────────────
async function openFollowersModal(userId) {
  openModal('modal-followers');
  const listEl = document.getElementById('followers-list');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';

  const { data, error } = await supabase
    .from('friendships')
    .select('follower_id')
    .eq('following_id', userId);

  if (error || !data || data.length === 0) {
    listEl.innerHTML = '<div class="list-empty">No followers yet.</div>';
    return;
  }

  const ids = data.map(r => r.follower_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  renderUserList(listEl, profiles || [], isFriendView);
}

// ─── FOLLOWING POPUP ─────────────────────────────────────────────
async function openFollowingModal(userId) {
  openModal('modal-following');
  const listEl = document.getElementById('following-list');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';

  const { data, error } = await supabase
    .from('friendships')
    .select('following_id')
    .eq('follower_id', userId);

  if (error || !data || data.length === 0) {
    listEl.innerHTML = isFriendView
      ? '<div class="list-empty">Not following anyone yet.</div>'
      : '<div class="list-empty">You\'re not following anyone yet.</div>';
    return;
  }

  const ids = data.map(r => r.following_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  renderUserList(listEl, profiles || [], isFriendView);
}

// ─── Render a list of user profile rows ──────────────────────────
function renderUserList(container, profiles, clickable = false) {
  if (!profiles.length) {
    container.innerHTML = '<div class="list-empty">No users found.</div>';
    return;
  }

  container.innerHTML = '';
  profiles.forEach(p => {
    const name = p.username || 'User';
    const avatar = p.avatar_url || avatarUrl(name);
    const item = document.createElement('div');
    item.className = `user-list-item${clickable ? ' user-list-item-clickable' : ''}`;
    if (clickable) item.style.cursor = 'pointer';
    item.innerHTML = `
      <img class="user-list-avatar" src="${avatar}" alt="${name}" 
           onerror="this.src='${avatarUrl(name)}'"/>
      <div class="user-list-info">
        <div class="user-list-name">${name}</div>
        <div class="user-list-handle">@${name}</div>
      </div>
      ${clickable ? '<span class="user-list-arrow">→</span>' : ''}
    `;
    if (clickable) {
      item.addEventListener('click', () => {
        window.location.href = `profile.html?id=${p.id}`;
      });
    }
    container.appendChild(item);
  });
}

// ─── REVIEWS POPUP ───────────────────────────────────────────────
async function openReviewsModal(userId) {
  openModal('modal-reviews');
  const listEl = document.getElementById('reviews-list');
  const titleEl = document.getElementById('modal-reviews-title');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';
  if (titleEl) {
    titleEl.textContent = isFriendView ? 'Their Reviews' : 'My Reviews';
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, star_rating, comment, created_at, restaurant_id, restaurants(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !reviews || reviews.length === 0) {
    listEl.innerHTML = isFriendView
      ? '<div class="list-empty">This user hasn\'t written any reviews yet.</div>'
      : '<div class="list-empty">You haven\'t written any reviews yet.</div>';
    return;
  }

  listEl.innerHTML = reviews.map(r => {
    const restaurantName = r.restaurants?.name || 'Unknown Restaurant';
    const stars = renderStars(r.star_rating || 0);
    const comment = r.comment ? `<p class="review-comment">"${r.comment}"</p>` : '';
    return `
      <div class="review-list-item">
        <div class="review-restaurant-name">${restaurantName}</div>
        <div class="review-stars">${stars}</div>
        ${comment}
        <div class="review-date">${formatDate(r.created_at)}</div>
      </div>
    `;
  }).join('');
}

// ─── FOLLOW / UNFOLLOW ───────────────────────────────────────────
async function refreshFollowButton(friendId, btn) {
  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('follower_id', currentUser.id)
    .eq('following_id', friendId)
    .maybeSingle();

  const isFollowing = !error && data !== null;
  updateFollowButtonUI(btn, isFollowing);
}

function updateFollowButtonUI(btn, isFollowing) {
  const textEl = document.getElementById('follow-btn-text');
  const iconEl = document.getElementById('follow-btn-icon');

  if (isFollowing) {
    btn.classList.add('is-following');
    btn.classList.remove('is-not-following');
    if (textEl) textEl.textContent = '✓ Following';
    if (iconEl) iconEl.innerHTML = `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>`;
  } else {
    btn.classList.remove('is-following');
    btn.classList.add('is-not-following');
    if (textEl) textEl.textContent = 'Follow';
    if (iconEl) iconEl.innerHTML = `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line>`;
  }
}

async function toggleFollow(friendId, btn) {
  btn.disabled = true;
  const isCurrentlyFollowing = btn.classList.contains('is-following');

  try {
    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .match({ follower_id: currentUser.id, following_id: friendId });
      if (error) throw error;
      updateFollowButtonUI(btn, false);
    } else {
      const { error } = await supabase
        .from('friendships')
        .insert([{ follower_id: currentUser.id, following_id: friendId }]);
      if (error) throw error;
      updateFollowButtonUI(btn, true);
    }
    // Refresh follower count shown on the page
    await fetchAndRenderStats(friendId);
  } catch (err) {
    console.error('Error toggling follow:', err);
    alert('Failed to update follow status. Please try again.');
  } finally {
    btn.disabled = false;
  }
}

// ─── EDIT PROFILE (own profile only) ─────────────────────────────
function wireEditProfile() {
  const btnEdit = document.getElementById('btn-edit-profile');
  const btnCancel = document.getElementById('btn-cancel-edit');
  const btnSave = document.getElementById('btn-save-profile');
  const errEl = document.getElementById('edit-error');

  btnEdit.addEventListener('click', () => {
    const displayName = currentProfile?.username || currentUser.email.split('@')[0];
    document.getElementById('edit-username').value = displayName;
    document.getElementById('edit-bio').value = currentProfile?.bio || '';
    document.getElementById('edit-avatar-preview').src =
      currentProfile?.avatar_url || avatarUrl(displayName);
    errEl.style.display = 'none';
    openModal('modal-edit-profile');
  });

  document.getElementById('edit-username').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (val) {
      document.getElementById('edit-avatar-preview').src =
        currentProfile?.avatar_url || avatarUrl(val);
    }
  });

  btnCancel.addEventListener('click', () => closeModal('modal-edit-profile'));
  document.getElementById('close-edit-modal').addEventListener('click', () => closeModal('modal-edit-profile'));

  btnSave.addEventListener('click', async () => {
    errEl.style.display = 'none';
    const newUsername = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();

    if (!newUsername) {
      errEl.textContent = 'Username cannot be empty.';
      errEl.style.display = 'block';
      return;
    }
    if (!/^[a-zA-Z0-9_]{1,30}$/.test(newUsername)) {
      errEl.textContent = 'Username can only contain letters, numbers, and underscores (max 30 chars).';
      errEl.style.display = 'block';
      return;
    }

    setSavingState(true);

    if (newUsername !== currentProfile?.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .neq('id', currentUser.id)
        .maybeSingle();

      if (existing) {
        errEl.textContent = 'That username is already taken. Please choose another.';
        errEl.style.display = 'block';
        setSavingState(false);
        return;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ username: newUsername, bio: newBio })
      .eq('id', currentUser.id)
      .select()
      .single();

    setSavingState(false);

    if (updateError) {
      errEl.textContent = `Error saving: ${updateError.message}`;
      errEl.style.display = 'block';
      return;
    }

    currentProfile = updated;
    renderProfile(updated);
    document.getElementById('recs-title').textContent = `${updated.username}'s Top Picks`;

    closeModal('modal-edit-profile');
  });
}

function setSavingState(isSaving) {
  const btn = document.getElementById('btn-save-profile');
  const text = document.getElementById('save-btn-text');
  const spinner = document.getElementById('save-btn-spinner');
  btn.disabled = isSaving;
  text.style.display = isSaving ? 'none' : 'inline';
  spinner.style.display = isSaving ? 'inline-block' : 'none';
}

// ─── TAGGED RESTAURANTS (Dining Map) ─────────────────────────────
let allTaggedData = [];

async function loadTaggedRestaurants(userId, readOnly) {
  const grid = document.getElementById('tagged-restaurants-grid');
  const tabs = document.querySelectorAll('#tag-tabs .tag-tab');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('user_restaurant_tags')
      .select('tag, created_at, restaurant_id, restaurants(id, name, cuisine_tag, city, price_tag)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allTaggedData = data || [];

    const counts = { 'Want to go': 0, 'Visited': 0, 'Would go again': 0 };
    allTaggedData.forEach(item => {
      if (counts[item.tag] !== undefined) counts[item.tag]++;
    });
    document.getElementById('count-want').textContent = counts['Want to go'];
    document.getElementById('count-visited').textContent = counts['Visited'];
    document.getElementById('count-again').textContent = counts['Would go again'];

    const activeTab = document.querySelector('#tag-tabs .tag-tab.active');
    const activeTag = activeTab ? activeTab.dataset.tag : 'Want to go';
    renderTaggedCards(activeTag, readOnly, userId);

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTaggedCards(tab.dataset.tag, readOnly, userId);
      });
    });
  } catch (err) {
    console.error('Error loading tagged restaurants:', err);
    grid.innerHTML = '<p class="tagged-empty-state">Failed to load tagged restaurants.</p>';
  }
}

function renderTaggedCards(filterTag, readOnly, userId) {
  const grid = document.getElementById('tagged-restaurants-grid');
  const filtered = allTaggedData.filter(item => item.tag === filterTag);

  if (filtered.length === 0) {
    const ownMessages = {
      'Want to go': 'No restaurants on your wishlist yet. Explore and tag places you want to try!',
      'Visited': 'You haven\'t marked any restaurants as visited yet.',
      'Would go again': 'Tag your favourite restaurants to remember them here!'
    };
    const friendMessages = {
      'Want to go': 'This user hasn\'t added any restaurants to their wishlist yet.',
      'Visited': 'This user hasn\'t marked any restaurants as visited yet.',
      'Would go again': 'This user hasn\'t tagged any favourite restaurants yet.'
    };
    const msgs = readOnly ? friendMessages : ownMessages;
    grid.innerHTML = `<p class="tagged-empty-state">${msgs[filterTag] || 'No tagged restaurants.'}</p>`;
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(item => {
    const r = item.restaurants;
    if (!r) return;

    const cuisine = r.cuisine_tag || 'Restaurant';
    const emojiMap = {
      'Pub/Bar Food': '🍔', 'Fine Dining': '🍷', 'Cafe/Bakery': '☕',
      'Canadian': '🍁', 'Italian': '🍕', 'Seafood': '🦞',
      'Asian': '🍜', 'BBQ/Smokehouse': '🔥', 'Steakhouse': '🥩'
    };
    const emoji = emojiMap[cuisine] || '🍽️';

    const badgeClass = item.tag === 'Want to go' ? 'badge-want'
      : item.tag === 'Visited' ? 'badge-visited' : 'badge-again';

    const taggedDate = new Date(item.created_at).toLocaleDateString('en-CA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const card = document.createElement('div');
    card.className = 'tagged-card';
    card.innerHTML = `
      <div class="tagged-card-image">
        <span>${emoji}</span>
        <span class="tagged-card-badge ${badgeClass}">${item.tag}</span>
      </div>
      <div class="tagged-card-body">
        <h3 class="tagged-card-name">${r.name}</h3>
        <p class="tagged-card-meta">${cuisine} • ${r.city || 'Ontario'}${r.price_tag ? ' • ' + r.price_tag : ''}</p>
        <div class="tagged-card-footer">
          <span class="tagged-card-date">Tagged ${taggedDate}</span>
          ${readOnly ? '' : `<button class="tagged-card-remove" data-id="${r.id}" title="Remove tag">Remove</button>`}
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.tagged-card-remove')) return;
      window.location.href = `restaurant.html?id=${r.id}`;
    });

    if (!readOnly) {
      const removeBtn = card.querySelector('.tagged-card-remove');
      removeBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Remove this tag?')) return;

        try {
          const { error } = await supabase
            .from('user_restaurant_tags')
            .delete()
            .eq('user_id', userId)
            .eq('restaurant_id', r.id);

          if (error) throw error;
          await loadTaggedRestaurants(userId, false);
        } catch (err) {
          console.error('Error removing tag:', err);
          alert('Failed to remove tag.');
        }
      });
    }

    grid.appendChild(card);
  });
}

// ─── TOP PICKS ───────────────────────────────────────────────────
async function loadRecentPicks(userId) {
  const grid = document.getElementById('recs-grid');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('user_restaurant_tags')
      .select('created_at, restaurants(id, name, cuisine_tag, city, price_tag)')
      .eq('user_id', userId)
      .eq('tag', 'Would go again')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = isFriendView
        ? `<p style="color: #999; grid-column: 1 / -1; text-align: center; padding: 40px;">
             This user hasn't tagged any restaurants as "Would go again" yet.
           </p>`
        : `<p style="color: #999; grid-column: 1 / -1; text-align: center; padding: 40px;">
             Tag restaurants as "Would go again" to see your top picks here!
           </p>`;
      return;
    }

    grid.innerHTML = '';
    data.forEach(item => {
      const r = item.restaurants;
      if (!r) return;

      const cuisine = r.cuisine_tag || 'Restaurant';
      const emojiMap = {
        'Pub/Bar Food': '🍔', 'Fine Dining': '🍷', 'Cafe/Bakery': '☕',
        'Canadian': '🍁', 'Italian': '🍕', 'Seafood': '🦞',
        'Asian': '🍜', 'BBQ/Smokehouse': '🔥', 'Steakhouse': '🥩'
      };
      const emoji = emojiMap[cuisine] || '🍽️';

      const card = document.createElement('article');
      card.className = 'rec-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="rec-image-wrapper">
          <div class="rec-image-placeholder">
            <span>${emoji}</span>
            <p>${cuisine}</p>
          </div>
        </div>
        <div class="rec-content">
          <div class="rec-top-row">
            <h3 class="rec-title">${r.name}</h3>
          </div>
          <p class="rec-meta">${cuisine} • ${r.city || 'Ontario'}${r.price_tag ? ' • ' + r.price_tag : ''}</p>
          <div class="rec-footer">
            <span class="rec-date">Would go again ❤️</span>
            <a href="restaurant.html?id=${r.id}" class="rec-details">View →</a>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.href = `restaurant.html?id=${r.id}`;
      });
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading top picks:', err);
  }
}

// ─── RENDER INLINE BADGES (near profile name) ─────────────────────
function renderInlineBadges(earnedBadgeIds = []) {
  const row = document.getElementById('profile-badges-row');
  if (!row) return;

  const earned = BADGES.filter(b => earnedBadgeIds.includes(b.id));

  if (earned.length === 0) {
    row.innerHTML = '<span class="badge-chip badge-chip-empty">No badges yet — start exploring to earn some!</span>';
    return;
  }

  row.innerHTML = earned
    .map(b => `<span class="badge-chip" title="${b.description}">${b.icon} ${b.name}</span>`)
    .join('');
}

// ─── RENDER ACHIEVEMENTS GRID (all 13 badges, earned / locked) ────
function renderAchievements(earnedBadgeIds = []) {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;

  const earnedSet = new Set(earnedBadgeIds);
  grid.innerHTML = '';

  BADGES.forEach(badge => {
    const isEarned = earnedSet.has(badge.id);
    const card = document.createElement('div');
    card.className = `badge-card ${isEarned ? 'earned' : 'locked'}`;
    card.title = badge.description;
    card.innerHTML = `
      <span class="badge-card-icon">${badge.icon}</span>
      <div class="badge-card-name">${badge.name}</div>
      <div class="badge-card-desc">${badge.description}</div>
      ${ isEarned
        ? '<div class="badge-card-status earned-label">✓ Earned</div>'
        : '<div class="badge-card-status lock-label">🔒 Locked</div>'
      }
    `;
    grid.appendChild(card);
  });
}
