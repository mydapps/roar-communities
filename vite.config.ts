import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    https: {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem'),
    },
    proxy: {
      // API proxy with cookie forwarding (handles API, SSE, and WebSocket endpoints)
      '/api': {
        target: 'https://api.dapps.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, options) => {
          // Forward cookies for all API requests
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            // Log WebSocket requests for debugging
            if (req.url?.includes('/ws')) {
              console.log('WebSocket proxy URL:', req.url);
              console.log('WebSocket proxy request headers:', req.headers);
            }
          });
          
          proxy.on('error', (err, req, res) => {
            if (req.url?.includes('/ws')) {
              console.error('WebSocket proxy error:', err);
            }
          });
        }
      }
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
