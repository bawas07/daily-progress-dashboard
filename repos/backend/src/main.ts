import { createApp } from './app';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';
import { registerServices } from './shared/registry';

// Import env early to validate
import './shared/config/env';

// Register all services (called again for safety, but idempotent due to container check)
registerServices();

// Create the app after services are registered
const app = createApp();

console.log('🚀 Starting Daily Progress Backend...');
console.log(`📍 Environment: ${env.NODE_ENV}`);
console.log(`🌐 Server will run on: http://localhost:${env.PORT}`);

const server = app.fetch;

export default {
  port: env.PORT,
  fetch: server,
};

winstonLogger.info('Server started', { port: env.PORT, env: env.NODE_ENV });
