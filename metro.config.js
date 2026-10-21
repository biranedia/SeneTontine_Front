// metro.config.js — En développement web, relaie /api/* vers le backend Spring Boot
// (localhost:8080). La page et l'API partagent ainsi la même origine (localhost:8081) :
// plus de souci de CORS ni de blocage des requêtes inter-origines par le navigateur.
const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const BACKEND = { host: 'localhost', port: 8080 };

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) return middleware(req, res, next);
    const proxyReq = http.request(
      { ...BACKEND, path: req.url, method: req.method, headers: { ...req.headers, host: `${BACKEND.host}:${BACKEND.port}` } },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Backend injoignable sur localhost:8080' }));
    });
    req.pipe(proxyReq);
  },
};

module.exports = config;
