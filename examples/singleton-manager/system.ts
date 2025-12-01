/**
 * System Configuration - Event Bus Communication
 *
 * This example shows how resources communicate through an event bus,
 * demonstrating loose coupling and coordination outside of React.
 */

import { defineResource, StartedResource } from "braided";

/**
 * Event Bus Resource
 *
 * Central event emitter that allows resources to communicate.
 * Resources can emit events and subscribe to events from other resources.
 */
export const eventBusResource = defineResource({
  start: () => {
    console.log("📡 Event bus starting...");

    type EventHandler = (...args: any[]) => void;
    const listeners = new Map<string, Set<EventHandler>>();

    return {
      emit(event: string, ...args: any[]) {
        console.log(`📡 Event emitted: ${event}`, args);
        const handlers = listeners.get(event);
        if (handlers) {
          handlers.forEach((handler) => handler(...args));
        }
      },
      on(event: string, handler: EventHandler) {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)!.add(handler);
        console.log(`📡 Listener added for: ${event}`);
        return () => {
          listeners.get(event)?.delete(handler);
          console.log(`📡 Listener removed for: ${event}`);
        };
      },
      getListenerCount(event: string) {
        return listeners.get(event)?.size || 0;
      },
      cleanup() {
        listeners.clear();
      },
    };
  },
  halt: (bus) => {
    console.log("📡 Event bus halting");
    bus.cleanup();
  },
});

/**
 * Timer Resource
 *
 * Emits tick events every second.
 * Demonstrates a resource that produces events.
 */
export const timerResource = defineResource({
  dependencies: ["eventBus"],
  start: ({
    eventBus,
  }: {
    eventBus: StartedResource<typeof eventBusResource>;
  }) => {
    console.log("⏰ Timer starting...");

    let ticks = 0;
    let running = false;
    let intervalId: number | null = null;

    return {
      start() {
        if (running) return;
        running = true;
        intervalId = window.setInterval(() => {
          ticks++;
          eventBus.emit("timer:tick", ticks);
        }, 1000);
        eventBus.emit("timer:started");
        console.log("⏰ Timer started");
      },
      stop() {
        if (!running) return;
        running = false;
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
          eventBus.emit("timer:stopped");
        }
        console.log("⏰ Timer stopped");
      },
      reset() {
        ticks = 0;
        eventBus.emit("timer:reset");
        console.log("⏰ Timer reset");
      },
      getTicks: () => ticks,
      isRunning: () => running,
    };
  },
  halt: (timer) => {
    timer.stop();
    console.log("⏰ Timer halting");
  },
});

/**
 * Counter Resource
 *
 * Listens to timer ticks and increments a counter.
 * Demonstrates a resource that consumes events.
 */
export const counterResource = defineResource({
  dependencies: ["eventBus"],
  start: ({
    eventBus,
  }: {
    eventBus: StartedResource<typeof eventBusResource>;
  }) => {
    console.log("🔢 Counter starting...");

    let count = 0;
    const listeners = new Set<() => void>();

    const notify = () => {
      listeners.forEach((listener) => listener());
    };

    // Listen to timer ticks
    const unsubTick = eventBus.on("timer:tick", (ticks: number) => {
      count++;
      notify();
      console.log(`🔢 Counter incremented on tick ${ticks}: ${count}`);
    });

    // Listen to timer reset
    const unsubReset = eventBus.on("timer:reset", () => {
      count = 0;
      notify();
      console.log("🔢 Counter reset");
    });

    return {
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => count,
      getCount: () => count,
      increment() {
        count++;
        notify();
        eventBus.emit("counter:changed", count);
      },
      reset() {
        count = 0;
        notify();
        eventBus.emit("counter:changed", count);
      },
      cleanup: () => {
        unsubTick();
        unsubReset();
      },
    };
  },
  halt: (counter) => {
    counter.cleanup();
    console.log(`🔢 Counter halting (final count: ${counter.getCount()})`);
  },
});

/**
 * Logger Resource
 *
 * Listens to all events and logs them.
 * Demonstrates a resource that observes the entire system.
 */
export const loggerResource = defineResource({
  dependencies: ["eventBus"],
  start: ({
    eventBus,
  }: {
    eventBus: StartedResource<typeof eventBusResource>;
  }) => {
    console.log("📝 Logger starting...");

    let logs: string[] = [];
    const listeners = new Set<() => void>();

    const notify = () => {
      listeners.forEach((listener) => listener());
    };

    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const entry = `[${timestamp}] ${message}`;
      logs = [...logs, entry];
      notify();
    };

    // Listen to all events
    const unsubTick = eventBus.on("timer:tick", (ticks: number) => {
      addLog(`Timer tick: ${ticks}`);
    });

    const unsubReset = eventBus.on("timer:reset", () => {
      addLog("Timer reset");
    });

    const unsubCounter = eventBus.on("counter:changed", (count: number) => {
      addLog(`Counter changed: ${count}`);
    });

    const unsubStopped = eventBus.on("timer:stopped", () => {
      addLog("Timer stopped");
    });

    const unsubStarted = eventBus.on("timer:started", () => {
      addLog("Timer started");
    });

    return {
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => logs,
      getLogs: () => [...logs],
      clear() {
        logs = [];
        notify();
        console.log("📝 Logs cleared");
      },
      cleanup: () => {
        unsubTick();
        unsubReset();
        unsubCounter();
        unsubStopped();
        unsubStarted();
      },
    };
  },
  halt: (logger) => {
    logger.cleanup();
    console.log(`📝 Logger halting (${logger.getLogs().length} logs recorded)`);
  },
});

/**
 * System Configuration
 *
 * All resources communicate through the event bus.
 * No resource directly depends on another (except eventBus).
 */
export const systemConfig = {
  eventBus: eventBusResource,
  timer: timerResource,
  counter: counterResource,
  logger: loggerResource,
};
