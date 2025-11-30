/**
 * Tests for createSystemHooks
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { defineResource, startSystem } from "braided";
import type { StartedResource } from "braided";
import { createSystemHooks } from "../hooks";

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

  test("creates SystemBridge, useSystem, and useResource", () => {
    const hooks = createSystemHooks<typeof testSystemConfig>();

    expect(hooks.SystemBridge).toBeDefined();
    expect(hooks.useSystem).toBeDefined();
    expect(hooks.useResource).toBeDefined();
  });

  test("SystemBridge provides system to children", async () => {
    const { SystemBridge, useSystem } =
      createSystemHooks<typeof testSystemConfig>();

    const { system } = await startSystem(testSystemConfig);

    function TestComponent() {
      const sys = useSystem();
      return <div data-testid="count">{sys.counter.count}</div>;
    }

    render(
      <SystemBridge system={system}>
        <TestComponent />
      </SystemBridge>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  test("useResource provides typed access to individual resources", async () => {
    const { SystemBridge, useResource } =
      createSystemHooks<typeof testSystemConfig>();

    const { system } = await startSystem(testSystemConfig);

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

    render(
      <SystemBridge system={system}>
        <TestComponent />
      </SystemBridge>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("logs").textContent).toBe("0");
  });

  test("useSystem throws error when SystemBridge is missing", () => {
    const { useSystem } = createSystemHooks<typeof testSystemConfig>();

    function TestComponent() {
      useSystem();
      return <div>Should not render</div>;
    }

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useSystem: SystemBridge is missing");

    console.error = originalError;
  });

  test("useResource throws error when SystemBridge is missing", () => {
    const { useResource } = createSystemHooks<typeof testSystemConfig>();

    function TestComponent() {
      useResource("counter");
      return <div>Should not render</div>;
    }

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useSystem: SystemBridge is missing");

    console.error = originalError;
  });

  test("resources maintain state across re-renders", async () => {
    const { SystemBridge, useResource } =
      createSystemHooks<typeof testSystemConfig>();

    const { system } = await startSystem(testSystemConfig);

    function TestComponent() {
      const counter = useResource("counter");

      return (
        <div>
          <div data-testid="count">{counter.count}</div>
          <button data-testid="increment" onClick={() => counter.increment()}>
            Increment
          </button>
        </div>
      );
    }

    const { rerender } = render(
      <SystemBridge system={system}>
        <TestComponent />
      </SystemBridge>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    // Mutate the counter
    system.counter.increment();

    // Force re-render
    rerender(
      <SystemBridge system={system}>
        <TestComponent />
      </SystemBridge>
    );

    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  test("multiple components can access the same system", async () => {
    const { SystemBridge, useResource } =
      createSystemHooks<typeof testSystemConfig>();

    const { system } = await startSystem(testSystemConfig);

    function ComponentA() {
      const counter = useResource("counter");
      return <div data-testid="count-a">{counter.count}</div>;
    }

    function ComponentB() {
      const counter = useResource("counter");
      return <div data-testid="count-b">{counter.count}</div>;
    }

    render(
      <SystemBridge system={system}>
        <ComponentA />
        <ComponentB />
      </SystemBridge>
    );

    expect(screen.getByTestId("count-a").textContent).toBe("0");
    expect(screen.getByTestId("count-b").textContent).toBe("0");

    // They should reference the same instance
    system.counter.increment();

    expect(system.counter.count).toBe(1);
  });

  test("works with failed resources (graceful degradation)", async () => {
    const failingResource = defineResource({
      start: (): any => {
        throw new Error("Intentional failure");
      },
      halt: () => {},
    });

    const resilientResource = defineResource<{ failing: any }>({
      dependencies: ["failing"],
      start: ({ failing }) => ({
        mode: failing ? "normal" : "degraded",
      }),
      halt: () => {},
    });

    const testConfig = {
      failing: failingResource,
      resilient: resilientResource,
    };

    const { SystemBridge, useResource } =
      createSystemHooks<typeof testConfig>();

    const { system, errors } = await startSystem(testConfig);

    expect(errors.size).toBe(1);
    expect(system.failing).toBeUndefined();
    expect(system.resilient.mode).toBe("degraded");

    function TestComponent() {
      const resilient = useResource("resilient");
      return <div data-testid="mode">{resilient.mode}</div>;
    }

    render(
      <SystemBridge system={system}>
        <TestComponent />
      </SystemBridge>
    );

    expect(screen.getByTestId("mode").textContent).toBe("degraded");
  });
});
