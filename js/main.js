// BiteMap — main.js
// Handles: sticky nav, mobile hamburger menu, smooth scroll, auth modal

import { handleSignUp, handleLogin } from './auth.js';

let isLoginMode = true;

// Expose functions globally for inline onclick handlers in index.html
window.openAuthModal = function(mode = 'login') {
  const modal = document.getElementById('auth-modal-overlay');
  if (!modal) return;
  
  isLoginMode = mode === 'login';
  updateModalUI();
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal-overlay');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-form').reset();
};

window.toggleAuthMode = function() {
  isLoginMode = !isLoginMode;
  updateModalUI();
};

function updateModalUI() {
  const title = document.getElementById('auth-modal-title');
  const subtitle = document.getElementById('auth-modal-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleText = document.getElementById('auth-toggle-text');
  const errorEl = document.getElementById('auth-error');
  
  errorEl.textContent = ''; // clear errors on toggle

  if (isLoginMode) {
    title.textContent = 'Welcome Back';
    subtitle.textContent = 'Log in to track your favorite spots.';
    submitBtn.textContent = 'Log In';
    toggleText.innerHTML = `Don't have an account? <button type="button" class="btn-text" onclick="toggleAuthMode()">Sign up</button>`;
  } else {
    title.textContent = 'Join BiteMap';
    subtitle.textContent = 'Create a free account to get started.';
    submitBtn.textContent = 'Sign Up';
    toggleText.innerHTML = `Already have an account? <button type="button" class="btn-text" onclick="toggleAuthMode()">Log in</button>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Sticky Navbar ─── */
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ─── Hamburger / Mobile Menu ─── */
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when a link inside it is clicked
  mobileMenu.querySelectorAll('a, .btn').forEach(el => {
    el.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  /* ─── Scroll-reveal for feature cards and steps ─── */
  const revealEls = document.querySelectorAll('.feature-card, .step-item, .cta-box');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.55s ease both';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${i * 0.08}s`;
    observer.observe(el);
  });

  /* ─── Auth Form Submission ─── */
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errorEl = document.getElementById('auth-error');
      const submitBtn = document.getElementById('auth-submit-btn');
      
      errorEl.textContent = '';
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Please wait...';
      submitBtn.disabled = true;

      try {
        let result;
        if (isLoginMode) {
          result = await handleLogin(email, password);
        } else {
          result = await handleSignUp(email, password);
        }

        if (result.error) {
          errorEl.textContent = result.error.message;
        } else {
          // Success! Redirect.
          // If signup, user might need to check email depending on supabase settings, 
          // but we'll try to redirect them to dashboard either way for now.
          window.location.href = 'dashboard.html';
        }
      } catch (err) {
        errorEl.textContent = 'An unexpected error occurred.';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeAuthModal();
  });

});
