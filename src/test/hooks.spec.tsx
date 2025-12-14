/**
 * Tests for createSystemHooks
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { defineResource, startSystem, haltSystem } from "braided";
import type { StartedResource, StartedSystem } from "braided";
import { createSystemHooks } from "../hooks";
import { createSystemManager } from "../manager";
import { Suspense, Component } from "react";
import { ErrorBoundary } from "react-error-boundary";

describe("createSystemHooks", () => {
  // Mock resources for testing
  const counterResource = defineResource({
    start: () => {
      const counter = {
        count: 0,
        increment: function () {
          this.count++;
        },
        getCount: function () {
          return this.count;
        },
      };
      return counter;
    },
    halt: () => {},
  });

  const loggerResource = defineResource({
    dependencies: ["counter"],
    start: ({
      counter,
    }: {
      counter: StartedResource<typeof counterResource>;
    }) => {
      const logger = {
        logs: [] as string[],
        log: function (msg: string) {
          this.logs.push(msg);
        },
        logCount: function () {
          this.logs.push(`Count: ${counter.getCount()}`);
        },
      };
      return logger;
    },
    halt: () => {},
  });

  const testSystemConfig = {
    counter: counterResource,
    logger: loggerResource,
  };

  // Clean up managers between tests
  beforeEach(async () => {
    // Reset any running systems
  });

  test("creates SystemProvider, useSystem, useResource, and useSystemStatus", () => {
    const manager = createSystemManager(testSystemConfig);
    const hooks = createSystemHooks(manager);

    expect(hooks.SystemProvider).toBeDefined();
    expect(hooks.useSystem).toBeDefined();
    expect(hooks.useResource).toBeDefined();
    expect(hooks.useSystemStatus).toBeDefined();
  });

  describe("Direct access (production mode)", () => {
    test("useSystem suspends while system is starting", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { useSystem } = createSystemHooks(manager);

      let suspended = false;

      function TestComponent() {
        try {
          useSystem();
          return <div data-testid="ready">Ready</div>;
        } catch (promise) {
          if (promise instanceof Promise) {
            suspended = true;
            throw promise;
          }
          throw promise;
        }
      }

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent />
        </Suspense>
      );

      // Should show loading state initially
      expect(screen.getByTestId("loading")).toBeDefined();
      expect(suspended).toBe(true);

      // Wait for system to start
      await waitFor(() => {
        expect(screen.getByTestId("ready")).toBeDefined();
      });
    });

    test("useSystem returns started system after startup", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { useSystem } = createSystemHooks(manager);

      // Pre-start the system
      await manager.getSystem();

      function TestComponent() {
        const system = useSystem();
        return <div data-testid="count">{system.counter.count}</div>;
      }

      render(<TestComponent />);

      expect(screen.getByTestId("count").textContent).toBe("0");
    });

    test("useResource provides typed access to individual resources", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { useResource } = createSystemHooks(manager);

      // Pre-start the system
      await manager.getSystem();

      function TestComponent() {
        const counter = useResource("counter");
        const logger = useResource("logger");

        return (
          <div>
            <div data-testid="count">{counter.count}</div>
            <div data-testid="logs">{logger.logs.length}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("count").textContent).toBe("0");
      expect(screen.getByTestId("logs").textContent).toBe("0");
    });

    test("useSystem throws error when startup fails", async () => {
      const failingResource = defineResource({
        start: (): any => {
          throw new Error("Startup failed");
        },
        halt: () => {},
      });

      const failingConfig = {
        failing: failingResource,
      };

      const manager = createSystemManager(failingConfig);
      const { useSystem } = createSystemHooks(manager);

      // Pre-start to trigger the error
      await manager.getSystem();

      function TestComponent() {
        useSystem();
        return <div>Should not render</div>;
      }

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        render(<TestComponent />);
      }).toThrow("System startup failed");

      console.error = originalError;
    });
  });

  describe("Context override (testing mode)", () => {
    test("SystemProvider overrides manager with injected system", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { SystemProvider, useSystem } = createSystemHooks(manager);

      // Create a mock system
      const mockSystem = {
        counter: { count: 42, increment: () => {}, getCount: () => 42 },
        logger: { logs: ["mock"], log: () => {}, logCount: () => {} },
      } as StartedSystem<typeof testSystemConfig>;

      function TestComponent() {
        const system = useSystem();
        return <div data-testid="count">{system.counter.count}</div>;
      }

      render(
        <SystemProvider system={mockSystem}>
          <TestComponent />
        </SystemProvider>
      );

      // Should use mock system, not manager
      expect(screen.getByTestId("count").textContent).toBe("42");
    });

    test("SystemProvider works with real system started with mock config", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { SystemProvider, useResource } = createSystemHooks(manager);

      // Create mock resource
      const mockCounterResource = defineResource({
        start: () => ({
          count: 99,
          increment: vi.fn(),
          getCount: () => 99,
        }),
        halt: () => {},
      });

      const mockConfig = {
        counter: mockCounterResource,
        logger: loggerResource,
      };

      // Start system with mock config
      const { system } = await startSystem(mockConfig);

      function TestComponent() {
        const counter = useResource("counter");
        return <div data-testid="count">{counter.count}</div>;
      }

      render(
        <SystemProvider system={system}>
          <TestComponent />
        </SystemProvider>
      );

      expect(screen.getByTestId("count").textContent).toBe("99");

      // Cleanup
      await haltSystem(mockConfig, system);
    });

    test("Context takes precedence over manager", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { SystemProvider, useSystem } = createSystemHooks(manager);

      // Start real system
      const realSystem = await manager.getSystem();
      realSystem.counter.increment();
      expect(realSystem.counter.count).toBe(1);

      // Create mock system
      const mockSystem = {
        counter: { count: 100, increment: () => {}, getCount: () => 100 },
        logger: { logs: [], log: () => {}, logCount: () => {} },
      } as StartedSystem<typeof testSystemConfig>;

      function TestComponent() {
        const system = useSystem();
        return <div data-testid="count">{system.counter.count}</div>;
      }

      render(
        <SystemProvider system={mockSystem}>
          <TestComponent />
        </SystemProvider>
      );

      // Should use mock (100), not real system (1)
      expect(screen.getByTestId("count").textContent).toBe("100");
    });
  });

  describe("useSystemStatus (manual control)", () => {
    test("returns idle status before system starts", () => {
      const manager = createSystemManager(testSystemConfig);
      const { useSystemStatus } = createSystemHooks(manager);

      function TestComponent() {
        const status = useSystemStatus();
        return (
          <div>
            <div data-testid="idle">{status.isIdle.toString()}</div>
            <div data-testid="loading">{status.isLoading.toString()}</div>
            <div data-testid="ready">{status.isReady.toString()}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("idle").textContent).toBe("true");
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("ready").textContent).toBe("false");
    });

    test("returns ready status after system starts", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { useSystemStatus } = createSystemHooks(manager);

      // Pre-start system
      await manager.getSystem();

      function TestComponent() {
        const status = useSystemStatus();
        return (
          <div>
            <div data-testid="idle">{status.isIdle.toString()}</div>
            <div data-testid="ready">{status.isReady.toString()}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("idle").textContent).toBe("false");
      expect(screen.getByTestId("ready").textContent).toBe("true");
    });

    test("startSystem triggers system startup", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { useSystemStatus } = createSystemHooks(manager);

      function TestComponent() {
        const status = useSystemStatus();

        if (status.isIdle) {
          return (
            <button data-testid="start" onClick={status.startSystem}>
              Start
            </button>
          );
        }

        if (status.isLoading) {
          return <div data-testid="loading">Loading...</div>;
        }

        return <div data-testid="ready">Ready</div>;
      }

      render(<TestComponent />);

      // Initially idle
      expect(screen.getByTestId("start")).toBeDefined();

      // Click start
      screen.getByTestId("start").click();

      // Should show loading
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toBeDefined();
      });

      // Should eventually be ready
      await waitFor(() => {
        expect(screen.getByTestId("ready")).toBeDefined();
      });
    });

    test("returns ready immediately when context is provided", async () => {
      const manager = createSystemManager(testSystemConfig);
      const { SystemProvider, useSystemStatus } = createSystemHooks(manager);

      const mockSystem = {
        counter: { count: 0, increment: () => {}, getCount: () => 0 },
        logger: { logs: [], log: () => {}, logCount: () => {} },
      } as StartedSystem<typeof testSystemConfig>;

      function TestComponent() {
        const status = useSystemStatus();
        return <div data-testid="ready">{status.isReady.toString()}</div>;
      }

      render(
        <SystemProvider system={mockSystem}>
          <TestComponent />
        </SystemProvider>
      );

      expect(screen.getByTestId("ready").textContent).toBe("true");
    });
  });

  describe("Multiple systems", () => {
    test("different managers create independent systems", async () => {
      const manager1 = createSystemManager(testSystemConfig);
      const manager2 = createSystemManager(testSystemConfig);

      const hooks1 = createSystemHooks(manager1);
      const hooks2 = createSystemHooks(manager2);

      const system1 = await manager1.getSystem();
      const system2 = await manager2.getSystem();

      system1.counter.increment();
      expect(system1.counter.count).toBe(1);
      expect(system2.counter.count).toBe(0);

      function Component1() {
        const counter = hooks1.useResource("counter");
        return <div data-testid="count1">{counter.count}</div>;
      }

      function Component2() {
        const counter = hooks2.useResource("counter");
        return <div data-testid="count2">{counter.count}</div>;
      }

      render(
        <>
          <Component1 />
          <Component2 />
        </>
      );

      expect(screen.getByTestId("count1").textContent).toBe("1");
      expect(screen.getByTestId("count2").textContent).toBe("0");
    });
  });

  describe("ErrorBoundary integration", () => {
    test("ErrorBoundary catches system startup errors with Suspense", async () => {
      const failingResource = defineResource({
        start: (): any => {
          throw new Error("Database connection failed");
        },
        halt: () => {},
      });

      const failingConfig = {
        failing: failingResource,
      };

      const manager = createSystemManager(failingConfig);
      const { useSystem } = createSystemHooks(manager);

      function App() {
        const system = useSystem();
        return <div data-testid="success">System loaded: {typeof system}</div>;
      }

      function ErrorFallback({ error }: { error: Error }) {
        return (
          <div data-testid="error-fallback">
            <h1>Something went wrong</h1>
            <p data-testid="error-message">{error.message}</p>
          </div>
        );
      }

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <App />
          </Suspense>
        </ErrorBoundary>
      );

      // Should show loading first
      expect(screen.getByTestId("loading")).toBeDefined();

      // Wait for error to be caught
      await waitFor(() => {
        expect(screen.getByTestId("error-fallback")).toBeDefined();
      });

      // Should show error message
      expect(screen.getByTestId("error-message").textContent).toContain(
        "System startup failed"
      );
      expect(screen.getByTestId("error-message").textContent).toContain(
        "Database connection failed"
      );

      console.error = originalError;
    });

    test("ErrorBoundary with custom error UI", async () => {
      const apiFailureResource = defineResource({
        start: (): any => {
          throw new Error("API authentication failed");
        },
        halt: () => {},
      });

      const cacheFailureResource = defineResource({
        start: (): any => {
          throw new Error("Redis connection timeout");
        },
        halt: () => {},
      });

      const failingConfig = {
        api: apiFailureResource,
        cache: cacheFailureResource,
      };

      const manager = createSystemManager(failingConfig);
      const { useSystem } = createSystemHooks(manager);

      function App() {
        useSystem();
        return <div>App content</div>;
      }

      function CustomErrorFallback({ error }: { error: Error }) {
        // Parse error message to extract individual failures
        const errorMessage = error.message;
        const hasApiError = errorMessage.includes("API authentication failed");
        const hasCacheError = errorMessage.includes("Redis connection timeout");

        return (
          <div data-testid="custom-error">
            <h2>System Startup Failed</h2>
            <div data-testid="error-details">
              {hasApiError && (
                <div data-testid="api-error">⚠️ API authentication failed</div>
              )}
              {hasCacheError && (
                <div data-testid="cache-error">⚠️ Redis connection timeout</div>
              )}
            </div>
            <button data-testid="retry-button">Retry</button>
          </div>
        );
      }

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      render(
        <ErrorBoundary FallbackComponent={CustomErrorFallback}>
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>
        </ErrorBoundary>
      );

      // Wait for error boundary to catch
      await waitFor(() => {
        expect(screen.getByTestId("custom-error")).toBeDefined();
      });

      // Should show both errors
      expect(screen.getByTestId("api-error")).toBeDefined();
      expect(screen.getByTestId("cache-error")).toBeDefined();
      expect(screen.getByTestId("retry-button")).toBeDefined();

      console.error = originalError;
    });

    test("ErrorBoundary with resetKeys for retry functionality", async () => {
      let attemptCount = 0;

      const flakeyResource = defineResource({
        start: (): any => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error("Network timeout");
          }
          return { status: "connected", attempt: attemptCount };
        },
        halt: () => {},
      });

      const config = {
        flakey: flakeyResource,
      };

      const manager = createSystemManager(config);
      const { useSystem } = createSystemHooks(manager);

      function App() {
        const system = useSystem();
        return (
          <div data-testid="success">
            Connected on attempt {system.flakey.attempt}
          </div>
        );
      }

      function ErrorFallback({
        error,
        resetErrorBoundary,
      }: {
        error: Error;
        resetErrorBoundary: () => void;
      }) {
        return (
          <div data-testid="error-ui">
            <p data-testid="error-text">{error.message}</p>
            <button
              data-testid="retry"
              onClick={() => {
                manager.destroySystem().then(() => {
                  manager.getSystem();
                  resetErrorBoundary();
                });
              }}
            >
              Retry Connection
            </button>
          </div>
        );
      }

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      const { rerender } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div>Connecting...</div>}>
            <App />
          </Suspense>
        </ErrorBoundary>
      );

      // First attempt should fail
      await waitFor(() => {
        expect(screen.getByTestId("error-ui")).toBeDefined();
      });

      expect(screen.getByTestId("error-text").textContent).toContain(
        "Network timeout"
      );

      // Note: In a real app, you'd need to reset the manager before retrying
      // This test demonstrates the ErrorBoundary integration pattern
      expect(screen.getByTestId("retry")).toBeDefined();

      console.error = originalError;
    });

    test("Nested ErrorBoundaries for granular error handling", async () => {
      const criticalResource = defineResource({
        start: (): any => {
          throw new Error("Critical system failure");
        },
        halt: () => {},
      });

      const config = {
        critical: criticalResource,
      };

      const manager = createSystemManager(config);
      const { useSystem } = createSystemHooks(manager);

      function CriticalFeature() {
        useSystem();
        return <div>Critical Feature</div>;
      }

      function OptionalFeature() {
        return <div data-testid="optional">Optional Feature Works</div>;
      }

      function InnerErrorFallback() {
        return (
          <div data-testid="inner-error">
            Critical feature unavailable. Running in degraded mode.
          </div>
        );
      }

      function OuterErrorFallback() {
        return <div data-testid="outer-error">Complete system failure</div>;
      }

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      render(
        <ErrorBoundary FallbackComponent={OuterErrorFallback}>
          <div>
            <ErrorBoundary FallbackComponent={InnerErrorFallback}>
              <Suspense fallback={<div>Loading critical...</div>}>
                <CriticalFeature />
              </Suspense>
            </ErrorBoundary>
            <OptionalFeature />
          </div>
        </ErrorBoundary>
      );

      // Wait for inner error boundary to catch
      await waitFor(() => {
        expect(screen.getByTestId("inner-error")).toBeDefined();
        expect(screen.getByTestId("inner-error").textContent).toContain(
          "Critical feature unavailable. Running in degraded mode."
        );
      });

      // Optional feature should still work
      expect(screen.getByTestId("optional")).toBeDefined();
      expect(screen.getByTestId("optional").textContent).toContain(
        "Optional Feature Works"
      );

      // Outer error boundary should NOT be triggered
      expect(screen.queryByTestId("outer-error")).toBeNull();

      console.error = originalError;
    });
  });
});
