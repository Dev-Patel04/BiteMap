import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

// ─── Cached state ───────────────────────────────────────────────
let currentUser = null;
let currentProfile = null;

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

  // 2. Fetch profile
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

  // 3. Fetch counts
  await fetchAndRenderStats();

  // 4. Recs
  document.getElementById('recs-title').textContent = `${(profile.username || currentUser.email.split('@')[0])}'s Top Picks`;
  loadRecentPicks();

  // 5. Wire up UI interactions
  wireEditProfile();
  wireStatCards();
});

// ─── RENDER PROFILE ──────────────────────────────────────────────
function renderProfile(profile) {
  const displayName = profile.username || currentUser.email.split('@')[0];

  document.getElementById('profile-name').textContent = displayName;
  document.getElementById('profile-handle').textContent = `@${displayName}`;
  document.getElementById('profile-bio').textContent =
    profile.bio || 'Welcome to BiteMap! Add a bio to tell others about your food journey.';

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
}

// ─── FETCH & RENDER STATS ────────────────────────────────────────
async function fetchAndRenderStats() {
  const userId = currentUser.id;

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
function wireStatCards() {
  document.getElementById('stat-card-reviews').addEventListener('click', openReviewsModal);
  document.getElementById('stat-card-followers').addEventListener('click', openFollowersModal);
  document.getElementById('stat-card-following').addEventListener('click', openFollowingModal);

  document.getElementById('close-followers-modal').addEventListener('click', () => closeModal('modal-followers'));
  document.getElementById('close-following-modal').addEventListener('click', () => closeModal('modal-following'));
  document.getElementById('close-reviews-modal').addEventListener('click', () => closeModal('modal-reviews'));
}

// ─── FOLLOWERS POPUP ─────────────────────────────────────────────
async function openFollowersModal() {
  openModal('modal-followers');
  const listEl = document.getElementById('followers-list');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';

  // People who follow me: follower_id → their profile
  const { data, error } = await supabase
    .from('friendships')
    .select('follower_id')
    .eq('following_id', currentUser.id);

  if (error || !data || data.length === 0) {
    listEl.innerHTML = '<div class="list-empty">No followers yet.</div>';
    return;
  }

  const ids = data.map(r => r.follower_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  renderUserList(listEl, profiles || []);
}

// ─── FOLLOWING POPUP ─────────────────────────────────────────────
async function openFollowingModal() {
  openModal('modal-following');
  const listEl = document.getElementById('following-list');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';

  // People I follow: following_id → their profile
  const { data, error } = await supabase
    .from('friendships')
    .select('following_id')
    .eq('follower_id', currentUser.id);

  if (error || !data || data.length === 0) {
    listEl.innerHTML = '<div class="list-empty">You\'re not following anyone yet.</div>';
    return;
  }

  const ids = data.map(r => r.following_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  renderUserList(listEl, profiles || []);
}

// ─── Render a list of user profile rows ──────────────────────────
function renderUserList(container, profiles) {
  if (!profiles.length) {
    container.innerHTML = '<div class="list-empty">No users found.</div>';
    return;
  }

  container.innerHTML = profiles.map(p => {
    const name = p.username || 'User';
    const avatar = p.avatar_url || avatarUrl(name);
    return `
      <div class="user-list-item">
        <img class="user-list-avatar" src="${avatar}" alt="${name}" 
             onerror="this.src='${avatarUrl(name)}'"/>
        <div class="user-list-info">
          <div class="user-list-name">${name}</div>
          <div class="user-list-handle">@${name}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── REVIEWS POPUP ───────────────────────────────────────────────
async function openReviewsModal() {
  openModal('modal-reviews');
  const listEl = document.getElementById('reviews-list');
  listEl.innerHTML = '<div class="list-loading">Loading...</div>';

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, star_rating, comment, created_at, restaurant_id, restaurants(name)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error || !reviews || reviews.length === 0) {
    listEl.innerHTML = '<div class="list-empty">You haven\'t written any reviews yet.</div>';
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

// ─── EDIT PROFILE ────────────────────────────────────────────────
function wireEditProfile() {
  const btnEdit = document.getElementById('btn-edit-profile');
  const btnCancel = document.getElementById('btn-cancel-edit');
  const btnSave = document.getElementById('btn-save-profile');
  const errEl = document.getElementById('edit-error');

  // Open modal, pre-fill fields
  btnEdit.addEventListener('click', () => {
    const displayName = currentProfile?.username || currentUser.email.split('@')[0];
    document.getElementById('edit-username').value = displayName;
    document.getElementById('edit-bio').value = currentProfile?.bio || '';
    document.getElementById('edit-avatar-preview').src =
      currentProfile?.avatar_url || avatarUrl(displayName);
    errEl.style.display = 'none';
    openModal('modal-edit-profile');
  });

  // Live preview of avatar as username changes
  document.getElementById('edit-username').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (val) {
      document.getElementById('edit-avatar-preview').src =
        currentProfile?.avatar_url || avatarUrl(val);
    }
  });

  // Close
  btnCancel.addEventListener('click', () => closeModal('modal-edit-profile'));
  document.getElementById('close-edit-modal').addEventListener('click', () => closeModal('modal-edit-profile'));

  // Save
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

    // Show spinner
    setSavingState(true);

    // Check if username is taken (only if it changed)
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

    // Update profile in Supabase
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

    // Update local cached profile and re-render
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

// ─── RECENT PICKS ────────────────────────────────────────────────
function loadRecentPicks() {
  const stored = JSON.parse(localStorage.getItem('bitemap_recent_views') || '[]');
  const grid = document.getElementById('recs-grid');

  if (stored.length === 0) return;

  grid.innerHTML = '';

  stored.slice(0, 4).forEach(r => {
    const card = document.createElement('article');
    card.className = 'rec-card';
    card.innerHTML = `
      <div class="rec-image-wrapper">
        <div class="rec-image-placeholder">
          <span>📍</span>
          <p>${r.cuisine_tag || 'Restaurant'}</p>
        </div>
      </div>
      <div class="rec-content">
        <div class="rec-top-row">
          <h3 class="rec-title">${r.name}</h3>
        </div>
        <p class="rec-meta">${r.cuisine_tag || ''} • ${r.city || 'Ontario'}</p>
        <div class="rec-footer">
          <span class="rec-date">Recently viewed</span>
          <a href="explore.html" class="rec-details">Explore →</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
