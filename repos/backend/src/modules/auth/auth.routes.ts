import { Hono } from 'hono';
import { AuthController } from './auth.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export function createAuthRoutes(authController: AuthController, jwtService: JwtService) {
    const app = new Hono();

    app.post('/login', authController.login());
    app.post('/register', authController.register());
    app.post('/refresh', authController.refresh());
    app.post('/revoke', authController.revoke());
    app.get('/me', authMiddleware(jwtService), authController.getMe());

    return app;
}
