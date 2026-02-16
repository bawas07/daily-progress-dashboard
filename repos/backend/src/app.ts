import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';
import { createSuccessResponse, notFound } from './shared/response/response.helper';
import { container } from './shared/registry';
import { registerRoutes } from './routes';

export function createApp() {
  const app = new Hono<{ Bindings: typeof env }>();

  // Global middleware
  const origins = env.ALLOWED_ORIGINS === '*'
    ? '*'
    : env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

  app.use('*', cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }));
  app.use('*', secureHeaders());
  app.use('*', logger());

  // Register all application routes
  registerRoutes(app, container);

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
