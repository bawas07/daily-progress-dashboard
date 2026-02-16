import { Hono } from 'hono';
import { AuthController } from './auth.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/validation/validation.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from '../../shared/validation/validation.schemas';

export function createAuthRoutes(authController: AuthController, jwtService: JwtService) {
    const app = new Hono();

    app.post('/login', validateRequest(loginSchema), authController.login());
    app.post('/register', validateRequest(registerSchema), authController.register());
    app.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh());
    app.post('/revoke', validateRequest(refreshTokenSchema), authController.revoke());
    app.get('/me', authMiddleware(jwtService), authController.getMe());

    return app;
}
