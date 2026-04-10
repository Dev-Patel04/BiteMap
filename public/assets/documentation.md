# Public Assets Documentation

Vite statically manages files stored inside the `public/` folder implicitly. Items inserted into this folder do not pass through Vite's bundling logic, which implies that references inside JavaScript scripts or HTML paths correctly execute against root calls (e.g. `/assets/logo.png`).

## Files & Structuring
- **Imagery**: Any general `.png`, `.jpg`, `.svg` representing hard-coded visual aspects like brand logos, graphical placeholder elements, and generic avatars.
- Usage implicitly guarantees consistent URL pathways without breaking dynamically rendered elements.
