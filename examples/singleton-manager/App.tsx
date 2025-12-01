/**
 * React Application - Event Bus Communication
 *
 * Resources communicate through an event bus, demonstrating
 * loose coupling and coordination outside of React.
 */

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useResource } from "./hooks";

/**
 * Timer Controls Component
 *
 * Controls the timer resource that emits tick events.
 */
function TimerControls() {
  const timer = useResource("timer");
  const eventBus = useResource("eventBus");
  const [_, forceRender] = useState({});

  useEffect(() => {
    if (!eventBus) return;
    const unsubscribeTick = eventBus.on("timer:tick", (ticks: number) => {
      forceRender({});
    });
    const unsubscribeStopped = eventBus.on("timer:stopped", () => {
      forceRender({});
    });
    return () => {
      unsubscribeTick();
      unsubscribeStopped();
    };
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
      }}
    >
      <h2>⏰ Timer</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        Emits "timer:tick" events every second
      </p>
      <div style={{ marginBottom: "10px" }}>
        <p>
          <strong>Ticks:</strong> {timer.getTicks()}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {timer.isRunning() ? "🟢 Running" : "🔴 Stopped"}
        </p>
        <p>
          <strong>Listeners:</strong> {eventBus.getListenerCount("timer:tick")}
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => timer.start()}
          disabled={timer.isRunning()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: timer.isRunning() ? "not-allowed" : "pointer",
            opacity: timer.isRunning() ? 0.5 : 1,
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Start
        </button>
        <button
          onClick={() => timer.stop()}
          disabled={!timer.isRunning()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: !timer.isRunning() ? "not-allowed" : "pointer",
            opacity: !timer.isRunning() ? 0.5 : 1,
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Stop
        </button>
        <button
          onClick={() => timer.reset()}
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
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Counter Display Component
 *
 * Listens to timer ticks and increments automatically.
 */
function CounterDisplay() {
  const counter = useResource("counter");
  const eventBus = useResource("eventBus");

  // Subscribe to counter changes
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot);

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #10b981",
        borderRadius: "8px",
      }}
    >
      <h2>🔢 Counter</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        Listens to "timer:tick" events and increments
      </p>
      <p style={{ fontSize: "48px", margin: "20px 0" }}>{count}</p>
      <div style={{ marginBottom: "10px" }}>
        <p>
          <strong>Event Listeners:</strong>{" "}
          {eventBus.getListenerCount("counter:changed")}
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => counter.increment()}
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
          Manual +1
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
 * Listens to all events and displays them.
 */
function LoggerDisplay() {
  const logger = useResource("logger");

  // Subscribe to logger changes
  const logs = useSyncExternalStore(logger.subscribe, logger.getSnapshot);

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #8b5cf6",
        borderRadius: "8px",
      }}
    >
      <h2>📝 Event Logger</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        Listens to all events in the system
      </p>
      <div style={{ marginBottom: "10px" }}>
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
          Clear Logs
        </button>
      </div>
      <div
        style={{
          backgroundColor: "#1f2937",
          color: "#8b5cf6",
          padding: "15px",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "14px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No events yet...</div>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  );
}

/**
 * Event Bus Info Component
 *
 * Shows information about the event bus.
 */
function EventBusInfo() {
  const eventBus = useResource("eventBus");

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f3f4f6",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>📡 Event Bus Status</h3>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <strong>timer:tick listeners:</strong>{" "}
          {eventBus.getListenerCount("timer:tick")}
        </div>
        <div>
          <strong>timer:reset listeners:</strong>{" "}
          {eventBus.getListenerCount("timer:reset")}
        </div>
        <div>
          <strong>counter:changed listeners:</strong>{" "}
          {eventBus.getListenerCount("counter:changed")}
        </div>
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
export function App() {
  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "10px" }}>
        🧶 Braided React - Event Bus Communication
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>
        Resources communicate through an event bus, demonstrating loose coupling
        and coordination outside of React. No resource directly depends on
        another.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <TimerControls />
        <CounterDisplay />
        <LoggerDisplay />
        <EventBusInfo />
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
            <strong>Event Bus:</strong> Central hub for resource communication
          </li>
          <li>
            <strong>Loose Coupling:</strong> Resources don't directly depend on
            each other
          </li>
          <li>
            <strong>Pub/Sub Pattern:</strong> Resources emit events, others
            subscribe
          </li>
          <li>
            <strong>Coordination:</strong> Complex interactions without tight
            coupling
          </li>
          <li>
            <strong>Observable System:</strong> Logger can observe all events
            without being invasive
          </li>
          <li>Open DevTools console to see detailed event logs</li>
        </ol>
      </div>
    </div>
  );
}
