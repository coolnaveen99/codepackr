import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function htmlFallbackPlugin(): Plugin {
  return {
    name: 'html-fallback-plugin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && req.url.endsWith('.html') && req.url !== '/index.html' && !req.url.startsWith('/@')) {
          const [, search] = req.url.split('?');
          req.url = '/index.html' + (search ? `?${search}` : '');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && req.url.endsWith('.html') && req.url !== '/index.html') {
          const [, search] = req.url.split('?');
          req.url = '/index.html' + (search ? `?${search}` : '');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [htmlFallbackPlugin(), react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});

