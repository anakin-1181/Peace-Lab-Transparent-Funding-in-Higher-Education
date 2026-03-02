import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import chatHandler from './api/chat.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  }
  if (env.OPENROUTER_MODEL) {
    process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;
  }
  if (env.OPENROUTER_REFERER) {
    process.env.OPENROUTER_REFERER = env.OPENROUTER_REFERER;
  }
  if (env.OPENROUTER_TITLE) {
    process.env.OPENROUTER_TITLE = env.OPENROUTER_TITLE;
  }
  if (env.OPENROUTER_FALLBACK_MODELS) {
    process.env.OPENROUTER_FALLBACK_MODELS = env.OPENROUTER_FALLBACK_MODELS;
  }
  if (env.OPENROUTER_TIMEOUT_MS) {
    process.env.OPENROUTER_TIMEOUT_MS = env.OPENROUTER_TIMEOUT_MS;
  }
  if (env.OPENROUTER_MAX_RETRIES) {
    process.env.OPENROUTER_MAX_RETRIES = env.OPENROUTER_MAX_RETRIES;
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-chat-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res) => {
            const wrappedRes = Object.assign(res, {
              status(code: number) {
                this.statusCode = code;
                return this;
              },
              json(payload: unknown) {
                this.setHeader('Content-Type', 'application/json');
                this.end(JSON.stringify(payload));
                return this;
              }
            });
            await chatHandler(req, wrappedRes);
          });
        }
      }
    ],
    server: {
      port: 5173,
      host: true
    }
  };
});
