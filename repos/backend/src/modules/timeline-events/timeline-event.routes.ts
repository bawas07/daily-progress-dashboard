import { Hono } from 'hono';
import { TimelineEventController } from './timeline-event.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/validation/validation.middleware';
import { createTimelineEventSchema, updateTimelineEventSchema } from '../../shared/validation/validation.schemas';

export function createTimelineEventRoutes(timelineEventController: TimelineEventController, jwtService: JwtService) {
    const app = new Hono();

    app.use('*', authMiddleware(jwtService));

    app.get('/', timelineEventController.getEvents());
    app.get('/:id', timelineEventController.getById());
    app.post('/', validateRequest(createTimelineEventSchema), timelineEventController.create());
    app.put('/:id', validateRequest(updateTimelineEventSchema), timelineEventController.update());
    app.delete('/:id', timelineEventController.delete());

    return app;
}
