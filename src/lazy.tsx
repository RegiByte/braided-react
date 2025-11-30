/**
 * Lazy System Bridge - Start System on Mount
 *
 * A bridge component that starts the system when it mounts.
 *
 * Lifecycle Ownership:
 * - If `manager` is provided: Uses the manager (idempotent, survives remounts)
 * - If `onUnmount` is provided: Calls it when component unmounts
 * - Otherwise: System lives beyond component lifecycle (no cleanup)
 */

import { useEffect, useState, useRef } from "react";
import { startSystem } from "braided";
import type { SystemConfig, StartedSystem } from "braided";

export type LazySystemBridgeProps<TConfig extends SystemConfig> = {
  /** The system configuration to start (required if manager not provided) */
  config?: TConfig;

  /** Optional system manager for idempotent, persistent systems */
  manager?: {
    getSystem: () => Promise<StartedSystem<TConfig>>;
    getCurrentSystem: () => StartedSystem<TConfig> | null;
    getStartupErrors: () => Map<string, Error> | null;
  };

  /** Children to render once system is started */
  children: React.ReactNode;

  /** The SystemBridge component to use (from createSystemHooks) */
  SystemBridge: React.ComponentType<{
    system: StartedSystem<TConfig>;
    children: React.ReactNode;
  }>;

  /** Optional callback when system starts successfully */
  onStarted?: (system: StartedSystem<TConfig>) => void;

  /** Optional callback when system startup has errors */
  onError?: (errors: Map<string, Error>) => void;

  /** Optional callback when component unmounts - decide cleanup behavior */
  onUnmount?: (system: StartedSystem<TConfig>) => void | Promise<void>;

  /** Optional fallback to show while system is starting */
  fallback?: React.ReactNode;
};

/**
 * A bridge that starts the system on mount.
 *
 * Three usage patterns:
 *
 * 1. With manager (recommended for persistent systems):
 * ```typescript
 * const manager = createSystemManager(config)
 * <LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
 *   <App />
 * </LazySystemBridge>
 * ```
 *
 * 2. With onUnmount callback (explicit cleanup):
 * ```typescript
 * <LazySystemBridge
 *   config={config}
 *   SystemBridge={SystemBridge}
 *   onUnmount={(sys) => haltSystem(config, sys)}
 * >
 *   <App />
 * </LazySystemBridge>
 * ```
 *
 * 3. Standalone (system lives beyond component):
 * ```typescript
 * <LazySystemBridge config={config} SystemBridge={SystemBridge}>
 *   <App />
 * </LazySystemBridge>
 * ```
 */
export function LazySystemBridge<TConfig extends SystemConfig>({
  config,
  manager,
  children,
  SystemBridge,
  onStarted,
  onError,
  onUnmount,
  fallback = null,
}: LazySystemBridgeProps<TConfig>) {
  const [system, setSystem] = useState<StartedSystem<TConfig> | null>(null);
  const systemRef = useRef<StartedSystem<TConfig> | null>(null);

  useEffect(() => {
    let mounted = true;

    // Start system using manager (idempotent) or directly (one-off)
    const startPromise = manager
      ? manager.getSystem().then((sys) => {
          const errors = manager.getStartupErrors() || new Map();
          return { system: sys, errors };
        })
      : config
      ? startSystem(config)
      : Promise.reject(
          new Error("LazySystemBridge: Either config or manager is required")
        );

    startPromise
      .then(({ system, errors }) => {
        if (!mounted) return;

        if (errors.size > 0) {
          onError?.(errors);
        }

        systemRef.current = system;
        setSystem(system);
        onStarted?.(system);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error(
          "[braided-react] LazySystemBridge startup failed:",
          error
        );
      });

    return () => {
      mounted = false;

      // Call onUnmount if provided and system was started
      if (systemRef.current && onUnmount) {
        try {
          Promise.resolve(onUnmount(systemRef.current)).catch((error) => {
            console.error(
              "[braided-react] LazySystemBridge onUnmount error:",
              error
            );
          });
        } catch (error) {
          // Handle synchronous errors thrown by onUnmount
          console.error(
            "[braided-react] LazySystemBridge onUnmount error:",
            error
          );
        }
      }
    };
  }, []); // Start once, never restart

  if (!system) {
    return <>{fallback}</>;
  }

  return <SystemBridge system={system}>{children}</SystemBridge>;
}
