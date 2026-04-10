# JavaScript Source Documentation

This directory encapsulates all dynamic operations, separating logic by context and functionality. All files here operate as modern ES6 modules utilized by the HTML views. They operate alongside Supabase backend APIs to authenticate and handle real-time database queries.

## Global Controllers
- **`main.js`**: The general app initializer. Injected globally or onto general templates, it registers top-level event listeners for mobile navigations, hamburger menus, and smooth scrolling capabilities.
- **`supabase.js`**: Holds the Supabase client initialization configs (keys and URLs) making it available to all subsequent scripts making backend calls.
- **`images.js`**: Utility configurations mapping out image endpoints or fallback logic to dynamically populate placeholder UI images.

## Feature-Specific Controllers
- **`auth.js`**: Controls the login and registration mechanisms. It directly fires the visual modal elements while concurrently verifying and inserting user authentication payloads onto the Supabase sessions.
- **`gamification.js`**: Responsible for creating the engaging tracking behaviors on BiteMap. It defines experience gains for user behaviors (e.g. reviewing a restaurant grants XP, visiting grants XP) and governs the logic for badge unlocks and visual progress bars.

## Page-Specific Binders
- **`dashboard.js`**: Resolves the state loading sequences after a user logs in. Populates recommended "Recent Activity" and dynamically handles mapping the navigation elements globally on standard dashboards.
- **`explore.js`**: Centralizing all restaurant exploration algorithms. Filters cuisines, executes search logics, sorting elements in real-time within the UI.
- **`friends.js`**: Deals with fetching data mapped to external users. Handles friend lists, follow requests, and appending external friend feeds to the view.
- **`profile.js`**: Integrates deep gamification logic with standard user inputs. Allows altering user avatars, tracking previously visited spaces, and displaying user progression metrics.
- **`restaurant.js`**: Dynamically maps distinct parameters passed typically through query URLs. Once a restaurant is selected, this queries the backend for granular details of that one restaurant to populate its address, photos, and review feed.
