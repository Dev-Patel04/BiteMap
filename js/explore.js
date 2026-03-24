import { supabase } from './supabase.js';
import { getRandomImage } from './images.js';

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

  // Handle Enter key to search and show results in main area
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        hideDropdown();
        searchByName(query);
      }
    }
  });

  // Handle clear button click — reset to all cuisines
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    hideDropdown();
    searchInput.focus();
    // Reset active sidebar to "All Cuisines"
    const cuisineLinks = document.querySelectorAll('.left-sidebar .nav-item[data-cuisine]');
    cuisineLinks.forEach(l => l.classList.remove('active'));
    const allLink = document.querySelector('.left-sidebar .nav-item[data-cuisine="all"]');
    if (allLink) allLink.classList.add('active');
    document.getElementById('page-title').textContent = 'All Cuisines';
    fetchAndRenderRestaurants('all');
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
      // Query Supabase — match on name OR cuisine_tag
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, city, cuisine_tag')
        .or(`name.ilike.%${query}%,cuisine_tag.ilike.%${query}%`)
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
          <div class="dropdown-city">${restaurant.cuisine_tag || ''} · ${restaurant.city || ''}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        searchInput.value = restaurant.name;
        searchClear.style.display = 'inline';
        hideDropdown();
        // Show this restaurant in the main area
        searchByName(restaurant.name);
      });

      searchDropdown.appendChild(item);
    });

    searchDropdown.classList.remove('hidden');
  }

  function hideDropdown() {
    searchDropdown.classList.add('hidden');
  }

  // Search by name and render results in the main restaurant list area
  async function searchByName(query) {
    const restaurantList = document.getElementById('restaurant-list');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    // Deselect sidebar cuisines
    document.querySelectorAll('.left-sidebar .nav-item[data-cuisine]').forEach(l => l.classList.remove('active'));

    pageTitle.textContent = `Search: "${query}"`;
    pageSubtitle.textContent = 'Searching...';
    restaurantList.innerHTML = '<p style="padding: 2rem;">Searching restaurants...</p>';

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${query}%,cuisine_tag.ilike.%${query}%`);

      if (error) throw error;

      pageSubtitle.textContent = `Found ${data.length} restaurant${data.length !== 1 ? 's' : ''} matching "${query}"`;
      renderRestaurantCards(data);
    } catch (err) {
      console.error('Search error:', err);
      pageSubtitle.textContent = 'Error searching restaurants.';
      restaurantList.innerHTML = '<p style="color: red; padding: 2rem;">Failed to search. Please try again.</p>';
    }
  }

  // --- Dynamic Cuisine Filtering ---
  const restaurantList = document.getElementById('restaurant-list');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const cuisineLinks = document.querySelectorAll('.left-sidebar .nav-item[data-cuisine]');

  // State tracking
  let currentCuisine = 'all';
  let activeFilters = new Set(); // tracks active price filters like 'Cheap', 'Expensive'

  // Initialize with 'all'
  fetchAndRenderRestaurants();

  // --- Filter Pills ---
  const filterPills = document.querySelectorAll('.filter-pill[data-filter]');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.getAttribute('data-filter');

      // Toggle active state
      if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        pill.classList.remove('active');
      } else {
        activeFilters.add(filter);
        pill.classList.add('active');
      }

      // Re-fetch with current cuisine + new filters
      fetchAndRenderRestaurants();
    });
  });

  // Listen to sidebar clicks
  cuisineLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      cuisineLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      currentCuisine = link.getAttribute('data-cuisine');
      // Remove any non-ASCII characters (emojis) to get the clean cuisine name
      const cuisineName = link.innerText.replace(/[^\x00-\x7F]/g, '').trim();
      
      pageTitle.textContent = cuisineName;
      pageSubtitle.textContent = 'Loading restaurants...';
      
      fetchAndRenderRestaurants();
    });
  });

  async function fetchAndRenderRestaurants() {
    try {
      restaurantList.innerHTML = '<p style="padding: 2rem;">Fetching restaurants...</p>';
      
      let query = supabase.from('restaurants').select('*');
      
      if (currentCuisine !== 'all') {
        query = query.eq('cuisine_tag', currentCuisine);
      }

      // Apply price filters (OR between active price filters)
      const priceFilters = [...activeFilters].filter(f => f !== 'Visited');
      if (priceFilters.length === 1) {
        query = query.eq('price_tag', priceFilters[0]);
      } else if (priceFilters.length > 1) {
        query = query.in('price_tag', priceFilters);
      }

      const { data, error } = await query;

      if (error) throw error;

      const filterLabel = activeFilters.size > 0 ? ` (${[...activeFilters].join(', ')})` : '';
      pageSubtitle.textContent = `Found ${data.length} restaurants${filterLabel}`;
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
      const imageSrc = getRandomImage(cuisineTag);
      
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
            <button class="view-menu-btn">View Details</button>
          </div>
        </div>
      `;

      // Track click for recent views and navigate
      card.addEventListener('click', () => {
        addToRecentViews(restaurant);
        window.location.href = `restaurant.html?id=${restaurant.id}`;
      });

      restaurantList.appendChild(card);
    });
  }

  // --- Recent Views ---
  const RECENT_VIEWS_KEY = 'bitemap_recent_views';
  const MAX_RECENT = 5;

  function loadRecentViews() {
    const recentList = document.getElementById('recent-views-list');
    const stored = JSON.parse(localStorage.getItem(RECENT_VIEWS_KEY) || '[]');

    if (stored.length === 0) {
      recentList.innerHTML = '<p style="color: #999; font-size: 0.85rem;">No recent views yet.</p>';
      return;
    }

    recentList.innerHTML = '';
    stored.forEach(r => {
      const card = document.createElement('div');
      card.className = 'recent-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <span class="recent-category">${r.cuisine_tag || 'Restaurant'}</span>
        <h4>${r.name}</h4>
        <div class="recent-rating">
          <span class="star">★</span> ${r.city || 'Ontario'}
        </div>
      `;
      // Clicking a recent view searches for it
      card.addEventListener('click', () => {
        searchInput.value = r.name;
        searchClear.style.display = 'inline';
        searchByName(r.name);
      });
      recentList.appendChild(card);
    });
  }

  function addToRecentViews(restaurant) {
    let stored = JSON.parse(localStorage.getItem(RECENT_VIEWS_KEY) || '[]');

    // Remove if already exists (to move to top)
    stored = stored.filter(r => r.id !== restaurant.id);

    // Add to front
    stored.unshift({
      id: restaurant.id,
      name: restaurant.name,
      city: restaurant.city,
      cuisine_tag: restaurant.cuisine_tag
    });

    // Cap at MAX_RECENT
    if (stored.length > MAX_RECENT) stored = stored.slice(0, MAX_RECENT);

    localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(stored));
    loadRecentViews();
  }

  // Load recent views on page init
  loadRecentViews();
});
