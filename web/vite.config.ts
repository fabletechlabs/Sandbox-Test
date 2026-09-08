import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Where the dev server forwards /api. Compose sets this to the api service on
// the internal network; a standalone `npm run dev` falls back to localhost.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:4000';

// GitHub Codespaces publishes the dev server behind an HTTPS proxy on port 443.
// The variable is set by Codespaces and passed through by docker-compose.
const inCodespaces = Boolean(process.env.CODESPACES);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Vite 5.4.12 and later reject a Host header that is not in this list, so
    // the forwarded Codespaces hostname must be allowed by name.
    allowedHosts: ['.app.github.dev'],
    // Without this, the HMR client tries to open a websocket on port 3000 of
    // the forwarded HTTPS host, which the proxy does not serve.
    hmr: inCodespaces ? { clientPort: 443 } : undefined,
    // The browser calls /api on this same origin, so there is no cross-origin
    // request and only port 3000 must be forwarded.
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
