import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { app } from './app';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';

// Import env early to validate
import './shared/config/env';

console.log('🚀 Starting Daily Progress Backend...');
console.log(`📍 Environment: ${env.NODE_ENV}`);
console.log(`🌐 Server will run on: http://localhost:${env.PORT}`);

const server = app.fetch;

export default {
  port: env.PORT,
  fetch: server,
};

winstonLogger.info('Server started', { port: env.PORT, env: env.NODE_ENV });
