# Pages Documentation

The `/pages/` directory acts as the core structured display engine representing all post-landing page routes inside the app. To preserve standard single navigation routing, Vite maps each file appropriately inside its build options. Each page maintains distinct inclusion blocks mapping to specific CSS bundles and JS modules explicitly.

## Application Views
- **`dashboard.html`**: The home feed layout for logged-in authenticated users. Features sidebar navigations and localized recent activities tracking the broader community patterns.
- **`explore.html`**: The searchable grid directory acting as the primary discovery hub. Includes markup for multiple search boxes, filter chips, rating toggles, and layout skeletons that are subsequently populated by its underlying JS module.
- **`friends.html`**: A socially-organized view structuring networks. Lists all the friends tracked by the user alongside the friends' respective latest restaurant experiences locally sourced from their behaviors.
- **`profile.html`**: A highly interactive visualization of the player. Contains all markup related to progress reporting, badge tracking, user edits, and historical dining patterns tied strictly to their own identity.
- **`restaurant.html`**: Generates a single scoped view meant to process specific `?restaurant=` queries mapping precise reviews, operating hours, values, and location parameters for one respective entity.
