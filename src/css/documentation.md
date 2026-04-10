# CSS Source Documentation

This folder encompasses the entire visual style logic, driven by a vanilla styling approach. It handles typography, layout components, aesthetic choices, and mobile-first responsive breakpoints.

## Architecture
BiteMap's CSS leans on a single foundational design token core (`styles.css`) overlaid with module-based stylesheets designed particularly for specialized pages. 

## Foundational Styles
- **`styles.css`**: The anchor of the entire design system. 
  - Employs deep `:root` selectors to declare all CSS variables (colors, spacing, and transition speeds). 
  - Imports all foundational typography elements like Google Fonts (Inter, Outfit). 
  - Handles universal base interactions (like generic `.btn` classes, form components, headers, and footer components).

## Modular Styles
These are conditionally loaded via their respective sub-HTML files mapping direct granular designs.
- **`dashboard.css`**: Defines layout grids linking sidebars, progress bars, and localized friend-feed components for complex states.
- **`explore.css` & `explore-search.css`**: Heavily leans on responsive grid systems (`grid-template-columns`) and flexboxes mapping out filtering options and search chips. Handles hovering interactions over localized restaurant discovery cards.
- **`friends.css`**: Models list displays dealing specifically with avatars, connections, and simplified social networking components.
- **`profile.css`**: Styles gamification components. This involves XP layout trackers, badges grids, user avatar uploads, and user-centric statistics.
- **`restaurant.css`**: Specialized single-view component managing the display of map overlays, wide header graphics, detailed review forms, and localized star-rating interactions.
