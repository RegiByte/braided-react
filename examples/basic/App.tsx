/**
 * React Application
 *
 * Components that use the system via hooks. Notice how we don't manage
 * any lifecycle here - we just use the resources.
 */

import { useState, useEffect } from "react";
import { useResource } from "./hooks";

/**
 * Counter Display Component
 *
 * Demonstrates accessing a single resource with useResource.
 */
function CounterDisplay() {
  const counter = useResource("counter");
  const [, forceUpdate] = useState({});

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
      }}
    >
      <h2>🔢 Counter</h2>
      <p style={{ fontSize: "48px", margin: "20px 0" }}>{counter.count}</p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => {
            counter.increment();
            forceUpdate({});
          }}
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
          onClick={() => {
            counter.reset();
            forceUpdate({});
          }}
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
 */
function LoggerDisplay() {
  const logger = useResource("logger");
  const counter = useResource("counter");
  const [, forceUpdate] = useState({});

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
          onClick={() => {
            logger.log("Hello from React!");
            forceUpdate({});
          }}
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
          onClick={() => {
            logger.logCount();
            forceUpdate({});
          }}
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
          onClick={() => {
            logger.clear();
            forceUpdate({});
          }}
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
        {logger.logs.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No logs yet...</div>
        ) : (
          logger.logs.map((log, i) => <div key={i}>{log}</div>)
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
      <h1 style={{ marginBottom: "10px" }}>🧶 Braided React - Basic Example</h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>
        System started before React. Components observe, don't control.
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
        <h3 style={{ marginTop: 0 }}>💡 Try This:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Open DevTools console to see system lifecycle logs</li>
          <li>Increment the counter and log its value</li>
          <li>Notice how resources maintain state across re-renders</li>
          <li>
            Try opening React DevTools - you'll see the system is just context,
            not state
          </li>
        </ol>
      </div>
    </div>
  );
}
