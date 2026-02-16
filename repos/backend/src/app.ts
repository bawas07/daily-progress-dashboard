import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';
import { createSuccessResponse, notFound } from './shared/response/response.helper';
import { container } from './shared/registry';
import { registerRoutes } from './routes';
import { errorHandler } from './shared/middleware/error.middleware';

export function createApp() {
  const app = new Hono<{ Bindings: typeof env }>();

  // Global middleware
  app.use('*', cors());
  app.use('*', logger());

  // Register all application routes
  registerRoutes(app, container);

  // Global error handler (must be after routes)
  app.onError(errorHandler);

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json(createSuccessResponse(
      'S001',
      'Service is healthy',
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      }
    ));
  });

  // Placeholder root endpoint
  app.get('/', (c) => {
    return c.json(createSuccessResponse(
      'S002',
      'API is running',
      {
        name: 'Daily Progress API',
        version: '1.0.0',
      }
    ));
  });

  // 404 handler
  app.notFound((c) => {
    return c.json(notFound('Endpoint not found'), 404);
  });

  winstonLogger.info('Hono app initialized with modular architecture', {
    env: env.NODE_ENV,
    services: ['JwtService', 'DatabaseService'],
  });

  return app;
}
