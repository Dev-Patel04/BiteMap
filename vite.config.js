import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        explore: resolve(__dirname, 'pages/explore.html'),
        friends: resolve(__dirname, 'pages/friends.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        restaurant: resolve(__dirname, 'pages/restaurant.html'),
      }
    }
  }
});
