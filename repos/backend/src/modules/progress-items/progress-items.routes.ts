import { Hono } from 'hono';
import { ProgressItemsController } from './progress-items.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest, validateQuery } from '../../shared/validation/validation.middleware';
import {
    createProgressItemSchema,
    updateProgressItemSchema,
    logProgressSchema,
    paginationSchema
} from '../../shared/validation/validation.schemas';

export function createProgressItemsRoutes(
    controller: ProgressItemsController,
    jwtService: JwtService
) {
    const app = new Hono();

    app.post('/', authMiddleware(jwtService), validateRequest(createProgressItemSchema), controller.create());
    app.get('/', authMiddleware(jwtService), validateQuery(paginationSchema), controller.getAll());
    app.put('/:id', authMiddleware(jwtService), validateRequest(updateProgressItemSchema), controller.update());
    app.put('/:id/settle', authMiddleware(jwtService), controller.settle());
    app.post('/:id/logs', authMiddleware(jwtService), validateRequest(logProgressSchema), controller.logProgress());
    app.get('/:id/logs', authMiddleware(jwtService), validateQuery(paginationSchema), controller.getLogs());

    return app;
}
