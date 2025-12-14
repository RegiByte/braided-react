/**
 * Application Entry Point - Event Bus Communication
 *
 * With the new API, system starts automatically via Suspense.
 */

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

/**
 * Mount React - system will start automatically
 */
function main() {
  console.log("⚛️  Mounting React...");

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <Suspense fallback={<div style={{ padding: "40px" }}>🚀 Starting system with event bus...</div>}>
        <App />
      </Suspense>
    </StrictMode>
  );

  console.log("✅ React mounted");
}

main();
