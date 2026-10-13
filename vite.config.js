import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

function localFileDB() {
  const dbPath = path.resolve(process.cwd(), 'local-db.json');
  return {
    name: 'local-file-db',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/local-api/db' && req.method === 'GET') {
          if (fs.existsSync(dbPath)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(dbPath));
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({}));
          }
          return;
        }
        if (req.url === '/local-api/db' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              let existing = {};
              if (fs.existsSync(dbPath)) {
                existing = JSON.parse(fs.readFileSync(dbPath));
              }
              const updated = { ...existing, ...data };
              fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(e.toString());
            }
          });
          return;
        }
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    localFileDB(),
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});