import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webfontDownload from 'vite-plugin-webfont-dl';
import { resolve } from 'path';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap';

export default defineConfig({
  plugins: [react(), webfontDownload(FONT_URL)],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@deck.gl')) return 'deck-gl';
          if (id.includes('maplibre-gl')) return 'maplibre-gl';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
