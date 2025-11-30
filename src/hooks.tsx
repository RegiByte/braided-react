/**
 * React Hooks for Braided Systems
 *
 * Provides type-safe hooks for accessing resources from a Braided system.
 * The system lifecycle is managed outside React - React is just an observer.
 */

import { createContext, useContext } from "react";
import type { StartedSystem, SystemConfig } from "braided";

/**
 * Creates a set of React hooks for a specific system configuration.
 *
 * This is the core primitive of braided-react. It creates:
 * - SystemBridge: A context provider that makes the system available to React
 * - useSystem: Hook to access the entire system
 * - useResource: Hook to access a single resource with full type inference
 *
 * @example
 * ```typescript
 * const systemConfig = {
 *   database: databaseResource,
 *   cache: cacheResource,
 *   api: apiResource,
 * }
 *
 * const { SystemBridge, useSystem, useResource } = createSystemHooks<typeof systemConfig>()
 *
 * // In your app:
 * const started = await startSystem(systemConfig)
 *
 * <SystemBridge system={started.system}>
 *   <App />
 * </SystemBridge>
 *
 * // In components:
 * function MyComponent() {
 *   const database = useResource('database')
 *   const cache = useResource('cache')
 *   // Both are fully typed!
 * }
 * ```
 */
export function createSystemHooks<TConfig extends SystemConfig>() {
  const SystemContext = createContext<StartedSystem<TConfig> | null>(null);

  /**
   * Bridge component that provides the system to React.
   *
   * IMPORTANT: This component does NOT manage the system lifecycle.
   * The system must be started externally and passed in.
   * React is just an observer - it doesn't own the system.
   *
   * @param system - The started system instance
   * @param children - React children to render
   */
  function SystemBridge({
    system,
    children,
  }: {
    system: StartedSystem<TConfig>;
    children: React.ReactNode;
  }) {
    return (
      <SystemContext.Provider value={system}>{children}</SystemContext.Provider>
    );
  }

  /**
   * Hook to access the entire system.
   *
   * @throws Error if SystemBridge is not in the component tree
   * @returns The complete started system with all resources
   */
  function useSystem(): StartedSystem<TConfig> {
    const system = useContext(SystemContext);
    if (!system) {
      throw new Error(
        "useSystem: SystemBridge is missing in the component tree. " +
          "Make sure your component is wrapped with <SystemBridge system={...}>."
      );
    }
    return system;
  }

  /**
   * Hook to access a single resource from the system.
   *
   * Provides full type inference - TypeScript knows the exact type
   * of the resource based on the resourceId.
   *
   * @param resourceId - The ID of the resource to access
   * @throws Error if SystemBridge is not in the component tree
   * @returns The started resource instance, fully typed
   *
   * @example
   * ```typescript
   * function MyComponent() {
   *   const database = useResource('database')
   *   // TypeScript knows database's exact type!
   *   const users = await database.query('SELECT * FROM users')
   * }
   * ```
   */
  function useResource<K extends keyof TConfig>(
    resourceId: K
  ): StartedSystem<TConfig>[K] {
    const system = useSystem();
    return system[resourceId];
  }

  return {
    SystemBridge,
    useSystem,
    useResource,
  };
}
