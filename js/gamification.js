/**
 * gamification.js
 * BiteMap XP / Levelling Engine + Badge System
 *
 * XP Awards:
 *   Write a Review  → +20 XP
 *   Quick Rate      → +10 XP
 *   Tag Restaurant  → +5  XP  (add only, not remove)
 *
 * Level formula: max XP at level N  =  N * 100
 *
 * Badges: evaluated client-side, persisted in profiles.badges (jsonb array)
 */

import { supabase } from './supabase.js';

// ─── XP award map ──────────────────────────────────────────────────
export const XP_REWARDS = {
  review: 20,
  rate:   10,
  tag:    5,
};

// ─── Badge catalogue ──────────────────────────────────────────────
export const BADGES = [
  {
    id:          'first_bite',
    name:        'First Bite',
    icon:        '🍴',
    description: 'Write your first review',
    check:       (s) => s.reviewCount >= 1,
  },
  {
    id:          'sushi_scout',
    name:        'Sushi Scout',
    icon:        '🍣',
    description: 'Tag or review an Asian restaurant',
    check:       (s) => s.cuisines.has('Asian'),
  },
  {
    id:          'super_eater',
    name:        'Super Eater',
    icon:        '🏆',
    description: 'Write 10 reviews',
    check:       (s) => s.reviewCount >= 10,
  },
  {
    id:          'wishlist_warrior',
    name:        'Wishlist Warrior',
    icon:        '📋',
    description: 'Add 5 restaurants to "Want to go"',
    check:       (s) => s.wantToGoCount >= 5,
  },
  {
    id:          'neighbourhood_explorer',
    name:        'Neighbourhood Explorer',
    icon:        '🗺️',
    description: 'Visit 5 different restaurants',
    check:       (s) => s.visitedCount >= 5,
  },
  {
    id:          'five_star_fanatic',
    name:        'Five-Star Fanatic',
    icon:        '⭐',
    description: 'Give 5 five-star ratings',
    check:       (s) => s.fiveStarCount >= 5,
  },
  {
    id:          'social_butterfly',
    name:        'Social Butterfly',
    icon:        '🦋',
    description: 'Follow 3 friends',
    check:       (s) => s.followingCount >= 3,
  },
  {
    id:          'cuisine_hopper',
    name:        'Cuisine Hopper',
    icon:        '🌍',
    description: 'Explore 3 different cuisine types',
    check:       (s) => s.cuisines.size >= 3,
  },
  {
    id:          'pit_master',
    name:        'Pit Master',
    icon:        '🔥',
    description: 'Tag or review a BBQ/Smokehouse restaurant',
    check:       (s) => s.cuisines.has('BBQ/Smokehouse'),
  },
  {
    id:          'fine_diner',
    name:        'Fine Diner',
    icon:        '🍷',
    description: 'Tag or review a Fine Dining restaurant',
    check:       (s) => s.cuisines.has('Fine Dining'),
  },
  {
    id:          'coffee_connoisseur',
    name:        'Coffee Connoisseur',
    icon:        '☕',
    description: 'Tag or review a Café or Bakery',
    check:       (s) => s.cuisines.has('Cafe/Bakery'),
  },
  {
    id:          'loyal_regular',
    name:        'Loyal Regular',
    icon:        '❤️',
    description: 'Mark 3 restaurants as "Would go again"',
    check:       (s) => s.wouldGoAgainCount >= 3,
  },
  {
    id:          'critic',
    name:        'The Critic',
    icon:        '📝',
    description: 'Write 5 reviews with written comments',
    check:       (s) => s.reviewsWithComments >= 5,
  },
];

// ─── Main XP entry point ───────────────────────────────────────────
export async function addXP(userId, amount, label) {
  if (!userId || !amount) return;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.warn('[Gamification] Could not fetch profile:', error?.message);
      return;
    }

    let newXP    = (profile.xp    || 0) + amount;
    let newLevel = (profile.level || 1);
    let didLevelUp = false;

    while (newXP >= newLevel * 100) {
      newXP   -= newLevel * 100;
      newLevel += 1;
      didLevelUp = true;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);

    if (updateError) {
      console.warn('[Gamification] Could not update profile:', updateError.message);
      return;
    }

    if (didLevelUp) showLevelUpToast(newLevel);
    showXPToast(amount, label, newXP, newLevel);

    // Non-blocking badge check after every XP action
    checkAndAwardBadges(userId);

  } catch (err) {
    console.error('[Gamification] Unexpected error:', err);
  }
}

// ─── Badge Engine ─────────────────────────────────────────────────
async function fetchBadgeStats(userId) {
  const [
    { data: reviews },
    { data: tags },
    { count: followingCount },
    { data: reviewedRests },
  ] = await Promise.all([
    supabase.from('reviews').select('star_rating, comment').eq('user_id', userId),
    supabase.from('user_restaurant_tags').select('tag, restaurants(cuisine_tag)').eq('user_id', userId),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('reviews').select('restaurants(cuisine_tag)').eq('user_id', userId),
  ]);

  const reviewCount          = reviews?.length || 0;
  const fiveStarCount        = reviews?.filter(r => r.star_rating === 5).length || 0;
  const reviewsWithComments  = reviews?.filter(r => r.comment?.trim()).length || 0;
  const wantToGoCount        = tags?.filter(t => t.tag === 'Want to go').length || 0;
  const visitedCount         = tags?.filter(t => t.tag === 'Visited').length || 0;
  const wouldGoAgainCount    = tags?.filter(t => t.tag === 'Would go again').length || 0;

  const cuisines = new Set();
  tags?.forEach(t => { if (t.restaurants?.cuisine_tag) cuisines.add(t.restaurants.cuisine_tag); });
  reviewedRests?.forEach(r => { if (r.restaurants?.cuisine_tag) cuisines.add(r.restaurants.cuisine_tag); });

  return { reviewCount, fiveStarCount, reviewsWithComments, wantToGoCount, visitedCount, wouldGoAgainCount, cuisines, followingCount: followingCount || 0 };
}

export async function checkAndAwardBadges(userId) {
  if (!userId) return;
  try {
    const { data: profile, error } = await supabase
      .from('profiles').select('badges').eq('id', userId).single();

    if (error) { console.warn('[Badges] Could not fetch profile:', error.message); return; }

    const earnedIds   = new Set(profile?.badges || []);
    const stats       = await fetchBadgeStats(userId);
    const newlyEarned = BADGES.filter(b => !earnedIds.has(b.id) && b.check(stats));

    if (newlyEarned.length === 0) return;

    newlyEarned.forEach(b => earnedIds.add(b.id));
    const { error: saveError } = await supabase
      .from('profiles').update({ badges: [...earnedIds] }).eq('id', userId);

    if (saveError) { console.warn('[Badges] Could not save badges:', saveError.message); return; }

    newlyEarned.forEach((badge, i) => setTimeout(() => showBadgeToast(badge), i * 800));

  } catch (err) {
    console.error('[Badges] Unexpected error:', err);
  }
}

// ─── Toast stack manager ───────────────────────────────────────────
const _activeToasts = [];
const TOAST_GAP     = 12;
const TOAST_BOTTOM  = 28;

function _pushToast(toastEl, duration) {
  ensureStylesInjected();
  document.body.appendChild(toastEl);
  _activeToasts.push(toastEl);
  _restack();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toastEl.classList.add('gm-toast-visible'));
  });

  setTimeout(() => {
    toastEl.classList.remove('gm-toast-visible');
    toastEl.addEventListener('transitionend', () => {
      const idx = _activeToasts.indexOf(toastEl);
      if (idx !== -1) _activeToasts.splice(idx, 1);
      toastEl.remove();
      _restack();
    }, { once: true });
  }, duration);
}

function _restack() {
  let offset = TOAST_BOTTOM;
  for (let i = _activeToasts.length - 1; i >= 0; i--) {
    const el = _activeToasts[i];
    el.style.bottom = `${offset}px`;
    offset += (el.offsetHeight || 90) + TOAST_GAP;
  }
}

// ─── Toast: XP Gained ─────────────────────────────────────────────
function showXPToast(amount, label, currentXP, level) {
  const toast = document.createElement('div');
  toast.className = 'gm-toast gm-xp-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const maxXP = level * 100;
  const pct   = Math.min((currentXP / maxXP) * 100, 100);

  toast.innerHTML = `
    <div class="gm-toast-icon">⚡</div>
    <div class="gm-toast-body">
      <div class="gm-toast-title">+${amount} XP — ${label}</div>
      <div class="gm-toast-sub">Level ${level} · ${currentXP} / ${maxXP} XP</div>
      <div class="gm-xp-bar-wrap"><div class="gm-xp-bar-fill" style="width:${pct}%"></div></div>
    </div>
  `;
  _pushToast(toast, 3500);
}

// ─── Toast: Level Up ──────────────────────────────────────────────
function showLevelUpToast(newLevel) {
  const toast = document.createElement('div');
  toast.className = 'gm-toast gm-levelup-toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="gm-levelup-glow"></div>
    <div class="gm-levelup-icon">🏆</div>
    <div class="gm-toast-body">
      <div class="gm-levelup-title">LEVEL UP!</div>
      <div class="gm-levelup-sub">You reached <strong>Level ${newLevel}</strong> — keep exploring!</div>
    </div>
  `;
  _pushToast(toast, 4500);
}

// ─── Toast: Badge Unlocked ────────────────────────────────────────
function showBadgeToast(badge) {
  const toast = document.createElement('div');
  toast.className = 'gm-toast gm-badge-toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="gm-badge-glow"></div>
    <div class="gm-badge-icon">${badge.icon}</div>
    <div class="gm-toast-body">
      <div class="gm-badge-label">BADGE UNLOCKED</div>
      <div class="gm-badge-name">${badge.name}</div>
      <div class="gm-toast-sub">${badge.description}</div>
    </div>
  `;
  _pushToast(toast, 5000);
}

// ─── Inject CSS once ──────────────────────────────────────────────
let stylesInjected = false;
function ensureStylesInjected() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .gm-toast {
      position: fixed; right: 28px; bottom: 28px; z-index: 99999;
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; border-radius: 16px;
      min-width: 280px; max-width: 340px;
      backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
      opacity: 0; transform: translateY(16px) scale(0.95);
      transition: opacity 0.35s cubic-bezier(0.16,1,0.3,1),
                  transform 0.35s cubic-bezier(0.16,1,0.3,1),
                  bottom 0.3s cubic-bezier(0.4,0,0.2,1);
      pointer-events: none;
    }
    .gm-toast.gm-toast-visible { opacity: 1; transform: translateY(0) scale(1); }

    /* XP toast */
    .gm-xp-toast { background: rgba(20,20,20,0.92); border: 1px solid rgba(255,107,43,0.35); }
    .gm-toast-icon { font-size: 1.6rem; flex-shrink: 0; animation: gm-bounce 0.5s ease; }
    .gm-toast-body { flex: 1; min-width: 0; }
    .gm-toast-title { font-family:'Outfit','Inter',sans-serif; font-size:.95rem; font-weight:700; color:#ff8c55; margin-bottom:2px; }
    .gm-toast-sub { font-size:.76rem; color:#888; margin-bottom:8px; }
    .gm-xp-bar-wrap { height:5px; border-radius:99px; background:rgba(255,255,255,0.07); overflow:hidden; }
    .gm-xp-bar-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#ff6b2b,#ffaa55); transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }

    /* Level-Up toast */
    .gm-levelup-toast { background:rgba(18,14,4,0.97); border:1px solid rgba(251,191,36,0.5); position:relative; overflow:hidden; }
    .gm-levelup-glow { position:absolute; inset:0; background:radial-gradient(ellipse 80% 80% at 50% -10%, rgba(251,191,36,0.22) 0%, transparent 65%); pointer-events:none; }
    .gm-levelup-icon { font-size:2.2rem; flex-shrink:0; animation:gm-spin 0.6s ease; position:relative; z-index:1; }
    .gm-levelup-title { font-family:'Outfit','Inter',sans-serif; font-size:1.05rem; font-weight:900; letter-spacing:.8px; background:linear-gradient(90deg,#fbbf24,#fde68a,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gm-shimmer 1.5s linear infinite; background-size:200% 100%; }
    .gm-levelup-sub { font-size:.8rem; color:#a0a0a0; margin-top:3px; position:relative; z-index:1; }
    .gm-levelup-sub strong { color:#fbbf24; }

    /* Badge Unlock toast — purple theme */
    .gm-badge-toast { background:rgba(12,8,24,0.97); border:1px solid rgba(167,139,250,0.5); position:relative; overflow:hidden; }
    .gm-badge-glow { position:absolute; inset:0; background:radial-gradient(ellipse 80% 80% at 50% -10%, rgba(167,139,250,0.2) 0%, transparent 65%); pointer-events:none; }
    .gm-badge-icon { font-size:2.2rem; flex-shrink:0; animation:gm-spin 0.6s ease; position:relative; z-index:1; }
    .gm-badge-label { font-family:'Outfit','Inter',sans-serif; font-size:.65rem; font-weight:700; letter-spacing:1.2px; color:#a78bfa; text-transform:uppercase; margin-bottom:2px; position:relative; z-index:1; }
    .gm-badge-name { font-family:'Outfit','Inter',sans-serif; font-size:1rem; font-weight:800; background:linear-gradient(90deg,#c4b5fd,#f0e6ff,#c4b5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gm-shimmer 2s linear infinite; background-size:200% 100%; position:relative; z-index:1; }
    .gm-badge-toast .gm-toast-sub { margin-top:2px; margin-bottom:0; position:relative; z-index:1; }

    @keyframes gm-bounce { 0%{transform:scale(0.8)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
    @keyframes gm-spin { 0%{transform:rotate(-20deg) scale(0.7)} 60%{transform:rotate(12deg) scale(1.15)} 100%{transform:rotate(0deg) scale(1)} }
    @keyframes gm-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  `;
  document.head.appendChild(style);
}
