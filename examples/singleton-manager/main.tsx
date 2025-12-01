/**
 * Application Entry Point - Event Bus Communication
 *
 * Start the system before React, with resources coordinated via event bus.
 */

import { haltSystem, startSystem } from "braided";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SystemBridge } from "./hooks";
import { systemConfig } from "./system";

/**
 * Start the system before React
 */
async function main() {
  console.log("🚀 Starting system with event bus...");

  const { system, errors } = await startSystem(systemConfig);

  if (errors.size > 0) {
    console.error("❌ System startup errors:", errors);
  } else {
    console.log("✅ System started successfully");
  }

  console.log("⚛️  Mounting React...");

  // Mount React with the started system
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <SystemBridge system={system}>
        <App />
      </SystemBridge>
    </StrictMode>
  );

  console.log("✅ React mounted");

  // Cleanup on page unload (optional)
  window.addEventListener("beforeunload", async () => {
    console.log("🛑 Page unloading, halting system...");
    await haltSystem(systemConfig, system);
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
