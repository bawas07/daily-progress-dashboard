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

  // Repositories (depend on DatabaseService)
  container.register('UserRepository', UserRepository);
  container.register('UserPreferencesRepository', UserPreferencesRepository);

  servicesRegistered = true;
  console.log('Services registered in container');
}

// Auto-export for convenience
export { container };
