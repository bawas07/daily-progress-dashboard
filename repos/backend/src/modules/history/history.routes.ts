import { Hono } from 'hono';
import { HistoryController } from './history.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { HistoryService } from './history.service';
import { container } from '../../shared/registry';
import { JwtService } from '../../shared/jwt/jwt.service';

export function createHistoryRoutes(jwtService: JwtService): Hono {
    const app = new Hono();

    const historyService = new HistoryService(container);
    const historyController = new HistoryController(historyService);

    // All routes require authentication
    app.use('/*', authMiddleware(jwtService));

    // Today's history
    app.get('/today', historyController.getTodayHistory());

    // Weekly history
    app.get('/week', historyController.getWeeklyHistory());

    // Monthly history
    app.get('/month', historyController.getMonthlyHistory());

    return app;
}

export function createItemsRoutes(jwtService: JwtService): Hono {
    const app = new Hono();

    const historyService = new HistoryService(container);
    const historyController = new HistoryController(historyService);

    // All routes require authentication
    app.use('/*', authMiddleware(jwtService));

    // All active items
    app.get('/all', historyController.getAllActiveItems());

    return app;
}
