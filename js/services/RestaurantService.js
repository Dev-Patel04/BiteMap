class RestaurantService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async getRestaurantById(id) {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  async getReviews(restaurantId) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async searchRestaurants(queryText) {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${queryText}%,cuisine_tag.ilike.%${queryText}%`);

    return { data, error };
  }

  async submitReview(userId, restaurantId, rating, comment) {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        star_rating: rating,
        comment: comment || null
      });

    return { data, error };
  }
}

module.exports = { RestaurantService };
