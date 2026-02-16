/**
 * Service Registry
 *
 * Centralized service registration to avoid side-effects at import time.
 * All services should be registered here, not in their own modules.
 *
 * Usage:
 *   import { registerServices } from './registry';
 *   registerServices();
 */
import { container } from './container';
import { JwtService } from './jwt/jwt.service';
import { DatabaseService } from './database/database.service';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../modules/auth/repositories/user.preferences.repository';
import { PasswordService } from '../modules/auth/services/password.service';
import { AuthService } from '../modules/auth/services/auth.service';
import { UserPreferencesService } from '../modules/user-preferences/services/user.preferences.service';
import { RefreshTokenRepository } from '../modules/auth/repositories/refresh-token.repository';
import { RefreshTokenService } from '../modules/auth/services/refresh-token.service';
import { ProgressItemRepository } from '../modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../modules/progress-items/repositories/progress-log.repository';
import { ProgressItemService } from '../modules/progress-items/services/progress-item.service';
import { CommitmentRepository } from '../modules/commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../modules/commitment/repositories/commitment-log.repository';
import { CommitmentService } from '../modules/commitment/services/commitment.service';
import { TimelineEventRepository } from '../modules/timeline-events/repositories/timeline-event.repository';
import { TimelineEventService } from '../modules/timeline-events/services/timeline-event.service';
import { DashboardService } from '../modules/dashboard/dashboard.service';
// LoggerService is a singleton instance, not a class, so we don't register it

// Track if services have been registered to prevent duplicate registration
let servicesRegistered = false;

export function registerServices(): void {
  // Prevent duplicate registration
  if (servicesRegistered) {
    return;
  }

  // Register services in dependency order
  // Services with no dependencies first
  container.register('DatabaseService', DatabaseService);
  container.register('JwtService', JwtService);
  container.register('PasswordService', PasswordService);

  // Repositories (depend on DatabaseService)
  container.register('UserRepository', UserRepository);
  container.register('UserPreferencesRepository', UserPreferencesRepository);
  container.register('RefreshTokenRepository', RefreshTokenRepository);
  container.register('ProgressItemRepository', ProgressItemRepository);
  container.register('ProgressLogRepository', ProgressLogRepository);
  container.register('CommitmentRepository', CommitmentRepository);
  container.register('CommitmentLogRepository', CommitmentLogRepository);
  container.register('TimelineEventRepository', TimelineEventRepository);

  // Services with dependencies
  container.register('AuthService', AuthService);
  container.register('UserPreferencesService', UserPreferencesService);
  container.register('RefreshTokenService', RefreshTokenService);
  container.register('ProgressItemService', ProgressItemService);
  container.register('CommitmentService', CommitmentService);
  container.register('TimelineEventService', TimelineEventService);
  container.register('DashboardService', DashboardService);

  servicesRegistered = true;
  console.log('Services registered in container');
}

// Auto-export for convenience
export { container };
