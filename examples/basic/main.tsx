/**
 * Application Entry Point
 *
 * With the new API, we can use Suspense for automatic system startup.
 * The system starts automatically when components first call useResource/useSystem.
 */

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import React from "react";

/**
 * Mount React - system will start automatically via Suspense
 */
function main() {
  console.log("⚛️  Mounting React...");

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <Suspense
        fallback={<div style={{ padding: "40px" }}>🚀 Starting system...</div>}
      >
        <App />
      </Suspense>
    </StrictMode>
  );

  console.log("✅ React mounted");
}

main();
