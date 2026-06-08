import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy /api and /assets to the Express server so the client can use
// same-origin relative URLs. In prod, set VITE_API_URL to the deployed API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
