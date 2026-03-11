import { checkSession, handleLogout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check if user is logged in
  const { data: { session }, error } = await checkSession();
  
  // 2. Protect route: if no session, send them to login page
  if (!session) {
    window.location.href = 'index.html';
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
