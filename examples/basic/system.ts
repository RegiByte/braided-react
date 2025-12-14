/**
 * System Configuration
 *
 * Define your stateful resources here. This example shows a simple
 * counter and logger with a dependency relationship.
 */

import { defineResource, StartedResource } from "braided";

/**
 * Counter Resource - No dependencies
 *
 * A simple stateful counter that can be incremented.
 * Uses useSyncExternalStore pattern with subscribe/getSnapshot.
 */
export const counterResource = defineResource({
  start: () => {
    console.log("🔢 Counter starting...");
    let count = 0;

    const listeners = new Set<() => void>();

    const notify = () => {
      listeners.forEach((listener) => listener());
    };

    return {
      // For useSyncExternalStore
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot() {
        return count;
      },
      // Public API
      increment() {
        count++;
        console.log(`Counter incremented to ${count}`);
        notify();
      },
      reset() {
        count = 0;
        console.log("Counter reset to 0");
        notify();
      },
    };
  },
  halt: (counter) => {
    console.log(`🔢 Counter halting (final count: ${counter.getSnapshot()})`);
  },
});

/**
 * Logger Resource - Depends on counter
 *
 * Logs messages and can access the counter to log its current value.
 * Also uses subscribe/getSnapshot pattern for reactive logs.
 */
export const loggerResource = defineResource({
  dependencies: ["counter"],
  start: ({
    counter,
  }: {
    counter: StartedResource<typeof counterResource>;
  }) => {
    console.log("📝 Logger starting...");
    let logs: string[] = [];
    const listeners = new Set<() => void>();

    const notify = () => {
      listeners.forEach((listener) => listener());
    };

    const logger = {
      // For useSyncExternalStore
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot() {
        // note, this is the same reference, if it were to change, react would enter an infinite loop
        return logs;
      },
      // Public API
      log(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${message}`;
        logs = [...logs, entry];
        console.log(`📝 ${entry}`);
        notify();
      },
      logCount() {
        const message = `Counter is at ${counter.getSnapshot()}`;
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${message}`;
        logs = [...logs, entry];
        console.log(`📝 ${entry}`);
        notify();
      },
      clear() {
        logs = [];
        console.log("📝 Logs cleared");
        notify();
      },
    };
    return logger;
  },
  halt: (logger) => {
    console.log(
      `📝 Logger halting (${logger.getSnapshot().length} logs recorded)`
    );
  },
});

/**
 * System Configuration
 *
 * Compose your resources into a system. The library will start them
 * in dependency order (counter first, then logger).
 */
export const systemConfig = {
  counter: counterResource,
  logger: loggerResource,
};
