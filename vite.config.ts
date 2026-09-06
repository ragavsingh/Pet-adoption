import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sendTransactionalEmail } from './server/sendTransactionalEmail';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'transactional-email-middleware',
      configureServer(server) {
        server.middlewares.use('/api/send-transactional-email', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const authHeader = req.headers['authorization'] || '';
                const result = await sendTransactionalEmail(parsed, authHeader);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end('Method Not Allowed');
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
