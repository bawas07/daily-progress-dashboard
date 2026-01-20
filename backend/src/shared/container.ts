/**
 * Simple Service Locator Container
 *
 * A lightweight dependency injection alternative without decorators.
 * Services are registered once and instantiated lazily on first access.
 *
 * Usage:
 *   container.register('DatabaseService', DatabaseService);
 *   const db = container.resolve<DatabaseService>('DatabaseService');
 */

type Constructor<T> = new (...args: any[]) => T;

export class Container {
  private factories = new Map<string, Constructor<any>>();
  private instances = new Map<string, any>();

  /**
   * Register a service factory
   */
  register<T>(name: string, Factory: Constructor<T>): void {
    if (this.factories.has(name)) {
      throw new Error(`Service ${name} already registered`);
    }
    this.factories.set(name, Factory);
  }

  /**
   * Resolve a service (creates instance if needed)
   */
  resolve<T>(name: string): T {
    // Return existing instance
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Create new instance
    const Factory = this.factories.get(name);
    if (!Factory) {
      throw new Error(`Service ${name} not registered. Did you forget to call container.register()?`);
    }

    // Create instance with container as first argument (for dependency injection)
    const instance = new Factory(this);
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.factories.clear();
    this.instances.clear();
  }
}

// Export singleton instance
export const container = new Container();

// Type helper for services that need container access
export interface HasContainer {
  container: Container;
}
