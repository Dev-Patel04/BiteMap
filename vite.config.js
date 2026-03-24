import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        explore: resolve(__dirname, 'explore.html'),
        friends: resolve(__dirname, 'friends.html'),
        profile: resolve(__dirname, 'profile.html'),
        restaurant: resolve(__dirname, 'restaurant.html'),
      }
    }
  }
});
