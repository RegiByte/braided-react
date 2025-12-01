/**
 * Application Entry Point
 *
 * This is where we start the system BEFORE React mounts.
 * This is the key pattern: system lifecycle is independent of React.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startSystem, haltSystem } from "braided";
import { systemConfig } from "./system";
import { SystemBridge } from "./hooks";
import { App } from "./App";

/**
 * Start the system before React
 */
async function main() {
  console.log("🚀 Starting system...");

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
