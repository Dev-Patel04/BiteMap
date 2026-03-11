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
});
