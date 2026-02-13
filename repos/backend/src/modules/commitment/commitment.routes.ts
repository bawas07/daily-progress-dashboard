import { Hono } from 'hono';
import { CommitmentController } from './commitment.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export function createCommitmentRoutes(commitmentController: CommitmentController, jwtService: JwtService) {
    const app = new Hono();

    app.use('*', authMiddleware(jwtService));

    app.get('/', commitmentController.getCommitments());
    app.post('/', commitmentController.create());
    app.post('/:id/logs', commitmentController.logCommitment());

    return app;
}
