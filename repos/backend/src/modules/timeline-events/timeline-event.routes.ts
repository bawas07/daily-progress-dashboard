import { Hono } from 'hono';
import { TimelineEventController } from './timeline-event.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export function createTimelineEventRoutes(timelineEventController: TimelineEventController, jwtService: JwtService) {
    const app = new Hono();

    app.use('*', authMiddleware(jwtService));

    app.get('/', timelineEventController.getEvents());
    app.get('/:id', timelineEventController.getById());
    app.post('/', timelineEventController.create());
    app.put('/:id', timelineEventController.update());
    app.delete('/:id', timelineEventController.delete());

    return app;
}
