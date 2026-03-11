import { supabase } from './supabase.js';

export async function handleSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
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
