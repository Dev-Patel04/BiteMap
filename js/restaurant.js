import { supabase } from './supabase.js';
import { checkSession } from './auth.js';
import { getRandomImage } from './images.js';

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

  // Check auth session
  const { data: { session } } = await checkSession();
  const currentUser = session?.user || null;

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
    
    // Meta string (cuisine, price, city)
    const cuisine = restaurant.cuisine_tag || 'Food';
    const price = restaurant.price_tag ? restaurant.price_tag.toUpperCase() : '$$';
    document.getElementById('rest-meta').textContent = `${cuisine.split('/')[0]} • ${price} • `;

    // Details Grid
    const websiteEl = document.getElementById('rest-website');
    if (restaurant.website_url) {
      websiteEl.textContent = new URL(restaurant.website_url).hostname;
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

    // Set images — random photo from the cuisine's image pool
    const img1 = document.getElementById('hero-img-1');
    const img2 = document.getElementById('hero-img-2');
    img1.src = getRandomImage(cuisine);
    img2.src = getRandomImage(cuisine);

    // Hide loader, show content
    loadingState.style.display = 'none';
    mainContent.style.display = 'block';

    // 4. Load reviews & average rating
    await loadReviews(restaurantId);

    // 5. Wire up modals
    setupReviewModal(restaurantId, currentUser);
    setupRateModal(restaurantId, currentUser);

    // 6. Wire up tag buttons
    setupTagButtons(restaurantId, currentUser);

  } catch (err) {
    console.error('Error fetching restaurant detail:', err);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
});

// ─── LOAD REVIEWS & AVERAGE ───
async function loadReviews(restaurantId) {
  const reviewsList = document.getElementById('reviews-list');
  const avgNumber = document.getElementById('avg-rating-number');
  const avgStars = document.getElementById('avg-stars');
  const avgCount = document.getElementById('avg-review-count');
  const ratingScore = document.querySelector('.rating-score');

  try {
    // Fetch reviews with profile info
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + (r.star_rating || 0), 0) / reviews.length;
      avgNumber.textContent = avg.toFixed(1);
      avgStars.innerHTML = renderStars(Math.round(avg));
      avgCount.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
      
      // Also update the hero rating score
      if (ratingScore) ratingScore.textContent = avg.toFixed(1);
      // Update the count in the quick-info bar
      const ratingCountEl = document.querySelector('.rating-count');
      if (ratingCountEl) ratingCountEl.textContent = `(${reviews.length} reviews)`;
    } else {
      avgNumber.textContent = '—';
      avgStars.innerHTML = renderStars(0);
      avgCount.textContent = 'No reviews yet';
      if (ratingScore) ratingScore.textContent = '—';
      const ratingCountEl = document.querySelector('.rating-count');
      if (ratingCountEl) ratingCountEl.textContent = '(0 reviews)';
    }

    // Render reviews
    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No reviews yet. Be the first to review!</p>';
      return;
    }

    reviewsList.innerHTML = '';
    reviews.forEach(review => {
      const username = review.profiles?.username || 'Anonymous';
      const timeAgo = getTimeAgo(new Date(review.created_at));
      const stars = renderStars(review.star_rating || 0);

      const item = document.createElement('div');
      item.className = 'review-item';
      item.innerHTML = `
        <div class="review-user-row">
          <div class="review-user-info">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ea7a2b&color=fff&size=48&bold=true" class="review-avatar" alt="${username}" />
            <div>
              <h4 class="review-name">${username}</h4>
              <p class="review-time">${timeAgo}</p>
            </div>
          </div>
          <div class="review-stars">${stars}</div>
        </div>
        ${review.comment ? `<p class="review-text">${escapeHtml(review.comment)}</p>` : '<p class="review-text" style="color: #bbb; font-style: italic;">Rating only — no written review.</p>'}
      `;
      reviewsList.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading reviews:', err);
    reviewsList.innerHTML = '<p style="color: red; text-align: center; padding: 2rem;">Failed to load reviews.</p>';
  }
}

function renderStars(count) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span style="color: ${i <= count ? '#F59E0B' : '#D1D5DB'}">★</span>`;
  }
  return html;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── STAR PICKER HELPER ───
function setupStarPicker(containerId) {
  const container = document.getElementById(containerId);
  const stars = container.querySelectorAll('.pick-star');
  let selectedValue = 0;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedValue = parseInt(star.dataset.value);
      highlightStars(stars, selectedValue);
    });
    star.addEventListener('mouseenter', () => {
      highlightStars(stars, parseInt(star.dataset.value));
    });
  });
  container.addEventListener('mouseleave', () => {
    highlightStars(stars, selectedValue);
  });

  return () => selectedValue; // getter
}

function highlightStars(stars, count) {
  stars.forEach(s => {
    const val = parseInt(s.dataset.value);
    s.style.color = val <= count ? '#F59E0B' : '#D1D5DB';
  });
}

// ─── REVIEW MODAL ───
function setupReviewModal(restaurantId, currentUser) {
  const modal = document.getElementById('review-modal');
  const openBtn = document.getElementById('btn-write-review');
  const closeBtn = document.getElementById('review-modal-close');
  const form = document.getElementById('review-form');
  const msgEl = document.getElementById('review-form-msg');

  const getStarValue = setupStarPicker('review-star-picker');

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to write a review.');
      window.location.href = 'index.html';
      return;
    }
    modal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = getStarValue();
    const comment = document.getElementById('review-comment').value.trim();

    if (rating === 0) {
      msgEl.textContent = 'Please select a star rating.';
      msgEl.style.color = '#EF4444';
      return;
    }

    msgEl.textContent = 'Submitting...';
    msgEl.style.color = '#666';

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: currentUser.id,
        restaurant_id: restaurantId,
        star_rating: rating,
        comment: comment || null
      });

      if (error) throw error;

      msgEl.textContent = 'Review submitted!';
      msgEl.style.color = '#059669';

      // Refresh reviews after short delay
      setTimeout(() => {
        modal.style.display = 'none';
        form.reset();
        highlightStars(document.querySelectorAll('#review-star-picker .pick-star'), 0);
        msgEl.textContent = '';
        loadReviews(restaurantId);
      }, 1000);
    } catch (err) {
      console.error('Error submitting review:', err);
      msgEl.textContent = 'Failed to submit. Please try again.';
      msgEl.style.color = '#EF4444';
    }
  });
}

// ─── QUICK RATE MODAL ───
function setupRateModal(restaurantId, currentUser) {
  const modal = document.getElementById('rate-modal');
  const openBtn = document.getElementById('btn-quick-rate');
  const closeBtn = document.getElementById('rate-modal-close');
  const submitBtn = document.getElementById('btn-submit-rate');
  const msgEl = document.getElementById('rate-form-msg');

  const getStarValue = setupStarPicker('rate-star-picker');

  openBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert('Please log in to rate this restaurant.');
      window.location.href = 'index.html';
      return;
    }
    modal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  submitBtn.addEventListener('click', async () => {
    const rating = getStarValue();

    if (rating === 0) {
      msgEl.textContent = 'Please select a star rating.';
      msgEl.style.color = '#EF4444';
      return;
    }

    msgEl.textContent = 'Submitting...';
    msgEl.style.color = '#666';

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: currentUser.id,
        restaurant_id: restaurantId,
        star_rating: rating,
        comment: null
      });

      if (error) throw error;

      msgEl.textContent = 'Rating submitted!';
      msgEl.style.color = '#059669';

      setTimeout(() => {
        modal.style.display = 'none';
        highlightStars(document.querySelectorAll('#rate-star-picker .pick-star'), 0);
        msgEl.textContent = '';
        loadReviews(restaurantId);
      }, 1000);
    } catch (err) {
      console.error('Error submitting rating:', err);
      msgEl.textContent = 'Failed to submit. Please try again.';
      msgEl.style.color = '#EF4444';
    }
  });
}

// ─── TAG BUTTONS (Want to go / Visited / Would go again) ───
async function setupTagButtons(restaurantId, currentUser) {
  const pillGroup = document.getElementById('tag-pill-group');
  if (!pillGroup) return;

  const tagButtons = pillGroup.querySelectorAll('.btn-group-pill[data-tag]');

  // 1. Load existing tag for this user + restaurant
  if (currentUser) {
    try {
      const { data, error } = await supabase
        .from('user_restaurant_tags')
        .select('tag')
        .eq('user_id', currentUser.id)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (!error && data) {
        // Highlight the matching button
        tagButtons.forEach(btn => {
          if (btn.dataset.tag === data.tag) {
            btn.classList.add('active');
          }
        });
      }
    } catch (err) {
      console.error('Error loading tag:', err);
    }
  }

  // 2. Handle click events on each tag button
  tagButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUser) {
        alert('Please log in to tag restaurants.');
        window.location.href = 'index.html';
        return;
      }

      const clickedTag = btn.dataset.tag;
      const isAlreadyActive = btn.classList.contains('active');

      // Disable buttons during request
      tagButtons.forEach(b => (b.disabled = true));

      try {
        if (isAlreadyActive) {
          // Remove the tag (un-toggle)
          const { error } = await supabase
            .from('user_restaurant_tags')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('restaurant_id', restaurantId);

          if (error) throw error;

          btn.classList.remove('active');
        } else {
          // Upsert (insert or update) the tag
          const { error } = await supabase
            .from('user_restaurant_tags')
            .upsert(
              {
                user_id: currentUser.id,
                restaurant_id: restaurantId,
                tag: clickedTag,
              },
              { onConflict: 'user_id,restaurant_id' }
            );

          if (error) throw error;

          // Remove active from all, then mark clicked one
          tagButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Pulse animation
          btn.classList.add('just-activated');
          setTimeout(() => btn.classList.remove('just-activated'), 300);
        }
      } catch (err) {
        console.error('Error saving tag:', err);
        alert('Failed to save tag. Please try again.');
      } finally {
        tagButtons.forEach(b => (b.disabled = false));
      }
    });
  });
}

