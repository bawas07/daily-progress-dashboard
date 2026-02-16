import { Hono } from 'hono';
import { UserPreferencesController } from './user-preferences.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/validation/validation.middleware';
import { updatePreferencesSchema } from '../../shared/validation/validation.schemas';

export function createUserPreferencesRoutes(
    controller: UserPreferencesController,
    jwtService: JwtService
) {
    const app = new Hono();

    app.get('/', authMiddleware(jwtService), controller.getPreferences());
    app.put('/', authMiddleware(jwtService), validateRequest(updatePreferencesSchema), controller.updatePreferences());

    return app;
}
