/**
 * Application Entry Point - Zustand Integration
 *
 * With the new API, system starts automatically via Suspense.
 */

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import React from "react";

/**
 * Mount React - system will start automatically
 */
function main() {
  console.log("⚛️  Mounting React...");

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <Suspense
        fallback={
          <div style={{ padding: "40px" }}>
            🚀 Starting system with Zustand stores...
          </div>
        }
      >
        <App />
      </Suspense>
    </StrictMode>
  );

  console.log("✅ React mounted");
}

main();
