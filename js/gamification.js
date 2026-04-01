/**
 * gamification.js
 * BiteMap XP / Levelling Engine
 *
 * XP Awards:
 *   Write a Review  → +20 XP
 *   Quick Rate      → +10 XP
 *   Tag Restaurant  → +5  XP  (add only, not remove)
 *
 * Level formula: max XP at level N  =  N * 100
 *   L1: 0–99 XP, L2: 100–199 XP, L3: 200–299 XP …
 */

import { supabase } from './supabase.js';

// ─── XP award map (exported for labelling in toasts) ──────────────
export const XP_REWARDS = {
  review:  20,
  rate:    10,
  tag:     5,
};

// ─── Main entry point ─────────────────────────────────────────────
/**
 * Award XP to the current user and display a toast.
 * @param {string} userId   - Supabase user ID
 * @param {number} amount   - XP to add (use XP_REWARDS constants)
 * @param {string} label    - Short description shown in the toast (e.g. "Review Written")
 */
export async function addXP(userId, amount, label) {
  if (!userId || !amount) return;

  try {
    // 1. Fetch current profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.warn('[Gamification] Could not fetch profile:', error?.message);
      return;
    }

    // 2. Calculate new XP and level
    let newXP    = (profile.xp    || 0) + amount;
    let newLevel = (profile.level || 1);

    // Carry XP across multiple level-ups in one reward
    let didLevelUp = false;
    while (newXP >= newLevel * 100) {
      newXP   -= newLevel * 100;
      newLevel += 1;
      didLevelUp = true;
    }

    // 3. Persist to Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);

    if (updateError) {
      console.warn('[Gamification] Could not update profile:', updateError.message);
      return;
    }

    // 4. Show toast(s)
    if (didLevelUp) {
      showLevelUpToast(newLevel);
    }
    showXPToast(amount, label, newXP, newLevel);

  } catch (err) {
    console.error('[Gamification] Unexpected error:', err);
  }
}

// ─── Toast stack manager ───────────────────────────────────────────
// Keeps track of every live toast so they stack cleanly above each other.
const _activeToasts = [];
const TOAST_GAP     = 12;   // px between toasts
const TOAST_BOTTOM  = 28;   // px from viewport bottom for the lowest toast

function _pushToast(toastEl, duration) {
  ensureStylesInjected();
  document.body.appendChild(toastEl);
  _activeToasts.push(toastEl);
  _restack();

  // Entrance — run on the next paint so CSS transition fires
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
  // Position toasts bottom-up: lowest index = lowest on screen
  let offset = TOAST_BOTTOM;
  for (let i = _activeToasts.length - 1; i >= 0; i--) {
    const el = _activeToasts[i];
    el.style.bottom = `${offset}px`;
    // Measure after paint for accurate height (use offsetHeight w/ fallback)
    offset += (el.offsetHeight || 90) + TOAST_GAP;
  }
}

// ─── Toast: XP Gained ─────────────────────────────────────────────
function showXPToast(amount, label, currentXP, level) {
  ensureStylesInjected();

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
      <div class="gm-xp-bar-wrap">
        <div class="gm-xp-bar-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;

  _pushToast(toast, 3500);
}

// ─── Toast: Level Up ──────────────────────────────────────────────
function showLevelUpToast(newLevel) {
  ensureStylesInjected();

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

// ─── Inject CSS once ──────────────────────────────────────────────
let stylesInjected = false;
function ensureStylesInjected() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    /* ── Gamification Toasts ── */
    .gm-toast {
      position: fixed;
      right: 28px;
      bottom: 28px;         /* overridden per-toast by _restack() */
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-radius: 16px;
      min-width: 280px;
      max-width: 340px;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }
    .gm-toast.gm-toast-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* XP toast — orange accent */
    .gm-xp-toast {
      background: rgba(20, 20, 20, 0.92);
      border: 1px solid rgba(255, 107, 43, 0.35);
    }
    .gm-toast-icon {
      font-size: 1.6rem;
      flex-shrink: 0;
      animation: gm-bounce 0.5s ease;
    }
    .gm-toast-body { flex: 1; min-width: 0; }
    .gm-toast-title {
      font-family: 'Outfit', 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #ff8c55;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .gm-toast-sub {
      font-size: 0.76rem;
      color: #888;
      margin-bottom: 8px;
    }
    .gm-xp-bar-wrap {
      height: 5px;
      border-radius: 99px;
      background: rgba(255,255,255,0.07);
      overflow: hidden;
    }
    .gm-xp-bar-fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #ff6b2b, #ffaa55);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Level-Up toast — gold gradient */
    .gm-levelup-toast {
      background: rgba(18, 14, 4, 0.97);
      border: 1px solid rgba(251, 191, 36, 0.5);
      position: relative;
      overflow: hidden;
    }
    .gm-levelup-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 80% at 50% -10%,
                  rgba(251, 191, 36, 0.22) 0%, transparent 65%);
      pointer-events: none;
    }
    .gm-levelup-icon {
      font-size: 2.2rem;
      flex-shrink: 0;
      animation: gm-spin 0.6s ease;
      position: relative;
      z-index: 1;
    }
    .gm-levelup-title {
      font-family: 'Outfit', 'Inter', sans-serif;
      font-size: 1.05rem;
      font-weight: 900;
      letter-spacing: 0.8px;
      background: linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gm-shimmer 1.5s linear infinite;
      background-size: 200% 100%;
    }
    .gm-levelup-sub {
      font-size: 0.8rem;
      color: #a0a0a0;
      margin-top: 3px;
      position: relative;
      z-index: 1;
    }
    .gm-levelup-sub strong { color: #fbbf24; }

    /* Keyframes */
    @keyframes gm-bounce {
      0%   { transform: scale(0.8); }
      60%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes gm-spin {
      0%   { transform: rotate(-20deg) scale(0.7); }
      60%  { transform: rotate(12deg) scale(1.15); }
      100% { transform: rotate(0deg) scale(1); }
    }
    @keyframes gm-shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
  `;

  document.head.appendChild(style);
}

