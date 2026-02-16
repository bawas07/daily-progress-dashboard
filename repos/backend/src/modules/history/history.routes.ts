import { Hono } from 'hono';
import { HistoryController } from './history.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { HistoryService } from './history.service';
import { container } from '../../shared/registry';

export function createHistoryRoutes(): Hono {
    const app = new Hono();

    const historyService = new HistoryService(container);
    const historyController = new HistoryController(historyService);

    // All routes require authentication
    app.use('/*', authMiddleware);

    // Today's history
    app.get('/today', historyController.getTodayHistory());

    // Weekly history
    app.get('/week', historyController.getWeeklyHistory());

    // Monthly history
    app.get('/month', historyController.getMonthlyHistory());

    return app;
}

export function createItemsRoutes(): Hono {
    const app = new Hono();

    const historyService = new HistoryService(container);
    const historyController = new HistoryController(historyService);

    // All routes require authentication
    app.use('/*', authMiddleware);

    // All active items
    app.get('/all', historyController.getAllActiveItems());

    return app;
}
