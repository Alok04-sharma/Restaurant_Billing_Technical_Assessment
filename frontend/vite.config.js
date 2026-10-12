/**
 * Restaurant Billing System
 * File: frontend/vite.config.js
 *
 * Purpose:
 * - Configure React with Vite.
 * - Enable Tailwind CSS.
 * - Forward /api requests to the Express backend.
 *
 * Backend Port: 5050
 * Frontend Port: 5173
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '127.0.0.1',
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
});