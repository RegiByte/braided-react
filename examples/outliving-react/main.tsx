/**
 * Application Entry Point - Outliving React
 *
 * This example demonstrates that the system outlives React.
 * We can unmount and remount React, and the system continues running.
 */

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { startSystem, haltSystem } from "braided";
import { systemConfig } from "./system";
import { SystemBridge } from "./hooks";
import { App } from "./App";
import type { StartedSystem } from "braided";
import React from "react";

let reactRoot: Root | null = null;
let system: StartedSystem<typeof systemConfig> | null = null;

/**
 * Mount React with the system
 */
function mountReact() {
  if (reactRoot || !system) return;

  console.log("⚛️  Mounting React...");

  const rootElement = document.getElementById("root")!;
  reactRoot = createRoot(rootElement);

  reactRoot.render(
    <StrictMode>
      <SystemBridge system={system}>
        <App />
      </SystemBridge>
    </StrictMode>
  );

  console.log("✅ React mounted");
  updateControls();
}

/**
 * Unmount React (system continues running!)
 */
function unmountReact() {
  if (!reactRoot) return;

  console.log("🔴 Unmounting React...");

  reactRoot.unmount();
  reactRoot = null;

  // Clear the root element
  const rootElement = document.getElementById("root")!;
  rootElement.innerHTML = "";

  console.log("✅ React unmounted (system still running!)");
  updateControls();
}

/**
 * Update control panel
 */
function updateControls() {
  const mountBtn = document.getElementById("mount-btn") as HTMLButtonElement;
  const unmountBtn = document.getElementById(
    "unmount-btn"
  ) as HTMLButtonElement;
  const statusText = document.getElementById("status-text")!;

  if (reactRoot) {
    mountBtn.disabled = true;
    unmountBtn.disabled = false;
    statusText.textContent = "🟢 React is mounted";
    statusText.style.color = "#10b981";
  } else {
    mountBtn.disabled = false;
    unmountBtn.disabled = true;
    statusText.textContent = "🔴 React is unmounted (system still running!)";
    statusText.style.color = "#ef4444";
  }
}

/**
 * Start the system before React
 */
async function main() {
  console.log("🚀 Starting system...");

  const result = await startSystem(systemConfig);
  system = result.system;

  if (result.errors.size > 0) {
    console.error("❌ System startup errors:", result.errors);
  } else {
    console.log("✅ System started successfully");
  }

  // Create control panel
  const controlPanel = document.createElement("div");
  controlPanel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 20px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 250px;
    ">
      <h3 style="margin: 0 0 10px 0; color: #3b82f6;">Control Panel</h3>
      <p id="status-text" style="margin: 0 0 15px 0; font-weight: bold;"></p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="mount-btn" style="
          padding: 10px;
          font-size: 14px;
          cursor: pointer;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
        ">Mount React</button>
        <button id="unmount-btn" style="
          padding: 10px;
          font-size: 14px;
          cursor: pointer;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
        ">Unmount React</button>
      </div>
      <p style="
        margin: 15px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      ">
        Try unmounting and remounting React. The system (session, data, background task) continues running!
      </p>
    </div>
  `;
  document.body.appendChild(controlPanel);

  // Wire up buttons
  document.getElementById("mount-btn")!.addEventListener("click", mountReact);
  document
    .getElementById("unmount-btn")!
    .addEventListener("click", unmountReact);

  // Mount React initially
  mountReact();

  // Cleanup on page unload
  window.addEventListener("beforeunload", async () => {
    console.log("🛑 Page unloading, halting system...");
    if (system) {
      await haltSystem(systemConfig, system);
    }
    console.log("✅ System halted");
  });
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  document.getElementById("root")!.innerHTML = `
    <div style="padding: 40px; color: red;">
      <h1>Failed to start application</h1>
      <pre>${error.message}</pre>
    </div>
  `;
});
