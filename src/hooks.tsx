/**
 * React Hooks for Braided Systems
 *
 * Provides type-safe hooks for accessing resources from a Braided system.
 * The system lifecycle is managed outside React - React is just an observer.
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { StartedSystem, SystemConfig } from "braided";
import type { createSystemManager } from "./manager";

/**
 * System status for manual control.
 */
export type SystemStatus<TConfig extends SystemConfig = any> = {
  isIdle: boolean; // Not started yet
  isLoading: boolean; // Starting now
  isReady: boolean; // Started successfully
  isError: boolean; // Startup failed
  system: StartedSystem<TConfig> | null;
  errors: Map<string, Error> | null;
  startSystem: () => void; // Trigger startup manually
};

/**
 * Creates typed hooks for a system.
 *
 * IMPORTANT: Always pass the manager. Create hooks once at module level
 * and export them. The SystemProvider is for testing/DI override only.
 *
 * Resolution order:
 * 1. Context (if SystemProvider is in tree) - for testing/DI
 * 2. Manager (always provided) - for production
 *
 * @param manager - The system manager (REQUIRED)
 * @returns Hooks and Provider for the system
 *
 * @example Setup (once):
 * ```typescript
 * // system.ts
 * export const manager = createSystemManager(config)
 * export const { useSystem, useResource, SystemProvider } = createSystemHooks(manager)
 * ```
 *
 * @example Production (automatic with Suspense):
 * ```typescript
 * import { useSystem } from './system'
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<Loading />}>
 *       <ErrorBoundary FallbackComponent={ErrorScreen}>
 *         <ChatRoom />
 *       </ErrorBoundary>
 *     </Suspense>
 *   )
 * }
 *
 * function ChatRoom() {
 *   const system = useSystem() // Suspends until ready!
 *   return <div>...</div>
 * }
 * ```
 *
 * @example Testing (context injection):
 * ```typescript
 * import { SystemProvider } from './system'  // Same hooks as production!
 * import { startSystem } from 'braided'
 *
 * test('component works', async () => {
 *   // Start system with mock resources
 *   const mockConfig = { ...config, api: mockApiResource }
 *   const { system } = await startSystem(mockConfig)
 *
 *   render(
 *     <SystemProvider system={system}>
 *       <Component />
 *     </SystemProvider>
 *   )
 *
 *   // Test...
 *
 *   await haltSystem(mockConfig, system)
 * })
 * ```
 *
 * @example Manual control:
 * ```typescript
 * import { useSystemStatus } from './system'
 *
 * function App() {
 *   const { isIdle, isLoading, startSystem } = useSystemStatus()
 *
 *   if (isIdle) {
 *     return <WelcomeScreen onStart={startSystem} />
 *   }
 *
 *   if (isLoading) {
 *     return <LoadingScreen />
 *   }
 *
 *   return <ChatRoom />
 * }
 * ```
 */
export function createSystemHooks<TConfig extends SystemConfig>(
  manager: ReturnType<typeof createSystemManager<TConfig>>
) {
  // Create context for dependency injection (optional override)
  const SystemContext = createContext<StartedSystem<TConfig> | null>(null);

  /**
   * Provider for dependency injection.
   *
   * Use this in tests or when you need to override the default manager.
   * In production, this is optional - hooks will use the manager directly.
   *
   * @param system - The started system instance to inject
   * @param children - React children to render
   */
  function SystemProvider({
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
   * Resolution order:
   * 1. Context (if SystemProvider is in tree) - for testing/DI
   * 2. Manager (default) - for production
   *
   * Integrates with React Suspense and ErrorBoundary:
   * - Suspends (throws promise) while system is starting
   * - Throws error if system startup failed
   * - Returns system once ready
   *
   * @returns The started system instance
   * @throws Promise if system is starting (triggers Suspense)
   * @throws Error if system startup failed (triggers ErrorBoundary)
   */
  function useSystem(): StartedSystem<TConfig> {
    // Try context first (DI override)
    const contextSystem = useContext(SystemContext);
    if (contextSystem) {
      return contextSystem;
    }

    // Fall back to manager (production path)
    const current = manager.getCurrentSystem();

    // Already started - check for errors
    if (current) {
      const errors = manager.getStartupErrors();
      if (errors && errors.size > 0) {
        // Throw error to trigger ErrorBoundary
        const errorList = Array.from(errors.entries())
          .map(([id, err]) => `${id}: ${err.message}`)
          .join(", ");
        throw new Error(`System startup failed: ${errorList}`);
      }
      return current;
    }

    // Not started yet - start and suspend
    throw manager.getSystem().then(() => {
      const errors = manager.getStartupErrors();
      if (errors && errors.size > 0) {
        const errorList = Array.from(errors.entries())
          .map(([id, err]) => `${id}: ${err.message}`)
          .join(", ");
        throw new Error(`System startup failed: ${errorList}`);
      }
    });
  }

  /**
   * Hook to access a single resource from the system.
   *
   * Provides full type inference - TypeScript knows the exact type
   * of the resource based on the resourceId.
   *
   * @param resourceId - The ID of the resource to access
   * @returns The started resource instance, fully typed
   * @throws Same as useSystem (Suspense/ErrorBoundary integration)
   */
  function useResource<K extends keyof TConfig>(
    resourceId: K
  ): StartedSystem<TConfig>[K] {
    const system = useSystem();
    return system[resourceId];
  }

  /**
   * Hook for manual system startup control.
   *
   * Unlike useSystem, this does NOT suspend or throw.
   * Instead, it returns status and a manual trigger.
   *
   * Use this when you want to:
   * - Show a welcome screen before starting
   * - Defer startup until user action
   * - Manually handle loading/error states
   *
   * @returns System status and manual start trigger
   */
  function useSystemStatus(): SystemStatus<TConfig> {
    const contextSystem = useContext(SystemContext);

    // If context provided, system is ready
    if (contextSystem) {
      return {
        isIdle: false,
        isLoading: false,
        isReady: true,
        isError: false,
        system: contextSystem,
        errors: null,
        startSystem: () => {}, // No-op, already started
      };
    }

    // Otherwise check manager
    const [status, setStatus] = useState<
      "idle" | "loading" | "ready" | "error"
    >(() => {
      return manager.isStarted() ? "ready" : "idle";
    });

    const startSystem = useCallback(() => {
      if (manager.isStarted()) {
        setStatus("ready");
        return;
      }

      setStatus("loading");
      manager
        .getSystem()
        .then(() => {
          const errors = manager.getStartupErrors();
          if (errors && errors.size > 0) {
            setStatus("error");
          } else {
            setStatus("ready");
          }
        })
        .catch(() => {
          setStatus("error");
        });
    }, []);

    return {
      isIdle: status === "idle",
      isLoading: status === "loading",
      isReady: status === "ready",
      isError: status === "error",
      system: manager.getCurrentSystem(),
      errors: manager.getStartupErrors(),
      startSystem,
    };
  }

  return {
    SystemProvider,
    useSystem,
    useResource,
    useSystemStatus,
  };
}
