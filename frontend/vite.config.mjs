import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy: the React app calls /api/* and Vite forwards it to Spring Boot on 8080.
// host: true exposes the dev server on the local network so a phone on the same Wi-Fi
// can open http://<your-lan-ip>:5173. allowedHosts is required for tunnel hostnames
// (for example a temporary *.trycloudflare.com URL).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    pool: 'threads',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
