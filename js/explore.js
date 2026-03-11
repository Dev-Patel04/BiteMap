import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const searchDropdown = document.getElementById('search-dropdown');

  let debounceTimer;

  // Listen for input changes
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Toggle clear button
    searchClear.style.display = query.length > 0 ? 'inline' : 'none';

    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      hideDropdown();
      return;
    }

    // Debounce the API call
    debounceTimer = setTimeout(() => {
      fetchSearchResults(query);
    }, 300); // 300ms delay
  });

  // Handle clear button click
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    hideDropdown();
    searchInput.focus();
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  // Show dropdown when input is focused (if there's enough text)
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2) {
      fetchSearchResults(searchInput.value.trim());
    }
  });

  async function fetchSearchResults(query) {
    try {
      // Query Supabase
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, city')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;

      renderResults(data);
    } catch (err) {
      console.error('Error fetching search results:', err);
    }
  }

  function renderResults(results) {
    if (!results || results.length === 0) {
      searchDropdown.innerHTML = '<div class="dropdown-item no-results">No restaurants found</div>';
      searchDropdown.classList.remove('hidden');
      return;
    }

    searchDropdown.innerHTML = '';
    
    results.forEach(restaurant => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      
      // Highlight the matching text
      const regex = new RegExp(`(${searchInput.value.trim()})`, 'gi');
      const highlightedName = restaurant.name.replace(regex, '<strong>$1</strong>');

      item.innerHTML = `
        <span class="dropdown-icon">🍽️</span>
        <div class="dropdown-details">
          <div class="dropdown-name">${highlightedName}</div>
          <div class="dropdown-city">${restaurant.city || ''}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        // Here you would typically navigate to the restaurant page or filter the main view
        // For now, we'll just fill the input
        searchInput.value = restaurant.name;
        hideDropdown();
      });

      searchDropdown.appendChild(item);
    });

    searchDropdown.classList.remove('hidden');
  }

  function hideDropdown() {
    searchDropdown.classList.add('hidden');
  }

  // --- Dynamic Cuisine Filtering ---
  const restaurantList = document.getElementById('restaurant-list');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const cuisineLinks = document.querySelectorAll('.left-sidebar .nav-item[data-cuisine]');

  // Initialize with 'all'
  fetchAndRenderRestaurants('all');

  // Listen to sidebar clicks
  cuisineLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      cuisineLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const cuisine = link.getAttribute('data-cuisine');
      // Remove any non-ASCII characters (emojis) to get the clean cuisine name
      const cuisineName = link.innerText.replace(/[^\x00-\x7F]/g, '').trim();
      
      pageTitle.textContent = cuisineName;
      pageSubtitle.textContent = 'Loading restaurants...';
      
      fetchAndRenderRestaurants(cuisine);
    });
  });

  async function fetchAndRenderRestaurants(cuisine) {
    try {
      restaurantList.innerHTML = '<p style="padding: 2rem;">Fetching restaurants...</p>';
      
      let query = supabase.from('restaurants').select('*');
      
      if (cuisine !== 'all') {
        query = query.eq('cuisine_tag', cuisine);
      }
      
      // We can add ordering or limiting here if needed
      // query = query.limit(20);

      const { data, error } = await query;

      if (error) throw error;

      pageSubtitle.textContent = `Found ${data.length} restaurants in this category`;
      renderRestaurantCards(data);
      
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      pageSubtitle.textContent = 'Error loading restaurants.';
      restaurantList.innerHTML = '<p style="color: red; padding: 2rem;">Failed to load data. Please try again.</p>';
    }
  }

  function renderRestaurantCards(restaurants) {
    if (!restaurants || restaurants.length === 0) {
      restaurantList.innerHTML = '<p style="padding: 2rem; color: #666;">No restaurants found for this category.</p>';
      return;
    }

    restaurantList.innerHTML = '';

    restaurants.forEach(restaurant => {
      const card = document.createElement('article');
      card.className = 'restaurant-card';
      
      // Fallback values
      const priceTag = restaurant.price_tag || 'Standard';
      const cuisineTag = restaurant.cuisine_tag || 'Food';
      // Placeholder image requested by user
      const imageSrc = 'https://dummyimage.com/400x200/cccccc/000000&text=Image+to+be+added';
      
      // Give a random rating between 4.0 and 5.0 for UI purposes since we don't have real ratings yet
      const randomRating = (Math.random() * 1 + 4).toFixed(1);

      card.innerHTML = `
        <div class="card-image-container">
          <img src="${imageSrc}" alt="${restaurant.name}" class="card-image" />
          <div class="card-rating">
            <span class="star">★</span> ${randomRating}
          </div>
        </div>
        <div class="card-content">
          <div class="card-top">
            <div>
              <span class="card-category">${cuisineTag}</span>
              <h2 class="card-title">${restaurant.name}</h2>
            </div>
            <span class="bookmark-btn">🔖</span>
          </div>
          
          <div class="card-location">
            📍 ${restaurant.address || 'Ontario'}, ${restaurant.city || ''}
          </div>
          
          <div class="card-tags">
            <span class="tag">${priceTag.toUpperCase()}</span>
            <span class="tag">${cuisineTag.split('/')[0].toUpperCase()}</span>
          </div>
          
          <div class="card-footer">
            <a href="#" class="visit-link">Visit website ↗</a>
            <button class="view-menu-btn">View Menu</button>
          </div>
        </div>
      `;

      restaurantList.appendChild(card);
    });
  }
});
