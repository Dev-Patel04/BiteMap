import { supabase } from './supabase.js';
import { checkSession } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check session
  const { data: { session }, error } = await checkSession();

  if (!session) {
    // Not logged in — redirect to login
    window.location.href = 'index.html';
    return;
  }

  const user = session.user;

  // 2. Fetch profile from Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    document.getElementById('profile-name').textContent = user.email.split('@')[0];
    document.getElementById('profile-handle').textContent = `@${user.email.split('@')[0]}`;
    document.getElementById('profile-bio').textContent = 'Welcome to BiteMap!';
    return;
  }

  // 3. Populate profile fields
  const displayName = profile.username || user.email.split('@')[0];

  document.getElementById('profile-name').textContent = displayName;
  document.getElementById('profile-handle').textContent = `@${displayName}`;
  document.getElementById('profile-bio').textContent = profile.bio || 'Welcome to BiteMap! Add a bio to tell others about your food journey.';

  // Avatar — use profile avatar_url, or generate from initials
  const avatarEl = document.getElementById('profile-avatar');
  if (profile.avatar_url) {
    avatarEl.src = profile.avatar_url;
  } else {
    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ea7a2b&color=fff&size=150&bold=true`;
  }
  avatarEl.alt = displayName;

  // Level & XP
  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const xpForNextLevel = level * 100; // Simple formula: each level requires level * 100 XP
  const progress = Math.min((xp % xpForNextLevel) / xpForNextLevel * 100, 100);

  document.getElementById('stat-level').textContent = level;
  document.getElementById('stat-xp').textContent = `${xp} XP`;
  document.getElementById('level-progress-fill').style.width = `${progress}%`;

  // 4. Fetch review count
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  document.getElementById('stat-reviews').textContent = reviewCount || 0;

  // 5. Fetch follower / following counts
  const { count: followerCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', user.id);

  const { count: followingCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user.id);

  document.getElementById('stat-followers').textContent = formatCount(followerCount || 0);
  document.getElementById('stat-following').textContent = formatCount(followingCount || 0);

  // 6. Update recommendations title
  document.getElementById('recs-title').textContent = `${displayName}'s Top Picks`;

  // 7. Load recent views from localStorage for recommendations
  loadRecentPicks();
});

function formatCount(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function loadRecentPicks() {
  const stored = JSON.parse(localStorage.getItem('bitemap_recent_views') || '[]');
  const grid = document.getElementById('recs-grid');

  if (stored.length === 0) return; // keep default placeholder

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
