import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

let currentUser = null;
let followingList = new Set(); // Set of profile IDs the user is currently following

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session check
  const { data: { session }, error } = await checkSession();

  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = session.user;

  // Initialize Sidebar 
  initSidebar();

  // 2. Load whom the user is already following
  await loadFollowingList();

  // 3. Load lists
  await loadYourFriends();
  loadSuggestedFriends();
  loadNearbyFoodies();

  // 4. Set up Search handler
  const searchInput = document.getElementById('friends-search-input');
  const searchBtn = document.getElementById('friends-search-btn');

  searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch(searchInput.value);
  });
});

// --- Sidebar Initialization ---
async function initSidebar() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', currentUser.id)
    .single();

  if (profile) {
    const nameStr = profile.username || currentUser.email.split('@')[0];
    document.getElementById('sidebar-name').textContent = nameStr;
    document.getElementById('sidebar-handle').textContent = `@${nameStr}`;
    document.getElementById('sidebar-avatar').src = profile.avatar_url 
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=ea7a2b&color=fff&size=88&bold=true`;
  }
  
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
}

// --- Data Fetching ---

async function loadFollowingList() {
  // Fetch IDs of users the current user follows
  const { data, error } = await supabase
    .from('friendships')
    .select('following_id')
    .eq('follower_id', currentUser.id);

  if (!error && data) {
    followingList = new Set(data.map(f => f.following_id));
  }
}

async function loadYourFriends() {
  const section = document.getElementById('your-friends-section');
  const grid = document.getElementById('your-friends-grid');
  
  if (followingList.size === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = '<div class="friends-loading">Loading your friends…</div>';

  try {
    // 1. Fetch profiles of followed users
    const followingArr = Array.from(followingList);
    
    if (followingArr.length === 0) {
      grid.innerHTML = '<div class="friends-empty">No friends found.</div>';
      return;
    }

    const { data: friends, error: friendsError } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .in('id', followingArr);

    if (friendsError) throw friendsError;

    if (!friends || friends.length === 0) {
      grid.innerHTML = '<div class="friends-empty">No friends found.</div>';
      return;
    }

    // 2. Fetch their top recommendations (highest rated review)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('user_id, rating, restaurant_id') // Avoid joining restaurants table if relations are missing
      .in('user_id', followingArr);

    // Build a map of user_id -> top restaurant ID
    const topRecsMap = {};
    if (reviews && reviews.length > 0) {
      const userReviews = {};
      reviews.forEach(r => {
        if (!userReviews[r.user_id]) userReviews[r.user_id] = [];
        userReviews[r.user_id].push(r);
      });

      for (const [userId, userRevs] of Object.entries(userReviews)) {
        const topRev = userRevs.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
        topRecsMap[userId] = topRev.restaurant_id;
      }
    }

    // 3. Fetch restaurant names separately to avoid Supabase join issues
    const restaurantIds = Object.values(topRecsMap).filter(id => id);
    const topRecsNames = {};
    
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);
        
      if (restaurants) {
        const restMap = {};
        restaurants.forEach(r => restMap[r.id] = r.name);
        
        // Map user -> restaurant name
        for (const [userId, restId] of Object.entries(topRecsMap)) {
          topRecsNames[userId] = restMap[restId];
        }
      }
    }

    grid.innerHTML = '';
    friends.forEach(friend => {
      grid.appendChild(createFriendCard(friend, topRecsNames[friend.id]));
    });

  } catch (err) {
    console.error('Error loading your friends:', err);
    grid.innerHTML = '<div class="friends-empty">Failed to load your friends.</div>';
  }
}

async function loadSuggestedFriends() {
  const grid = document.getElementById('suggested-grid');
  grid.innerHTML = '<div class="friends-loading">Loading suggestions…</div>';

  try {
    // Fetch 3 random profiles (not the current user)
    // In a real app, you'd filter out already-followed users, 
    // but without an RPC, we just pull a batch and slice.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .neq('id', currentUser.id)
      .limit(10); // fetch extra to filter

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      grid.innerHTML = '<div class="friends-empty">No suggestions available right now.</div>';
      return;
    }

    // Filter out people we already follow, then take first 3
    const suggestions = profiles.filter(p => !followingList.has(p.id)).slice(0, 3);

    if (suggestions.length === 0) {
      grid.innerHTML = '<div class="friends-empty">You are following everyone!</div>';
      return;
    }

    grid.innerHTML = '';
    suggestions.forEach(user => {
      grid.appendChild(createSuggestedCard(user));
    });

  } catch (err) {
    console.error('Error loading suggestions:', err);
    grid.innerHTML = '<div class="friends-empty">Failed to load suggestions.</div>';
  }
}

async function loadNearbyFoodies() {
  const list = document.getElementById('nearby-list');
  list.innerHTML = '<div class="friends-loading">Loading foodies…</div>';

  try {
    // Fetch different profiles (offset by latest)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .neq('id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Grab 3 users, ideally prioritizing ones we don't follow, but allowing any
    const nearby = profiles.slice(3, 6); // Just grab a different slice for variety

    if (!nearby || nearby.length === 0) {
      list.innerHTML = '<div class="friends-empty">No nearby foodies found.</div>';
      document.getElementById('nearby-section').style.display = 'none';
      return;
    }

    list.innerHTML = '';
    nearby.forEach(user => {
      list.appendChild(createNearbyRow(user));
    });

  } catch (err) {
    console.error('Error loading nearby:', err);
    list.innerHTML = '<div class="friends-empty">Failed to load nearby foodies.</div>';
  }
}

async function handleSearch(query) {
  const q = query.trim();
  const title = document.getElementById('suggested-title');
  const viewAllBtn = document.getElementById('view-all-btn');
  const nearbySection = document.getElementById('nearby-section');
  const yourFriendsSection = document.getElementById('your-friends-section');
  const grid = document.getElementById('suggested-grid');

  if (!q) {
    // Revert to default view
    title.textContent = 'Suggested Friends';
    viewAllBtn.style.display = 'block';
    nearbySection.style.display = 'block';
    loadYourFriends();
    loadSuggestedFriends();
    return;
  }

  // Update UI for search state
  title.textContent = 'Search Results';
  viewAllBtn.style.display = 'none';
  nearbySection.style.display = 'none'; 
  yourFriendsSection.style.display = 'none'; // hide friends section while searching
  grid.innerHTML = '<div class="friends-loading">Searching…</div>';

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .neq('id', currentUser.id)
      .or(`username.ilike.%${q}%,bio.ilike.%${q}%`); 
      // bio search acts as food preference search

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      grid.innerHTML = `<div class="friends-empty">No users found matching "${q}".</div>`;
      return;
    }

    grid.innerHTML = '';
    profiles.forEach(user => {
      grid.appendChild(createSuggestedCard(user));
    });

  } catch (err) {
    console.error('Search error:', err);
    grid.innerHTML = '<div class="friends-empty">Error searching for users.</div>';
  }
}


// --- UI Generation & Logic ---

function getAvatarUrl(user) {
  if (user.avatar_url) return user.avatar_url;
  const name = user.username || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea7a2b&color=fff&size=100&bold=true`;
}

function parseFoodTags(bio) {
  if (!bio) return [];
  // Dummy parsing: if bio has commas, treat as tags. Otherwise just return a generic tag.
  if (bio.includes(',')) {
    return bio.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length < 20).slice(0, 3);
  }
  return [];
}

function createFriendCard(user, topRecommendationName) {
  const name = user.username || 'Unknown User';
  const handle = `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  
  const recText = topRecommendationName ? topRecommendationName : 'No recommendations yet';

  const card = document.createElement('div');
  card.className = 'suggested-card'; // Reuse styled grid card
  card.innerHTML = `
    <div class="suggested-card-top">
      <img src="${getAvatarUrl(user)}" alt="${name}" class="suggested-avatar" />
      <div class="suggested-info">
        <div class="suggested-name">${name}</div>
        <div class="suggested-handle">${handle}</div>
      </div>
    </div>
    <div style="background: var(--c-orange-light); padding: 10px; border-radius: 8px; font-size: 0.85rem; color: var(--c-orange-hover); margin-top: 5px;">
      <strong>Top Pick:</strong><br>
      ${recText}
    </div>
    <button class="follow-btn following" data-id="${user.id}">
      ✓ Following
    </button>
  `;

  attachFollowListener(card.querySelector('.follow-btn'), user.id);
  return card;
}

function createSuggestedCard(user) {
  const isFollowing = followingList.has(user.id);
  const name = user.username || 'Unknown User';
  const handle = `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  
  // Attempt to extract tags from bio, or provide fallbacks to match mockup
  let tags = parseFoodTags(user.bio);
  if (tags.length === 0) tags = ['Foodie', 'Explorer'];

  const tagHtml = tags.map(t => `<span class="food-tag">${t}</span>`).join('');

  const card = document.createElement('div');
  card.className = 'suggested-card';
  card.innerHTML = `
    <div class="suggested-card-top">
      <img src="${getAvatarUrl(user)}" alt="${name}" class="suggested-avatar" />
      <div class="suggested-info">
        <div class="suggested-name">${name}</div>
        <div class="suggested-handle">${handle}</div>
      </div>
    </div>
    <div class="food-tags">
      ${tagHtml}
    </div>
    <button class="follow-btn ${isFollowing ? 'following' : 'not-following'}" data-id="${user.id}">
      ${isFollowing ? '✓ Following' : '👤+ Follow'}
    </button>
  `;

  attachFollowListener(card.querySelector('.follow-btn'), user.id);
  return card;
}

function createNearbyRow(user) {
  const isFollowing = followingList.has(user.id);
  const name = user.username || 'Unknown User';
  
  let tags = parseFoodTags(user.bio);
  const tagsStr = tags.length > 0 ? tags.join(', ') : 'Local Foodie';

  const row = document.createElement('div');
  row.className = 'nearby-row';
  row.innerHTML = `
    <img src="${getAvatarUrl(user)}" alt="${name}" class="nearby-avatar" />
    <div class="nearby-info">
      <div class="nearby-name">${name}</div>
      <div class="nearby-tags">${tagsStr}</div>
    </div>
    <button class="nearby-follow-btn ${isFollowing ? 'following' : 'not-following'}" data-id="${user.id}">
      ${isFollowing ? 'Following' : 'Follow'}
    </button>
  `;

  attachFollowListener(row.querySelector('.nearby-follow-btn'), user.id);
  return row;
}

function attachFollowListener(btn, targetUserId) {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    // Disable temporarily
    btn.disabled = true;
    const isCurrentlyFollowing = followingList.has(targetUserId);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('friendships')
          .delete()
          .match({ follower_id: currentUser.id, following_id: targetUserId });
        
        if (error) throw error;
        followingList.delete(targetUserId);

      } else {
        // Follow
        const { error } = await supabase
          .from('friendships')
          .insert([{ follower_id: currentUser.id, following_id: targetUserId }]);
        
        if (error) throw error;
        followingList.add(targetUserId);
      }

      // Update UI button class and text
      const nowFollowing = followingList.has(targetUserId);
      btn.className = btn.className.replace(/following|not-following/, nowFollowing ? 'following' : 'not-following');
      
      if (btn.classList.contains('nearby-follow-btn')) {
        btn.textContent = nowFollowing ? 'Following' : 'Follow';
      } else {
        btn.innerHTML = nowFollowing ? '✓ Following' : '👤+ Follow';
      }

      // Refresh the "Your Friends" grid dynamically if they unfollow from the "Your Friends" grid itself
      // Wait a moment then reload
      if (!nowFollowing && btn.closest('#your-friends-section')) {
        setTimeout(() => loadYourFriends(), 300);
      }

    } catch (err) {
      console.error('Error toggling follow status:', err);
      alert('Failed to update follow status. Please try again.');
    } finally {
      btn.disabled = false;
    }
  });
}