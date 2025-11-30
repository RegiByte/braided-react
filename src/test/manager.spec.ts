/**
 * Tests for createSystemManager
 */

import { describe, expect, test, vi } from "vitest";
import { defineResource } from "braided";
import { createSystemManager } from "../manager";

describe("createSystemManager", () => {
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
    halt: function (instance) {
      instance.count = 0;
    },
  });

  const testConfig = {
    counter: counterResource,
  };

  test("creates manager with expected methods", () => {
    const manager = createSystemManager(testConfig);

    expect(manager.getSystem).toBeDefined();
    expect(manager.destroySystem).toBeDefined();
    expect(manager.getCurrentSystem).toBeDefined();
    expect(manager.getStartupErrors).toBeDefined();
    expect(manager.isStarted).toBeDefined();
  });

  test("getSystem starts the system on first call", async () => {
    const manager = createSystemManager(testConfig);

    expect(manager.isStarted()).toBe(false);
    expect(manager.getCurrentSystem()).toBe(null);

    const system = await manager.getSystem();

    expect(system.counter).toBeDefined();
    expect(system.counter.count).toBe(0);
    expect(manager.isStarted()).toBe(true);
    expect(manager.getCurrentSystem()).toBe(system);
  });

  test("getSystem returns same instance on multiple calls", async () => {
    const manager = createSystemManager(testConfig);

    const system1 = await manager.getSystem();
    const system2 = await manager.getSystem();

    expect(system1).toBe(system2);
    expect(system1.counter).toBe(system2.counter);
  });

  test("getSystem is idempotent even with concurrent calls", async () => {
    const manager = createSystemManager(testConfig);

    // Call getSystem multiple times concurrently
    const [system1, system2, system3] = await Promise.all([
      manager.getSystem(),
      manager.getSystem(),
      manager.getSystem(),
    ]);

    expect(system1).toBe(system2);
    expect(system2).toBe(system3);
  });

  test("destroySystem halts the system and resets manager", async () => {
    const manager = createSystemManager(testConfig);

    const system = await manager.getSystem();
    system.counter.increment();
    expect(system.counter.count).toBe(1);

    await manager.destroySystem();

    expect(manager.isStarted()).toBe(false);
    expect(manager.getCurrentSystem()).toBe(null);

    // After destroy, getSystem should start a fresh system
    const newSystem = await manager.getSystem();
    expect(newSystem.counter.count).toBe(0);
    expect(newSystem).not.toBe(system);
  });

  test("destroySystem is safe to call when system is not started", async () => {
    const manager = createSystemManager(testConfig);

    expect(manager.isStarted()).toBe(false);

    await expect(manager.destroySystem()).resolves.toBeUndefined();

    expect(manager.isStarted()).toBe(false);
  });

  test("getStartupErrors returns errors from failed resources", async () => {
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

    const manager = createSystemManager(configWithError);

    expect(manager.getStartupErrors()).toBe(null);

    await manager.getSystem();

    const errors = manager.getStartupErrors();
    expect(errors).not.toBe(null);
    expect(errors!.size).toBe(1);
    expect(errors!.has("failing")).toBe(true);
    expect(errors!.get("failing")?.message).toBe("Intentional failure");
  });

  test("system continues with graceful degradation on errors", async () => {
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

    const manager = createSystemManager(configWithError);

    const system = await manager.getSystem();

    // Counter should work fine
    expect(system.counter).toBeDefined();
    expect(system.counter.count).toBe(0);

    // Failing resource should be undefined
    expect(system.failing).toBeUndefined();
  });

  test("logs errors to console on startup", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const failingResource = defineResource({
      start: (): any => {
        throw new Error("Intentional failure");
      },
      halt: () => {},
    });

    const configWithError = {
      failing: failingResource,
    };

    const manager = createSystemManager(configWithError);
    await manager.getSystem();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("System startup completed with 1 error(s)"),
      expect.any(Map)
    );

    consoleErrorSpy.mockRestore();
  });

  test("logs errors to console on shutdown", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const errorOnHaltResource = defineResource({
      start: () => ({ value: "test" }),
      halt: () => {
        throw new Error("Halt failed");
      },
    });

    const configWithHaltError = {
      errorOnHalt: errorOnHaltResource,
    };

    const manager = createSystemManager(configWithHaltError);
    await manager.getSystem();
    await manager.destroySystem();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("System shutdown completed with 1 error(s)"),
      expect.any(Map)
    );

    consoleErrorSpy.mockRestore();
  });

  test("multiple managers can coexist independently", async () => {
    const manager1 = createSystemManager(testConfig);
    const manager2 = createSystemManager(testConfig);

    const system1 = await manager1.getSystem();
    const system2 = await manager2.getSystem();

    // They should be different instances
    expect(system1).not.toBe(system2);
    expect(system1.counter).not.toBe(system2.counter);

    system1.counter.increment();
    expect(system1.counter.count).toBe(1);
    expect(system2.counter.count).toBe(0);
  });
});
