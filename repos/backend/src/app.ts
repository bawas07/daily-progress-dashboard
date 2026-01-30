import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './shared/config/env';
import { logger as winstonLogger } from './shared/logger/logger.service';
import { createSuccessResponse, notFound } from './shared/response/response.helper';
import { container } from './shared/registry';
import { AuthController, AuthService } from './modules/auth';
import { UserPreferencesController, UserPreferencesService } from './modules/user-preferences';

export function createApp() {
  const app = new Hono<{Bindings: typeof env}>();

  // Global middleware
  app.use('*', cors());
  app.use('*', logger());

  // Resolve services from container (services must be registered before calling this)
  const authService = container.resolve<AuthService>('AuthService');
  const authController = new AuthController();

  const userPreferencesService = container.resolve<UserPreferencesService>('UserPreferencesService');
  const userPreferencesController = new UserPreferencesController();

  // Set up auth routes with authService injected
  app.post('/api/auth/login', authController.login(authService));
  app.post('/api/auth/register', authController.register(authService));
  app.get('/api/auth/me', authController.getMe(authService));

  // Set up user preferences routes with userPreferencesService injected
  app.get('/api/user/preferences', userPreferencesController.getPreferences(container));
  app.put('/api/user/preferences', userPreferencesController.updatePreferences(container));

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
