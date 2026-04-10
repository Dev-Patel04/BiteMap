/**
 * js/images.js
 *
 * Maps each cuisine category to a pool of images.
 * Images are randomly picked per restaurant for visual variety.
 *
 * ─── HOW TO REPLACE WITH YOUR GOOGLE DRIVE IMAGES ───────────────────────────
 * For each Google Drive file, convert the share link to a direct embed URL:
 *   Share link:  https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   Direct URL:  https://drive.google.com/uc?export=view&id=FILE_ID
 *
 * Replace the Unsplash URLs below with your Google Drive direct URLs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CATEGORY_IMAGES = {
  'Pub/Bar Food': [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80',
    'https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=600&q=80',
    'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=600&q=80',
  ],

  'Fine Dining': [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  ],

  'Cafe/Bakery': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80',
  ],

  'Canadian': [
    'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=600&q=80',
    'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80',
    'https://images.unsplash.com/photo-1508615070457-7baeba4003ab?w=600&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
  ],

  'Italian': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=600&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&q=80',
  ],

  'Seafood': [
    'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&q=80',
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80',
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',
  ],

  'Asian': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&q=80',
    'https://images.unsplash.com/photo-1617196034183-421b4040d20d?w=600&q=80',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
    'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?w=600&q=80',
  ],

  'BBQ/Smokehouse': [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80',
  ],

  'Steakhouse': [
    'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  ],
};

/** Fallback images for any cuisine not listed above */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
];

/**
 * Returns a random image URL for the given cuisine category.
 * Falls back to a generic food image if the category isn't in the map.
 *
 * @param {string} cuisineTag - The cuisine_tag value from the database
 * @returns {string} A direct image URL
 */
export function getRandomImage(cuisineTag) {
  // Normalise: some tags may have sub-categories like "Asian/Japanese"
  const primaryTag = (cuisineTag || '').split('/')[0].trim();

  // Try exact match first, then primary tag
  const pool =
    CATEGORY_IMAGES[cuisineTag] ||
    CATEGORY_IMAGES[primaryTag] ||
    FALLBACK_IMAGES;

  return pool[Math.floor(Math.random() * pool.length)];
}
