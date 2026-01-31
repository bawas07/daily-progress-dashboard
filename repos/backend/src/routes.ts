import { Hono } from 'hono';
import { AuthController, AuthService } from './modules/auth';
import { UserPreferencesController, UserPreferencesService } from './modules/user-preferences';
import { JwtService } from './shared/jwt/jwt.service';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createUserPreferencesRoutes } from './modules/user-preferences/user-preferences.routes';
import { Container } from './shared/container';
import { env } from './shared/config/env';

export function registerRoutes(app: Hono<{ Bindings: typeof env }>, container: Container) {
    // Resolve services from container
    const authService = container.resolve<AuthService>('AuthService');
    const jwtService = container.resolve<JwtService>('JwtService');
    const userPreferencesService = container.resolve<UserPreferencesService>('UserPreferencesService');

    // Initialize Controllers
    const authController = new AuthController(authService);
    const userPreferencesController = new UserPreferencesController(userPreferencesService);

    // Mount auth routes
    app.route('/api/auth', createAuthRoutes(authController, jwtService));

    // Mount user preferences routes
    app.route('/api/user/preferences', createUserPreferencesRoutes(userPreferencesController, jwtService));
}
