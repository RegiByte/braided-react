/**
 * React Application
 *
 * Components that use the system via hooks with useSyncExternalStore.
 * Notice how we don't manage any lifecycle here - we just use the resources.
 *
 * This example demonstrates React 18's useSyncExternalStore API for
 * subscribing to external state sources (our Braided resources).
 */

import React, { useSyncExternalStore } from "react";
import { useResource } from "./system";

/**
 * Counter Display Component
 *
 * Demonstrates useSyncExternalStore with a Braided resource.
 * The counter resource provides subscribe() and getSnapshot() methods.
 * React automatically re-renders when the counter changes.
 */
function CounterDisplay() {
  const counter = useResource("counter");

  // Subscribe to counter changes using React 18's useSyncExternalStore
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot);

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
      }}
    >
      <h2>🔢 Counter</h2>
      <p style={{ fontSize: "48px", margin: "20px 0" }}>{count}</p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => counter.increment()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Increment
        </button>
        <button
          onClick={() => counter.reset()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Logger Display Component
 *
 * Demonstrates accessing multiple resources and their interactions.
 * Both logger and counter use useSyncExternalStore for reactivity.
 */
function LoggerDisplay() {
  const logger = useResource("logger");

  // Subscribe to logger changes
  const logs = useSyncExternalStore(logger.subscribe, logger.getSnapshot);

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #10b981",
        borderRadius: "8px",
      }}
    >
      <h2>📝 Logger</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => logger.log("Hello from React!")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Log Message
        </button>
        <button
          onClick={() => logger.logCount()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Log Count
        </button>
        <button
          onClick={() => logger.clear()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          backgroundColor: "#1f2937",
          color: "#10b981",
          padding: "15px",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "14px",
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No logs yet...</div>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
export function App() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "10px" }}>
        🧶 Braided React - useSyncExternalStore
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>
        Using React 18's useSyncExternalStore to subscribe to Braided resources.
        No useState, no forceUpdate - just pure reactive subscriptions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <CounterDisplay />
        <LoggerDisplay />
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#fef3c7",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>💡 Key Concepts:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>
            <strong>useSyncExternalStore:</strong> React 18 API for subscribing
            to external state
          </li>
          <li>
            <strong>subscribe():</strong> Resources provide a subscribe method
            that React calls
          </li>
          <li>
            <strong>getSnapshot():</strong> Returns current state, called on
            every render
          </li>
          <li>
            <strong>Automatic re-renders:</strong> No useState or manual render
            needed!
          </li>
          <li>Open DevTools console to see system lifecycle logs</li>
        </ol>
      </div>
    </div>
  );
}
