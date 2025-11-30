/**
 * System Manager - Singleton Pattern Helper
 *
 * Provides a simple way to manage a single system instance outside React.
 * Useful for the "module singleton" pattern where the system lives
 * independently of React's lifecycle.
 */

import { startSystem, haltSystem } from "braided";
import type { SystemConfig, StartedSystem, SystemStartResult } from "braided";

/**
 * Creates a manager for a system that ensures only one instance exists.
 *
 * This implements the "module singleton" pattern - the system is started
 * once and reused across all React mounts/unmounts. React components just
 * observe the system, they don't control its lifecycle.
 *
 * @param config - The system configuration
 * @returns Manager with getSystem, destroySystem, and getCurrentSystem methods
 *
 * @example
 * ```typescript
 * // Create manager once at module level
 * const gameSystemManager = createSystemManager(gameSystemConfig)
 *
 * // In your app/component:
 * const system = await gameSystemManager.getSystem()
 *
 * // When truly done (e.g., user logs out):
 * await gameSystemManager.destroySystem()
 * ```
 */
export function createSystemManager<TConfig extends SystemConfig>(
  config: TConfig
) {
  let systemPromise: Promise<SystemStartResult<TConfig>> | null = null;
  let systemInstance: StartedSystem<TConfig> | null = null;
  let startupErrors: Map<string, Error> | null = null;

  /**
   * Get or start the system. Idempotent - only starts once.
   *
   * If the system is already starting or started, returns the same instance.
   * If startup errors occurred, they're logged but the system is still returned
   * (graceful degradation - some resources may be undefined).
   *
   * @returns Promise resolving to the started system
   */
  async function getSystem(): Promise<StartedSystem<TConfig>> {
    if (!systemPromise) {
      systemPromise = startSystem(config).then((result) => {
        systemInstance = result.system;
        startupErrors = result.errors;

        if (result.errors.size > 0) {
          console.error(
            `[braided-react] System startup completed with ${result.errors.size} error(s):`,
            result.errors
          );
        }

        return result;
      });
    }

    const result = await systemPromise;
    return result.system;
  }

  /**
   * Explicitly halt the system and reset the manager.
   *
   * Call this when you're truly done with the system (e.g., user logs out,
   * navigates to a completely different part of the app, etc.).
   *
   * After calling this, the next call to getSystem() will start a fresh system.
   *
   * @returns Promise resolving when the system is fully halted
   */
  async function destroySystem(): Promise<void> {
    if (systemPromise && systemInstance) {
      const { errors } = await haltSystem(config, systemInstance);

      if (errors.size > 0) {
        console.error(
          `[braided-react] System shutdown completed with ${errors.size} error(s):`,
          errors
        );
      }

      systemPromise = null;
      systemInstance = null;
      startupErrors = null;
    }
  }

  /**
   * Get the current system instance if already started, null otherwise.
   *
   * This is a synchronous check - useful for conditional logic.
   * If you need to ensure the system is started, use getSystem() instead.
   *
   * @returns The current system instance or null
   */
  function getCurrentSystem(): StartedSystem<TConfig> | null {
    return systemInstance;
  }

  /**
   * Get startup errors from the last system start, if any.
   *
   * @returns Map of resource IDs to errors, or null if system hasn't started
   */
  function getStartupErrors(): Map<string, Error> | null {
    return startupErrors;
  }

  /**
   * Check if the system is currently started.
   *
   * @returns true if system is started, false otherwise
   */
  function isStarted(): boolean {
    return systemInstance !== null;
  }

  return {
    getSystem,
    destroySystem,
    getCurrentSystem,
    getStartupErrors,
    isStarted,
  };
}

/**
 * Type helper to extract the system type from a manager
 */
export type ManagedSystem<T> = T extends ReturnType<
  typeof createSystemManager<infer TConfig extends SystemConfig>
>
  ? StartedSystem<TConfig>
  : never;
