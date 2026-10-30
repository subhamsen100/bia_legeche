import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config: React plugin only, modern build target (evergreen mobile browsers).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
  server: {
    host: true,
  },
  // Pre-bundle up front so a cold dev server doesn't re-optimize mid-load (duplicate React).
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'qrcode'],
  },
});
