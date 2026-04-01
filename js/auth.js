import { supabase } from './supabase.js';

export async function handleSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  // Initialise profile row with level 1 and 0 XP for every new user
  if (!error && data?.user) {
    const username = email.split('@')[0];
    await supabase.from('profiles').upsert(
      {
        id:       data.user.id,
        username: username,
        level:    1,
        xp:       0,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  return { data, error };
}

export async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { data, error };
}

export async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = 'index.html';
  }
  return { error };
}

export async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}
