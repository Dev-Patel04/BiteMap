// BiteMap — main.js
// Handles: sticky nav, mobile hamburger menu, smooth scroll

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

});
