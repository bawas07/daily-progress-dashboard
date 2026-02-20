import { Hono } from 'hono';
import { AuthController } from './auth.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { rateLimit } from '../../shared/middleware/rate-limit.middleware';
import { validateRequest } from '../../shared/validation/validation.middleware';
import { changePasswordSchema, loginSchema, registerSchema, refreshTokenSchema } from '../../shared/validation/validation.schemas';
import { env } from '../../shared/config/env';

export function createAuthRoutes(authController: AuthController, jwtService: JwtService) {
    const app = new Hono();

    // Rate limit for auth endpoints: 10 requests per 15 minutes per IP
    // Increased to 100 in test environment to avoid blocking integration tests
    const authRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: env.NODE_ENV === 'test' ? 100 : 10,
    });

    app.post('/login', authRateLimit, validateRequest(loginSchema), authController.login());
    app.post('/register', authRateLimit, validateRequest(registerSchema), authController.register());
    app.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh());
    app.post('/revoke', validateRequest(refreshTokenSchema), authController.revoke());
    app.get('/me', authMiddleware(jwtService), authController.getMe());
    app.post('/change-password', authMiddleware(jwtService), validateRequest(changePasswordSchema), authController.changePassword());

    return app;
}
