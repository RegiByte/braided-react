/**
 * System Configuration - Outliving React
 *
 * This example demonstrates resources that persist across React mount/unmount cycles.
 * The system continues running even when React is completely destroyed and recreated.
 */

import { defineResource } from "braided";
import { createSystemHooks, createSystemManager } from "braided-react";

/**
 * Session Resource
 *
 * Tracks session information that persists across React lifecycles.
 */
export const sessionResource = defineResource({
  start: () => {
    console.log("🔐 Session starting...");

    const sessionId = `session-${Date.now()}`;
    const startTime = Date.now();
    let reactMountCount = 0;
    let reactUnmountCount = 0;

    return {
      getSessionId: () => sessionId,
      getUptime: () => Math.floor((Date.now() - startTime) / 1000),
      getStartTime: () => startTime,
      onReactMount: () => {
        reactMountCount++;
        console.log(`🔐 React mounted (count: ${reactMountCount})`);
      },
      onReactUnmount: () => {
        reactUnmountCount++;
        console.log(`🔐 React unmounted (count: ${reactUnmountCount})`);
      },
      getStats: () => ({
        sessionId,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        reactMountCount,
        reactUnmountCount,
      }),
    };
  },
  halt: (session) => {
    console.log(`🔐 Session halting (${session.getSessionId()})`);
  },
});

/**
 * Data Store Resource
 *
 * Maintains data that survives React remounts.
 * Demonstrates state persistence outside of React.
 */
export const dataStoreResource = defineResource({
  start: () => {
    console.log("💾 Data store starting...");

    let data: Record<string, any> = {};
    const history: Array<{ action: string; key?: string; timestamp: number }> =
      [];
    const listeners = new Set<() => void>();
    const notify = () => {
      listeners.forEach((listener) => listener());
    };

    const logAction = (action: string, key?: string) => {
      history.push({ action, key, timestamp: Date.now() });
      console.log(`💾 ${action}${key ? `: ${key}` : ""}`);
    };

    return {
      set(key: string, value: any) {
        data = { ...data, [key]: value };
        logAction("SET", key);
        notify();
      },
      get(key: string) {
        return data[key];
      },
      has(key: string) {
        return key in data;
      },
      delete(key: string) {
        data = { ...data, [key]: undefined };
        logAction("DELETE", key);
        notify();
      },
      clear() {
        data = {};
        logAction("CLEAR");
        notify();
      },
      getAll() {
        return { ...data };
      },
      getHistory() {
        return [...history];
      },
      getStats() {
        return {
          itemCount: Object.keys(data).length,
          historyLength: history.length,
        };
      },
      // notifies react about changes
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot() {
        return data as Readonly<typeof data>;
      },
    };
  },
  halt: (store) => {
    const stats = store.getStats();
    console.log(
      `💾 Data store halting (${stats.itemCount} items, ${stats.historyLength} operations)`
    );
  },
});

/**
 * Background Task Resource
 *
 * Runs a background task that continues even when React is unmounted.
 */
export const backgroundTaskResource = defineResource({
  dependencies: ["dataStore"],
  start: ({ dataStore }) => {
    console.log("⚙️  Background task starting...");

    let running = false;
    let intervalId: number | null = null;
    let tickCount = 0;

    return {
      start() {
        if (running) return;
        running = true;
        intervalId = window.setInterval(() => {
          tickCount++;
          dataStore.set("lastTick", Date.now());
          dataStore.set("tickCount", tickCount);
          console.log(`⚙️  Background tick: ${tickCount}`);
        }, 2000);
        console.log("⚙️  Background task started");
      },
      stop() {
        if (!running) return;
        running = false;
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
        console.log("⚙️  Background task stopped");
      },
      isRunning: () => running,
      getTickCount: () => tickCount,
    };
  },
  halt: (task) => {
    task.stop();
    console.log("⚙️  Background task halting");
  },
});

/**
 * System Configuration
 */
export const systemConfig = {
  session: sessionResource,
  dataStore: dataStoreResource,
  backgroundTask: backgroundTaskResource,
};

/**
 * Create manager and hooks for our system configuration.
 *
 * These hooks provide full TypeScript inference:
 * - useResource('counter') returns the exact counter type
 * - useResource('logger') returns the exact logger type
 * - useSystem() returns the complete system type
 */
export const manager = createSystemManager(systemConfig);
export const { useSystem, useResource, SystemProvider } =
  createSystemHooks(manager);
