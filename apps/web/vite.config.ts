import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Brand-specific HTML transforms
const brandConfig: Record<string, { title: string; analyticsDomain: string }> = {
  blesaf: {
    title: 'BléSaf - Gestion de File d\'Attente',
    analyticsDomain: 'blesaf.tn',
  },
  france: {
    title: 'FiloSoin - Gestion de File d\'Attente',
    analyticsDomain: 'filosoin.fr',
  },
};

function brandHtmlPlugin(): Plugin {
  const brand = process.env.VITE_BRAND || 'blesaf';
  const config = brandConfig[brand] || brandConfig.blesaf;

  return {
    name: 'brand-html-transform',
    transformIndexHtml(html) {
      return html
        .replace(
          /<title>.*?<\/title>/,
          `<title>${config.title}</title>`
        )
        .replace(
          /data-domain="[^"]*"/,
          `data-domain="${config.analyticsDomain}"`
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), brandHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true, // Expose to network (0.0.0.0)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
