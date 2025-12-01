/**
 * React Application - Zustand Integration
 *
 * This example shows how Zustand stores can be managed as Braided resources.
 * The stores live in the system, providing centralized state management.
 */

import React, { useState } from "react";
import { useResource } from "./hooks";

/**
 * Counter Component
 *
 * Uses the Zustand store from the counterStore resource.
 */
function Counter() {
  const counterStore = useResource("counterStore");
  const { count, increment, decrement, reset } = counterStore.useCounterStore();

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
      }}
    >
      <h2>🔢 Counter (Zustand Store)</h2>
      <p style={{ fontSize: "48px", margin: "20px 0" }}>{count}</p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={increment}
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
          +
        </button>
        <button
          onClick={decrement}
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
          -
        </button>
        <button
          onClick={reset}
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
 * Todo List Component
 *
 * Uses the Zustand store from the todoStore resource.
 */
function TodoList() {
  const todoStore = useResource("todoStore");
  const { todos, addTodo, toggleTodo, removeTodo, clearCompleted } =
    todoStore.useTodoStore();
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      addTodo(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #10b981",
        borderRadius: "8px",
      }}
    >
      <h2>📝 Todos (Zustand Store)</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a todo..."
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleAdd}
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
          Add
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <p style={{ color: "#6b7280", margin: "0 0 10px 0" }}>
          {todos.length} total, {todos.filter((t) => t.completed).length}{" "}
          completed
        </p>
        {todos.filter((t) => t.completed).length > 0 && (
          <button
            onClick={clearCompleted}
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
            Clear Completed
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {todos.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                backgroundColor: todo.completed ? "#f3f4f6" : "white",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                style={{ cursor: "pointer" }}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#6b7280" : "inherit",
                }}
              >
                {todo.text}
              </span>
              <button
                onClick={() => removeTodo(todo.id)}
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
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Logger Controls Component
 *
 * Demonstrates accessing the logger resource that observes stores.
 */
function LoggerControls() {
  const logger = useResource("logger");

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #8b5cf6",
        borderRadius: "8px",
      }}
    >
      <h2>📊 Logger</h2>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        The logger resource subscribes to store changes and logs them to the
        console.
      </p>
      <button
        onClick={() => logger.logCurrentState()}
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
        Log Current State
      </button>
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
        🧶 Braided React - Zustand Integration
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>
        Zustand stores managed as Braided resources. Stores persist across React
        remounts and can be observed by other resources.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Counter />
        <TodoList />
        <LoggerControls />
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
            <strong>Stores as Resources:</strong> Zustand stores are created in
            the system, not in components
          </li>
          <li>
            <strong>Centralized State:</strong> All stores live in one place,
            easy to coordinate
          </li>
          <li>
            <strong>Cross-Resource Observation:</strong> Logger resource
            subscribes to store changes
          </li>
          <li>
            <strong>Persistence:</strong> Stores survive React remounts and
            StrictMode
          </li>
          <li>
            <strong>Type Safety:</strong> Full TypeScript inference from system
            to components
          </li>
          <li>Open DevTools console to see store change logs</li>
        </ol>
      </div>
    </div>
  );
}
