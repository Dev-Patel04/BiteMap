import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Get restaurant ID from query params
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');

  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const mainContent = document.getElementById('restaurant-main');

  if (!restaurantId) {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    return;
  }

  try {
    // 2. Fetch from Supabase
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) {
      throw new Error('Restaurant not found');
    }

    // 3. Populate DOM
    document.title = `${restaurant.name} - BiteMap`;
    document.getElementById('rest-title').textContent = restaurant.name;
    
    // Quick Info
    const ratingEl = document.querySelector('.rating-score');
    if(ratingEl) {
      // Dummy random rating since we don't have aggregated average stars in the table yet
      ratingEl.textContent = (Math.random() * 1 + 4).toFixed(1);
    }
    
    // Meta string (cuisine, price, city)
    const cuisine = restaurant.cuisine_tag || 'Food';
    const price = restaurant.price_tag ? restaurant.price_tag.toUpperCase() : '$$';
    document.getElementById('rest-meta').textContent = `${cuisine.split('/')[0]} • ${price} • `;

    // Details Grid
    const websiteEl = document.getElementById('rest-website');
    if (restaurant.website_url) {
      websiteEl.textContent = new URL(restaurant.website_url).hostname; // Show just hostname
      websiteEl.href = restaurant.website_url;
      websiteEl.target = '_blank';
    } else {
      websiteEl.textContent = 'Not listed';
      websiteEl.style.color = '#888';
      websiteEl.style.pointerEvents = 'none';
    }

    const addressStr = [restaurant.address, restaurant.city, restaurant.region, restaurant.postal_code]
      .filter(Boolean)
      .join(', ');
    document.getElementById('rest-address').textContent = addressStr || 'Address not listed';

    // Set images randomly from Unsplash to look good like the mockup
    const img1 = document.getElementById('hero-img-1');
    const img2 = document.getElementById('hero-img-2');
    
    const foodKeywords = ['restaurant', 'dining', 'food', cuisine.split('/')[0].toLowerCase() || 'meal'];
    img1.src = `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80`; // Keep aesthetic hero
    img2.src = `https://source.unsplash.com/600x600/?${foodKeywords.join(',')}`;

    // Hide loader, show content
    loadingState.style.display = 'none';
    mainContent.style.display = 'block';

  } catch (err) {
    console.error('Error fetching restaurant detail:', err);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
});
