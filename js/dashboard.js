import { supabase } from './supabase.js';
import { checkSession, handleLogout } from './auth.js';
import { getRandomImage } from './images.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check auth session
  const { data: { session } } = await checkSession();

  if (!session) {
    // Anonymous user UI
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) userNameEl.textContent = 'Anonymous User';
    const userTitle = document.querySelector('.user-title');
    if (userTitle) userTitle.style.display = 'none';
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) userAvatar.src = 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff';
    const headerAvatar = document.querySelector('.header-avatar');
    if (headerAvatar) headerAvatar.src = 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff';
    const levelInfo = document.querySelector('.level-info');
    if (levelInfo) levelInfo.style.display = 'none';
    const progressContainer = document.querySelector('.progress-bar-container');
    if (progressContainer) progressContainer.style.display = 'none';
    const xpText = document.querySelector('.xp-text');
    if (xpText) xpText.style.display = 'none';
    const btnProfile = document.querySelector('.btn-profile');
    if (btnProfile) {
      btnProfile.textContent = 'Log In to BiteMap';
      btnProfile.addEventListener('click', () => { window.location.href = 'index.html'; });
    }
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) btnLogout.style.display = 'none';

    // Still show some recommended restaurants (no personalisation)
    await loadRecommended(null);
    renderActivityEmpty('Log in to see what your friends are up to!');
    return;
  }

  const user = session.user;

  // 2. Populate sidebar username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const displayName = profile?.username || user.email.split('@')[0];
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = displayName;

  const userAvatar = document.querySelector('.user-avatar');
  if (userAvatar) {
    userAvatar.src = profile?.avatar_url
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ea7a2b&color=fff&size=96&bold=true`;
  }

  // 3. Logout button
  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      await handleLogout();
    });
  }

  // 4. Load both sections in parallel
  await Promise.allSettled([
    loadRecommended(user.id),
    loadFriendActivity(user.id),
  ]);
});

// ─── RECOMMENDED FOR YOU ───────────────────────────────────────────────────
async function loadRecommended(userId) {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;

  grid.innerHTML = renderSkeletons(3);

  try {
    let preferredCuisines = [];

    if (userId) {
      // 1. Get cuisines from restaurants the user has tagged
      const { data: tags } = await supabase
        .from('user_restaurant_tags')
        .select('restaurant_id')
        .eq('user_id', userId);

      if (tags && tags.length > 0) {
        const taggedIds = tags.map(t => t.restaurant_id);

        const { data: taggedRestaurants } = await supabase
          .from('restaurants')
          .select('cuisine_tag')
          .in('id', taggedIds);

        if (taggedRestaurants) {
          // Count frequency of each cuisine
          const cuisineCounts = {};
          taggedRestaurants.forEach(r => {
            const c = r.cuisine_tag;
            if (c) cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
          });
          // Sort by frequency, take top 3 cuisines
          preferredCuisines = Object.entries(cuisineCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cuisine]) => cuisine);
        }
      }
    }

    let restaurants = [];

    if (preferredCuisines.length > 0) {
      // 2. Fetch restaurants in those cuisines (not already tagged by user)
      const { data: taggedIds } = await supabase
        .from('user_restaurant_tags')
        .select('restaurant_id')
        .eq('user_id', userId);

      const excludeIds = (taggedIds || []).map(t => t.restaurant_id);

      let query = supabase
        .from('restaurants')
        .select('id, name, cuisine_tag, city, price_tag')
        .in('cuisine_tag', preferredCuisines)
        .limit(20);

      const { data } = await query;

      if (data) {
        // Filter out already-tagged restaurants and shuffle
        restaurants = data
          .filter(r => !excludeIds.includes(r.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
      }
    }

    // 3. Fallback: if no preferences yet, show random popular restaurants
    if (restaurants.length < 3) {
      const { data: fallback } = await supabase
        .from('restaurants')
        .select('id, name, cuisine_tag, city, price_tag')
        .limit(50);

      if (fallback) {
        const existing = new Set(restaurants.map(r => r.id));
        const extras = fallback
          .filter(r => !existing.has(r.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3 - restaurants.length);
        restaurants = [...restaurants, ...extras];
      }
    }

    if (!restaurants || restaurants.length === 0) {
      grid.innerHTML = '<p style="color:#999;padding:1rem">No recommendations found.</p>';
      return;
    }

    grid.innerHTML = '';
    restaurants.forEach(r => {
      const card = document.createElement('div');
      card.className = 'restaurant-card';
      card.style.cursor = 'pointer';

      const price = (r.price_tag || 'Standard').toUpperCase();
      const cuisine = r.cuisine_tag || 'Food';
      const imgSrc = getRandomImage(cuisine);
      const rating = (Math.random() * 0.8 + 4.1).toFixed(1);

      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imgSrc}" alt="${r.name}" class="card-image" loading="lazy">
          <div class="rating-badge">
            <span class="star-icon">★</span> ${rating}
          </div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${r.name}</h3>
          <p class="card-subtitle">${cuisine} • ${price} • ${r.city || 'Ontario'}</p>
          <div class="card-tags">
            <span class="tag tag-grey">${cuisine.split('/')[0].toUpperCase()}</span>
            <span class="tag tag-orange">FOR YOU</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.href = `restaurant.html?id=${r.id}`;
      });

      grid.appendChild(card);
    });

    // Update the "see all" link to explore with the top cuisine pre-filtered
    const seeAllLink = document.getElementById('recommended-see-all');
    if (seeAllLink && preferredCuisines.length > 0) {
      seeAllLink.href = `explore.html`;
      seeAllLink.textContent = 'See all matches';
    }

  } catch (err) {
    console.error('Error loading recommendations:', err);
    grid.innerHTML = '<p style="color:#999;padding:1rem">Could not load recommendations.</p>';
  }
}

// ─── FRIEND ACTIVITY ──────────────────────────────────────────────────────
async function loadFriendActivity(userId) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  feed.innerHTML = renderSkeletons(2);

  try {
    // 1. Get list of people this user follows
    const { data: friendships } = await supabase
      .from('friendships')
      .select('following_id')
      .eq('follower_id', userId);

    if (!friendships || friendships.length === 0) {
      renderActivityEmpty('Follow some friends to see their activity here!');
      return;
    }

    const friendIds = friendships.map(f => f.following_id);

    // 2. Fetch recent reviews from those friends (with restaurant & profile info)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, user_id, restaurant_id, star_rating, comment, created_at, profiles(username, avatar_url), restaurants(id, name, cuisine_tag)')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!reviews || reviews.length === 0) {
      renderActivityEmpty('Your friends haven\'t posted any reviews yet. Be the first!');
      return;
    }

    feed.innerHTML = '';
    reviews.forEach(review => {
      const username = review.profiles?.username || 'A friend';
      const restaurantName = review.restaurants?.name || 'a restaurant';
      const restaurantId = review.restaurants?.id || review.restaurant_id;
      const cuisine = review.restaurants?.cuisine_tag || '';
      const avatarUrl = review.profiles?.avatar_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ea7a2b&color=fff&size=48&bold=true`;
      const timeAgo = getTimeAgo(new Date(review.created_at));
      const stars = '★'.repeat(review.star_rating || 0) + '☆'.repeat(5 - (review.star_rating || 0));

      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <img src="${avatarUrl}" alt="${username}" class="activity-avatar">
        <div class="activity-content">
          <div class="activity-meta">
            <span class="activity-user">${username}</span> reviewed
            <span class="activity-restaurant" style="cursor:pointer; text-decoration:underline" data-id="${restaurantId}">${restaurantName}</span>
          </div>
          <div class="activity-time">${timeAgo}</div>
          <div class="activity-stars" style="color:#F59E0B;font-size:1rem;margin:4px 0">${stars}</div>
          ${review.comment
            ? `<p class="activity-review">"${escapeHtml(review.comment)}"</p>`
            : `<p class="activity-review" style="color:#bbb;font-style:italic">Rating only — no written review.</p>`
          }
        </div>
      `;

      // Click restaurant name → goes to restaurant page
      item.querySelector('.activity-restaurant').addEventListener('click', () => {
        window.location.href = `restaurant.html?id=${restaurantId}`;
      });

      feed.appendChild(item);
    });

  } catch (err) {
    console.error('Error loading friend activity:', err);
    renderActivityEmpty('Could not load friend activity.');
  }
}

function renderActivityEmpty(message) {
  const feed = document.getElementById('activity-feed');
  if (feed) {
    feed.innerHTML = `<p style="color:#999;text-align:center;padding:2rem 1rem;font-size:0.95rem">${message}</p>`;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function renderSkeletons(count) {
  return Array.from({ length: count }, () => `
    <div style="background:var(--c-surface,#1e1e1e);border-radius:12px;overflow:hidden;animation:pulse 1.5s ease-in-out infinite">
      <div style="height:160px;background:#2a2a2a"></div>
      <div style="padding:1rem">
        <div style="height:14px;background:#2a2a2a;border-radius:4px;margin-bottom:8px;width:70%"></div>
        <div style="height:12px;background:#2a2a2a;border-radius:4px;width:50%"></div>
      </div>
    </div>
  `).join('');
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
