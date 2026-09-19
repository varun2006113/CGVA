import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Strictly intercept ONLY requests starting with /api/
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const mod = await import('./api/index.js');
          const handler = mod.default;

          if (handler) {
            await handler(req, res);
            return;
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `API route not found: ${req.url}` }));
            return;
          }
        } catch (err) {
          console.error('[API Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal API Error' }));
          return;
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
