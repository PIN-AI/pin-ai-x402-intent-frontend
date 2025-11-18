import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      // Proxy all requests starting with /intent to backend server
      '/intent': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // If there are other API paths, they can also be added
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Browser environment polyfill (important!)
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  // Optimize dependency pre-building
  optimizeDeps: {
    include: ['viem', 'wagmi', '@pin/x402-client'],
  },
});
