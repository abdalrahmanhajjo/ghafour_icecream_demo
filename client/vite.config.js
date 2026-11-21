import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy /api and /uploads to the Express server so the client can use
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    // No inline polyfill script → lets us run a strict CSP (script-src 'self').
    modulePreload: { polyfill: false },
    // The only chunk over 500 kB is three.js (~135 kB gzipped). It is loaded on demand
    // by the 3D cup after the page is interactive, never on the critical path.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split the React runtime into its own long-cacheable vendor chunk.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // three.js only loads with the 3D cup (dynamic import) — never in the main bundle
            if (id.includes('node_modules/three/')) return 'three';
            if (id.includes('react-router')) return 'router';
            if (id.includes('react')) return 'react';
            return 'vendor';
          }
        },
      },
    },
  },
});
