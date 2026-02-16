import { Hono } from 'hono';
import { DashboardController } from './dashboard.controller';
import { JwtService } from '../../shared/jwt/jwt.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export function createDashboardRoutes(dashboardController: DashboardController, jwtService: JwtService) {
    const app = new Hono();

    app.use('*', authMiddleware(jwtService));

    app.get('/', dashboardController.getDashboard());

    return app;
}
