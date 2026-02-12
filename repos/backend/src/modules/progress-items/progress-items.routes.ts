import { Hono } from 'hono';
import { ProgressItemsController } from './progress-items.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export function createProgressItemsRoutes(
    controller: ProgressItemsController,
    jwtService: JwtService
) {
    const app = new Hono();

    app.post('/', authMiddleware(jwtService), controller.create());
    app.get('/', authMiddleware(jwtService), controller.getAll());
    app.put('/:id', authMiddleware(jwtService), controller.update());
    app.put('/:id/settle', authMiddleware(jwtService), controller.settle());
    app.post('/:id/logs', authMiddleware(jwtService), controller.logProgress());
    app.get('/:id/logs', authMiddleware(jwtService), controller.getLogs());

    return app;
}
