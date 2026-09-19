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
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
          const pathname = urlObj.pathname;

          let handler = null;

          if (pathname.startsWith('/api/gene/') && pathname.endsWith('/analytics')) {
            const raw = pathname.slice('/api/gene/'.length, pathname.length - '/analytics'.length);
            req.query = { symbol: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/analytics.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/gene/')) {
            const raw = pathname.slice('/api/gene/'.length);
            req.query = { symbol: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/gene.js');
            handler = mod.default;
          } else if (pathname === '/api/gene' || pathname === '/api/gene/') {
            req.query = Object.fromEntries(urlObj.searchParams);
            const mod = await import('./api/gene.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/variant/') && pathname.endsWith('/clinical')) {
            const raw = pathname.slice('/api/variant/'.length, pathname.length - '/clinical'.length);
            req.query = { identifier: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/clinical.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/variant/') && pathname.endsWith('/protein')) {
            const raw = pathname.slice('/api/variant/'.length, pathname.length - '/protein'.length);
            req.query = { identifier: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/protein.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/variant/') && pathname.endsWith('/structure')) {
            const raw = pathname.slice('/api/variant/'.length, pathname.length - '/structure'.length);
            req.query = { identifier: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/structure.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/variant/') && pathname.endsWith('/predictions')) {
            const raw = pathname.slice('/api/variant/'.length, pathname.length - '/predictions'.length);
            req.query = { identifier: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/predictions.js');
            handler = mod.default;
          } else if (pathname === '/api/compare' || pathname === '/api/compare/' || pathname === '/api/variant/compare' || pathname === '/api/variant/compare/') {
            req.query = Object.fromEntries(urlObj.searchParams);
            const mod = await import('./api/compare.js');
            handler = mod.default;
          } else if (pathname === '/api/variant' || pathname === '/api/variant/') {
            req.query = Object.fromEntries(urlObj.searchParams);
            const mod = await import('./api/variant.js');
            handler = mod.default;
          } else if (pathname.startsWith('/api/variant/')) {
            const raw = pathname.slice('/api/variant/'.length);
            req.query = { identifier: decodeURIComponent(raw), ...Object.fromEntries(urlObj.searchParams) };
            const mod = await import('./api/variant.js');
            handler = mod.default;
          } else if (pathname === '/api/analytics' || pathname === '/api/analytics/') {
            req.query = Object.fromEntries(urlObj.searchParams);
            const mod = await import('./api/analytics.js');
            handler = mod.default;
          }

          if (handler) {
            res.status = function (code) {
              res.statusCode = code;
              return res;
            };
            res.json = function (data) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(data));
            };
            res.send = function (data) {
              res.end(data);
            };

            await handler(req, res);
            return;
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `API route not found: ${pathname}` }));
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
