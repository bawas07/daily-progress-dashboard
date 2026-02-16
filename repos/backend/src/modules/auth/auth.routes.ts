import { Hono } from 'hono';
import { AuthController } from './auth.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { rateLimit } from '../../shared/middleware/rate-limit.middleware';

export function createAuthRoutes(authController: AuthController, jwtService: JwtService) {
    const app = new Hono();

    // Rate limit for auth endpoints: 10 requests per 15 minutes per IP
    const authRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
    });

    app.post('/login', authRateLimit, authController.login());
    app.post('/register', authRateLimit, authController.register());
    app.post('/refresh', authController.refresh());
    app.post('/revoke', authController.revoke());
    app.get('/me', authMiddleware(jwtService), authController.getMe());

    return app;
}
