import { Hono } from 'hono';
import { AuthController, AuthService } from './modules/auth';
import { UserPreferencesController, UserPreferencesService } from './modules/user-preferences';
import { JwtService } from './shared/jwt/jwt.service';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createUserPreferencesRoutes } from './modules/user-preferences/user-preferences.routes';
import { ProgressItemsController } from './modules/progress-items/progress-items.controller';
import { ProgressItemService } from './modules/progress-items/services/progress-item.service';
import { createProgressItemsRoutes } from './modules/progress-items/progress-items.routes';
import { CommitmentController } from './modules/commitment/commitment.controller';
import { CommitmentService } from './modules/commitment/services/commitment.service';
import { createCommitmentRoutes } from './modules/commitment/commitment.routes';
import { TimelineEventController } from './modules/timeline-events/timeline-event.controller';
import { TimelineEventService } from './modules/timeline-events/services/timeline-event.service';
import { createTimelineEventRoutes } from './modules/timeline-events/timeline-event.routes';
import { DashboardController } from './modules/dashboard/dashboard.controller';
import { DashboardService } from './modules/dashboard/dashboard.service';
import { createDashboardRoutes } from './modules/dashboard/dashboard.routes';
import { Container } from './shared/container';
import { env } from './shared/config/env';

export function registerRoutes(app: Hono<{ Bindings: typeof env }>, container: Container) {
    // Resolve services from container
    const authService = container.resolve<AuthService>('AuthService');
    const jwtService = container.resolve<JwtService>('JwtService');
    const userPreferencesService = container.resolve<UserPreferencesService>('UserPreferencesService');
    const progressItemService = container.resolve<ProgressItemService>('ProgressItemService');

    // Initialize Controllers
    const authController = new AuthController(authService);
    const userPreferencesController = new UserPreferencesController(userPreferencesService);
    const progressItemsController = new ProgressItemsController(progressItemService);

    // Mount auth routes
    app.route('/api/auth', createAuthRoutes(authController, jwtService));

    // Mount user preferences routes
    app.route('/api/user/preferences', createUserPreferencesRoutes(userPreferencesController, jwtService));

    // Mount progress items routes
    app.route('/api/progress-items', createProgressItemsRoutes(progressItemsController, jwtService));

    // Mount commitment routes
    const commitmentService = container.resolve<CommitmentService>('CommitmentService');
    const commitmentController = new CommitmentController(commitmentService);
    app.route('/api/commitments', createCommitmentRoutes(commitmentController, jwtService));

    // Mount timeline events routes
    const timelineEventService = container.resolve<TimelineEventService>('TimelineEventService');
    const timelineEventController = new TimelineEventController(timelineEventService);
    app.route('/api/timeline-events', createTimelineEventRoutes(timelineEventController, jwtService));

  // Mount dashboard routes
  const dashboardService = container.resolve<DashboardService>('DashboardService');
  const dashboardController = new DashboardController(dashboardService);
  app.route('/api/dashboard', createDashboardRoutes(dashboardController, jwtService));
}
