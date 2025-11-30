/**
 * Tests for LazySystemBridge
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LazySystemBridge } from "../lazy";
import { createSystemHooks } from "../hooks";
import { createSystemManager } from "../manager";
import { defineResource, haltSystem } from "braided";

describe("LazySystemBridge", () => {
  const counterResource = defineResource({
    start: async () => {
      // Simulate async startup
      await new Promise((resolve) => setTimeout(resolve, 10));
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

  const testConfig = {
    counter: counterResource,
  };

  const { SystemBridge, useResource } = createSystemHooks<typeof testConfig>();

  test("shows fallback while system is starting", async () => {
    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        fallback={<div data-testid="loading">Loading...</div>}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    // Should show fallback initially
    expect(screen.getByTestId("loading")).toBeDefined();
  });

  test("renders children once system is started", async () => {
    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        fallback={<div data-testid="loading">Loading...</div>}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    // Wait for system to start
    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  test("calls onStarted callback when system starts", async () => {
    const onStarted = vi.fn();

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        onStarted={onStarted}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(onStarted).toHaveBeenCalledTimes(1);
    });

    expect(onStarted).toHaveBeenCalledWith(
      expect.objectContaining({
        counter: expect.any(Object),
      })
    );
  });

  test("calls onError callback when system has startup errors", async () => {
    const onError = vi.fn();

    const failingResource = defineResource({
      start: (): any => {
        throw new Error("Intentional failure");
      },
      halt: () => {},
    });

    const configWithError = {
      counter: counterResource,
      failing: failingResource,
    };

    const { SystemBridge: ErrorSystemBridge, useResource: useErrorResource } =
      createSystemHooks<typeof configWithError>();

    function TestComponent() {
      const counter = useErrorResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    render(
      <LazySystemBridge
        config={configWithError}
        SystemBridge={ErrorSystemBridge}
        onError={onError}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    const errors = onError.mock.calls[0][0];
    expect(errors.size).toBe(1);
    expect(errors.has("failing")).toBe(true);
  });

  test("does not halt system on unmount", async () => {
    const haltSpy = vi.fn();

    const trackedResource = defineResource({
      start: () => ({ value: "test" }),
      halt: haltSpy,
    });

    const trackedConfig = {
      tracked: trackedResource,
    };

    const { SystemBridge: TrackedBridge, useResource: useTrackedResource } =
      createSystemHooks<typeof trackedConfig>();

    function TestComponent() {
      const tracked = useTrackedResource("tracked");
      return <div data-testid="value">{tracked.value}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge config={trackedConfig} SystemBridge={TrackedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("value")).toBeDefined();
    });

    // Unmount the component
    unmount();

    // Wait a bit to ensure halt is not called
    await new Promise((resolve) => setTimeout(resolve, 50));

    // halt should NOT have been called
    expect(haltSpy).not.toHaveBeenCalled();
  });

  test("starts system only once even with StrictMode double-mount", async () => {
    const startSpy = vi.fn(() => ({ count: 0 }));

    const spiedResource = defineResource({
      start: startSpy,
      halt: () => {},
    });

    const spiedConfig = {
      spied: spiedResource,
    };

    const { SystemBridge: SpiedBridge, useResource: useSpiedResource } =
      createSystemHooks<typeof spiedConfig>();

    function TestComponent() {
      const spied = useSpiedResource("spied");
      return <div data-testid="count">{spied.count}</div>;
    }

    // Simulate StrictMode by rendering twice
    const { rerender } = render(
      <LazySystemBridge config={spiedConfig} SystemBridge={SpiedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    // Remount (simulating StrictMode)
    rerender(
      <LazySystemBridge config={spiedConfig} SystemBridge={SpiedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    // Start should only be called once
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  test("renders null fallback by default", async () => {
    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    const { container } = render(
      <LazySystemBridge config={testConfig} SystemBridge={SystemBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    // Before system starts, should render nothing (null fallback)
    expect(container.textContent).toBe("");

    // Wait for system to start
    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });
  });

  test("calls onUnmount callback when component unmounts", async () => {
    const onUnmount = vi.fn();

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        onUnmount={onUnmount}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    // Unmount the component
    unmount();

    // Wait for cleanup
    await waitFor(() => {
      expect(onUnmount).toHaveBeenCalledTimes(1);
    });

    expect(onUnmount).toHaveBeenCalledWith(
      expect.objectContaining({
        counter: expect.any(Object),
      })
    );
  });

  test("works with system manager (idempotent)", async () => {
    const manager = createSystemManager(testConfig);

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    // First render
    const { unmount } = render(
      <LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    const firstSystem = manager.getCurrentSystem();
    expect(firstSystem).toBeDefined();

    // Unmount
    unmount();

    // System should still be alive
    expect(manager.isStarted()).toBe(true);

    // Second render - should reuse same system
    render(
      <LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    const secondSystem = manager.getCurrentSystem();
    expect(secondSystem).toBe(firstSystem); // Same instance!

    // Cleanup
    await manager.destroySystem();
  });

  test("manager pattern survives multiple mount/unmount cycles", async () => {
    const startSpy = vi.fn(async () => ({ count: 0 }));

    const spiedResource = defineResource({
      start: startSpy,
      halt: () => {},
    });

    const spiedConfig = {
      spied: spiedResource,
    };

    const manager = createSystemManager(spiedConfig);

    const { SystemBridge: SpiedBridge, useResource: useSpiedResource } =
      createSystemHooks<typeof spiedConfig>();

    function TestComponent() {
      const spied = useSpiedResource("spied");
      return <div data-testid="count">{spied.count}</div>;
    }

    // Mount 1
    const { unmount: unmount1 } = render(
      <LazySystemBridge manager={manager} SystemBridge={SpiedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    unmount1();

    // Mount 2
    const { unmount: unmount2 } = render(
      <LazySystemBridge manager={manager} SystemBridge={SpiedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    unmount2();

    // Mount 3
    render(
      <LazySystemBridge manager={manager} SystemBridge={SpiedBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    // Start should only be called once despite 3 mount cycles
    expect(startSpy).toHaveBeenCalledTimes(1);

    // Cleanup
    await manager.destroySystem();
  });

  test("onUnmount can halt the system", async () => {
    const haltSpy = vi.fn();

    const trackedResource = defineResource({
      start: () => ({ value: "test" }),
      halt: haltSpy,
    });

    const trackedConfig = {
      tracked: trackedResource,
    };

    const { SystemBridge: TrackedBridge, useResource: useTrackedResource } =
      createSystemHooks<typeof trackedConfig>();

    function TestComponent() {
      const tracked = useTrackedResource("tracked");
      return <div data-testid="value">{tracked.value}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={trackedConfig}
        SystemBridge={TrackedBridge}
        onUnmount={(system) => haltSystem(trackedConfig, system)}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("value")).toBeDefined();
    });

    // Unmount the component
    unmount();

    // Wait for cleanup
    await waitFor(() => {
      expect(haltSpy).toHaveBeenCalledTimes(1);
    });
  });

  test("handles async onUnmount callback", async () => {
    const onUnmount = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        onUnmount={onUnmount}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    unmount();

    await waitFor(() => {
      expect(onUnmount).toHaveBeenCalledTimes(1);
    });
  });

  test("logs error when onUnmount callback throws", async () => {
    const originalError = console.error;
    console.error = vi.fn();

    const testError = new Error("Cleanup failed!");
    const onUnmount = vi.fn(() => {
      throw testError;
    });

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        onUnmount={onUnmount}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    // Unmount should trigger onUnmount
    unmount();

    // Wait for cleanup and error handling
    await waitFor(() => {
      expect(onUnmount).toHaveBeenCalledTimes(1);
    });

    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    const errorCalls = (console.error as any).mock.calls;
    const hasUnmountError = errorCalls.some((call: any) => {
      return (
        call[0]?.includes("LazySystemBridge onUnmount error") &&
        call[1] === testError
      );
    });
    expect(hasUnmountError).toBe(true);

    console.error = originalError;
  });

  test("logs error when async onUnmount callback rejects", async () => {
    const originalError = console.error;
    console.error = vi.fn();

    const testError = new Error("Async cleanup failed!");
    const onUnmount = vi.fn(async () => {
      throw testError;
    });

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={testConfig}
        SystemBridge={SystemBridge}
        onUnmount={onUnmount}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    // Unmount should trigger onUnmount
    unmount();

    // Wait for cleanup and error handling
    await waitFor(() => {
      expect(onUnmount).toHaveBeenCalledTimes(1);
    });

    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    const errorCalls = (console.error as any).mock.calls;
    const hasUnmountError = errorCalls.some((call: any) => {
      return (
        call[0]?.includes("LazySystemBridge onUnmount error") &&
        call[1] === testError
      );
    });
    expect(hasUnmountError).toBe(true);

    console.error = originalError;
  });

  test("throws error if neither config nor manager provided", async () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    function TestComponent() {
      return <div>Should not render</div>;
    }

    render(
      <LazySystemBridge SystemBridge={SystemBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    // Wait for error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // Check that console.error was called with startup failed message
    const errorCalls = (console.error as any).mock.calls;
    const hasStartupError = errorCalls.some((call: any) => {
      const message = call[0];
      return (
        typeof message === "string" &&
        message.includes("LazySystemBridge startup failed")
      );
    });
    expect(hasStartupError).toBe(true);

    console.error = originalError;
  });

  test("handles manager with null startup errors", async () => {
    // Create a mock manager that returns null for getStartupErrors
    const mockSystem = {
      counter: {
        count: 42,
        increment: () => {},
        getCount: () => 42,
      },
    };

    const mockManager = {
      getSystem: vi.fn(async () => mockSystem),
      getCurrentSystem: vi.fn(() => mockSystem),
      getStartupErrors: vi.fn(() => null), // This forces line 99 to use || new Map()
    };

    function TestComponent() {
      const counter = useResource("counter");
      return <div data-testid="count">{counter.count}</div>;
    }

    render(
      <LazySystemBridge manager={mockManager} SystemBridge={SystemBridge}>
        <TestComponent />
      </LazySystemBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toBeDefined();
    });

    expect(screen.getByTestId("count").textContent).toBe("42");
    expect(mockManager.getStartupErrors).toHaveBeenCalled();
  });

  test("handles unmount during startup error (early return in catch)", async () => {
    const originalError = console.error;
    const consoleErrorSpy = vi.fn();
    console.error = consoleErrorSpy;

    let rejectFn: ((error: Error) => void) | null = null;

    // Create a resource that we can manually fail
    const manualFailResource = defineResource({
      start: async () => {
        return new Promise((_, reject) => {
          rejectFn = reject;
        });
      },
      halt: () => {},
    });

    const manualFailConfig = {
      manual: manualFailResource,
    };

    const { SystemBridge: ManualBridge, useResource: useManualResource } =
      createSystemHooks<typeof manualFailConfig>();

    function TestComponent() {
      const manual = useManualResource("manual");
      return <div data-testid="manual">{manual ? "loaded" : "loading"}</div>;
    }

    const { unmount } = render(
      <LazySystemBridge
        config={manualFailConfig}
        SystemBridge={ManualBridge}
        fallback={<div data-testid="loading">Loading...</div>}
      >
        <TestComponent />
      </LazySystemBridge>
    );

    // Wait a bit for the promise to be set up
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Unmount BEFORE triggering the error
    unmount();

    // Now trigger the error after unmount
    if (rejectFn) {
      rejectFn(new Error("Manual failure after unmount"));
    }

    // Wait for the catch to process
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Error should NOT be logged because component unmounted before catch
    const hasStartupError = consoleErrorSpy.mock.calls.some((call: any) => {
      const message = call[0];
      return (
        typeof message === "string" &&
        message.includes("LazySystemBridge startup failed")
      );
    });

    // Should be false because mounted = false when catch runs (line 121)
    expect(hasStartupError).toBe(false);

    console.error = originalError;
  });
});
