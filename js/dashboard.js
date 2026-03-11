import { checkSession, handleLogout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check if user is logged in
  const { data: { session }, error } = await checkSession();
  
  // 2. Protect route: if no session, setup anonymous features
  if (!session) {
    // Change User identity
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) userNameEl.textContent = 'Anonymous User';
    
    const userTitle = document.querySelector('.user-title');
    if (userTitle) userTitle.style.display = 'none';

    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) userAvatar.src = 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff';
    
    const headerAvatar = document.querySelector('.header-avatar');
    if (headerAvatar) headerAvatar.src = 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff';

    // Hide level/progress info
    const levelInfo = document.querySelector('.level-info');
    if (levelInfo) levelInfo.style.display = 'none';
    const progressContainer = document.querySelector('.progress-bar-container');
    if (progressContainer) progressContainer.style.display = 'none';
    const xpText = document.querySelector('.xp-text');
    if (xpText) xpText.style.display = 'none';

    // Hide the "My Reviews" nav item
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length >= 4) navItems[3].style.display = 'none';

    // Transform Profile/Logout buttons
    const btnProfile = document.querySelector('.btn-profile');
    if (btnProfile) {
      btnProfile.textContent = 'Log In to BiteMap';
      btnProfile.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) btnLogout.style.display = 'none';

    return;
  }

  // 3. Populate Profile Info
  const user = session.user;
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl && user.email) {
    // For now we'll just display their email as their name since we haven't built a profile form
    userNameEl.textContent = user.email.split('@')[0]; 
  }

  // 4. Handle Logout Button
  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      await handleLogout();
      // HandleLogout redirects to index.html internally on success.
    });
  }
});
