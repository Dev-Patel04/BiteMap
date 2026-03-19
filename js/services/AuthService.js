class AuthService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async signUp(email, password) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  async login(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async checkSession() {
    const { data, error } = await this.supabase.auth.getSession();
    return { data, error };
  }
}

module.exports = { AuthService };
