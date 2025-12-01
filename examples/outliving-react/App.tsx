/**
 * React Application - Outliving React
 *
 * This component demonstrates that the system persists even when
 * React is completely unmounted and remounted.
 */

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useResource } from "./hooks";

/**
 * Session Info Component
 *
 * Shows session information that persists across React lifecycles.
 */
function SessionInfo() {
  const session = useResource("session");
  const [uptime, setUptime] = useState(session.getUptime());

  useEffect(() => {
    // Notify session of React mount
    session.onReactMount();

    // Update uptime every second
    const interval = setInterval(() => {
      setUptime(session.getUptime());
    }, 1000);

    return () => {
      // Notify session of React unmount
      session.onReactUnmount();
      clearInterval(interval);
    };
  }, [session]);

  const stats = session.getStats();

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
      }}
    >
      <h2>🔐 Session Info</h2>
      <div style={{ fontFamily: "monospace", fontSize: "14px" }}>
        <p>
          <strong>Session ID:</strong> {stats.sessionId}
        </p>
        <p>
          <strong>System Uptime:</strong> {uptime}s
        </p>
        <p>
          <strong>React Mount Count:</strong> {stats.reactMountCount}
        </p>
        <p>
          <strong>React Unmount Count:</strong> {stats.reactUnmountCount}
        </p>
      </div>
      <p style={{ color: "#6b7280", marginTop: "10px", fontSize: "14px" }}>
        ℹ️ These counters prove the system persists across React remounts
      </p>
    </div>
  );
}

/**
 * Data Store Component
 *
 * Allows storing and retrieving data that survives React remounts.
 */
function DataStoreDemo() {
  const dataStore = useResource("dataStore");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [, forceUpdate] = useState({});

  const allData = useSyncExternalStore(
    dataStore.subscribe,
    dataStore.getSnapshot
  );
  const stats = dataStore.getStats();

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #10b981",
        borderRadius: "8px",
      }}
    >
      <h2>💾 Persistent Data Store</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        Data stored here survives React unmount/remount cycles
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            flex: 1,
          }}
        />
        <input
          type="text"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            flex: 1,
          }}
        />
        <button
          onClick={() => {
            if (key) {
              dataStore.set(key, value);
              setKey("");
              setValue("");
              forceUpdate({});
            }
          }}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Set
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          {stats.itemCount} items, {stats.historyLength} total operations
        </p>
        <button
          onClick={() => {
            dataStore.clear();
            forceUpdate({});
          }}
          style={{
            padding: "5px 10px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Clear All
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
        {Object.keys(allData).length === 0 ? (
          <div style={{ color: "#6b7280" }}>No data stored yet...</div>
        ) : (
          Object.entries(allData).map(([k, v]) => (
            <div key={k} style={{ marginBottom: "5px" }}>
              <strong>{k}:</strong> {JSON.stringify(v)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Background Task Component
 *
 * Controls a background task that runs even when React is unmounted.
 */
function BackgroundTaskDemo() {
  const backgroundTask = useResource("backgroundTask");
  const dataStore = useResource("dataStore");

  const allData = useSyncExternalStore(
    dataStore.subscribe,
    dataStore.getSnapshot
  );
  const lastTick = allData.lastTick;
  const tickCount = allData.tickCount || 0;

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #8b5cf6",
        borderRadius: "8px",
      }}
    >
      <h2>⚙️ Background Task</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        This task continues running even when React is unmounted
      </p>

      <div style={{ marginBottom: "10px", fontFamily: "monospace" }}>
        <p>
          <strong>Status:</strong>{" "}
          {backgroundTask.isRunning() ? "🟢 Running" : "🔴 Stopped"}
        </p>
        <p>
          <strong>Tick Count:</strong> {tickCount}
        </p>
        {lastTick && (
          <p>
            <strong>Last Tick:</strong>{" "}
            {new Date(lastTick).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => backgroundTask.start()}
          disabled={backgroundTask.isRunning()}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            cursor: backgroundTask.isRunning() ? "not-allowed" : "pointer",
            opacity: backgroundTask.isRunning() ? 0.5 : 1,
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Start
        </button>
        <button
          onClick={() => backgroundTask.stop()}
          disabled={!backgroundTask.isRunning()}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            cursor: !backgroundTask.isRunning() ? "not-allowed" : "pointer",
            opacity: !backgroundTask.isRunning() ? 0.5 : 1,
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Stop
        </button>
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
        🧶 Braided React - Outliving React
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>
        The system persists across React mount/unmount cycles. Try unmounting
        and remounting React to see the state persist!
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <SessionInfo />
        <DataStoreDemo />
        <BackgroundTaskDemo />
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
            <strong>System Persistence:</strong> System continues running when
            React unmounts
          </li>
          <li>
            <strong>State Preservation:</strong> All data survives React
            lifecycle
          </li>
          <li>
            <strong>Background Tasks:</strong> Tasks run independently of React
          </li>
          <li>
            <strong>Mount Tracking:</strong> Session tracks React mount/unmount
            cycles
          </li>
          <li>
            <strong>True Independence:</strong> React is just a view layer, not
            the owner
          </li>
          <li>Use the "Unmount React" button below to test persistence!</li>
        </ol>
      </div>
    </div>
  );
}
