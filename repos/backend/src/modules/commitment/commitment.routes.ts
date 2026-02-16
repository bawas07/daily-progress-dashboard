import { Hono } from 'hono';
import { CommitmentController } from './commitment.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/validation/validation.middleware';
import { createCommitmentSchema, logCommitmentSchema } from '../../shared/validation/validation.schemas';

export function createCommitmentRoutes(commitmentController: CommitmentController, jwtService: JwtService) {
    const app = new Hono();

    app.use('*', authMiddleware(jwtService));

    app.get('/', commitmentController.getCommitments());
    app.post('/', validateRequest(createCommitmentSchema), commitmentController.create());
    app.post('/:id/logs', validateRequest(logCommitmentSchema), commitmentController.logCommitment());

    return app;
}
