import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';

export const app = new Hono<{Bindings: typeof env}>();

// Global middleware
app.use('*', cors());
app.use('*', logger());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Placeholder root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Daily Progress API',
    version: '1.0.0',
    status: 'running',
  });
});

winstonLogger.info('Hono app initialized', { env: env.NODE_ENV });
