/**
 * ErrorBoundary Integration Examples
 * 
 * This file demonstrates how to use ErrorBoundary with braided-react
 * to handle system startup errors gracefully.
 * 
 * Install: npm install react-error-boundary
 */

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { defineResource } from "braided";
import { createSystemManager, createSystemHooks } from "braided-react";

// ============================================================================
// Example 1: Basic ErrorBoundary with System Startup Errors
// ============================================================================

const databaseResource = defineResource({
  start: () => {
    // Simulate database connection failure
    throw new Error("Database connection failed: Connection timeout");
  },
  halt: () => {},
});

const basicConfig = {
  database: databaseResource,
};

const basicManager = createSystemManager(basicConfig);
const { useSystem: useBasicSystem } = createSystemHooks(basicManager);

function BasicApp() {
  const system = useBasicSystem(); // Will throw error, caught by ErrorBoundary
  return <div>App loaded: {JSON.stringify(system)}</div>;
}

function BasicErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: "40px", color: "red" }}>
      <h1>⚠️ System Startup Failed</h1>
      <p>{error.message}</p>
    </div>
  );
}

export function BasicErrorBoundaryExample() {
  return (
    <ErrorBoundary FallbackComponent={BasicErrorFallback}>
      <Suspense fallback={<div>Starting system...</div>}>
        <BasicApp />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 2: Custom Error UI with Multiple Resource Failures
// ============================================================================

const apiResource = defineResource({
  start: () => {
    throw new Error("API authentication failed");
  },
  halt: () => {},
});

const cacheResource = defineResource({
  start: () => {
    throw new Error("Redis connection timeout");
  },
  halt: () => {},
});

const multiConfig = {
  api: apiResource,
  cache: cacheResource,
};

const multiManager = createSystemManager(multiConfig);
const { useSystem: useMultiSystem } = createSystemHooks(multiManager);

function MultiApp() {
  useMultiSystem();
  return <div>App content</div>;
}

function CustomErrorFallback({ error }: { error: Error }) {
  // Parse the error message to extract individual failures
  const errorMessage = error.message;
  
  // Extract individual resource errors
  const resourceErrors: Array<{ resource: string; message: string }> = [];
  
  // Parse format: "System startup failed: api: error1, cache: error2"
  const match = errorMessage.match(/System startup failed: (.+)/);
  if (match) {
    const errorsStr = match[1];
    const parts = errorsStr.split(", ");
    
    parts.forEach((part) => {
      const [resource, ...messageParts] = part.split(": ");
      resourceErrors.push({
        resource,
        message: messageParts.join(": "),
      });
    });
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ color: "#ef4444" }}>🚨 System Startup Failed</h1>
      <p style={{ color: "#6b7280" }}>
        The following resources failed to start:
      </p>

      <div style={{ marginTop: "20px" }}>
        {resourceErrors.map(({ resource, message }) => (
          <div
            key={resource}
            style={{
              padding: "15px",
              marginBottom: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
            }}
          >
            <strong style={{ color: "#dc2626" }}>{resource}</strong>
            <p style={{ margin: "5px 0 0 0", color: "#991b1b" }}>{message}</p>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
}

export function CustomErrorUIExample() {
  return (
    <ErrorBoundary FallbackComponent={CustomErrorFallback}>
      <Suspense fallback={<div>Connecting to services...</div>}>
        <MultiApp />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 3: ErrorBoundary with Reset/Retry Functionality
// ============================================================================

let attemptCount = 0;

const flakeyResource = defineResource({
  start: () => {
    attemptCount++;
    if (attemptCount <= 2) {
      throw new Error(`Network timeout (attempt ${attemptCount})`);
    }
    return {
      status: "connected",
      attempt: attemptCount,
    };
  },
  halt: () => {},
});

const retryConfig = {
  network: flakeyResource,
};

const retryManager = createSystemManager(retryConfig);
const { useSystem: useRetrySystem } = createSystemHooks(retryManager);

function RetryApp() {
  const system = useRetrySystem();
  return (
    <div style={{ padding: "40px" }}>
      <h2>✅ Connected!</h2>
      <p>Successfully connected on attempt {system.network.attempt}</p>
    </div>
  );
}

function RetryErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ color: "#ef4444" }}>Connection Failed</h2>
      <p style={{ color: "#6b7280" }}>{error.message}</p>
      <button
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
        }}
        onClick={() => {
          // In a real app, you might want to reset the manager here
          // await retryManager.destroySystem();
          resetErrorBoundary();
        }}
      >
        🔄 Retry Connection
      </button>
    </div>
  );
}

export function RetryExample() {
  return (
    <ErrorBoundary
      FallbackComponent={RetryErrorFallback}
      onReset={() => {
        // Optional: Reset any state before retry
        console.log("Resetting error boundary...");
      }}
    >
      <Suspense fallback={<div>Connecting to network...</div>}>
        <RetryApp />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 4: Nested ErrorBoundaries for Granular Error Handling
// ============================================================================

const criticalResource = defineResource({
  start: () => {
    throw new Error("Critical authentication service unavailable");
  },
  halt: () => {},
});

const optionalResource = defineResource({
  start: () => ({
    analytics: { track: (event: string) => console.log("Track:", event) },
  }),
  halt: () => {},
});

const nestedConfig = {
  critical: criticalResource,
  optional: optionalResource,
};

const nestedManager = createSystemManager(nestedConfig);
const { useSystem: useNestedSystem } = createSystemHooks(nestedManager);

function CriticalFeature() {
  useNestedSystem(); // Will fail
  return <div>Critical Feature</div>;
}

function OptionalFeature() {
  return (
    <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "8px" }}>
      <h3>✅ Optional Features</h3>
      <p>These features work even when critical systems fail.</p>
    </div>
  );
}

function CriticalErrorFallback() {
  return (
    <div
      style={{
        padding: "20px",
        background: "#fef2f2",
        border: "2px solid #fecaca",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>
        ⚠️ Critical Feature Unavailable
      </h3>
      <p style={{ margin: 0, color: "#991b1b" }}>
        Running in degraded mode. Some features may be limited.
      </p>
    </div>
  );
}

function AppErrorFallback() {
  return (
    <div style={{ padding: "40px", color: "red" }}>
      <h1>💥 Complete System Failure</h1>
      <p>The entire application failed to start.</p>
    </div>
  );
}

export function NestedErrorBoundariesExample() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <div style={{ padding: "40px" }}>
        <h1>Application with Graceful Degradation</h1>

        {/* Critical feature with its own error boundary */}
        <ErrorBoundary FallbackComponent={CriticalErrorFallback}>
          <Suspense fallback={<div>Loading critical features...</div>}>
            <CriticalFeature />
          </Suspense>
        </ErrorBoundary>

        {/* Optional features that work independently */}
        <OptionalFeature />
      </div>
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 5: Production-Ready Pattern with Logging
// ============================================================================

const productionResource = defineResource({
  start: () => {
    throw new Error("Service initialization failed");
  },
  halt: () => {},
});

const productionConfig = {
  service: productionResource,
};

const productionManager = createSystemManager(productionConfig);
const { useSystem: useProductionSystem } = createSystemHooks(productionManager);

function ProductionApp() {
  useProductionSystem();
  return <div>App content</div>;
}

function ProductionErrorFallback({ error }: { error: Error }) {
  // In production, you'd send this to your error tracking service
  // e.g., Sentry, LogRocket, etc.
  console.error("[Error Tracking] System startup failed:", {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "500px",
        margin: "100px auto",
        textAlign: "center",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>😔</div>
      <h1 style={{ color: "#1f2937", marginBottom: "10px" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "30px" }}>
        We're having trouble starting the application. Our team has been notified.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
        <button
          style={{
            padding: "12px 24px",
            background: "white",
            color: "#3b82f6",
            border: "2px solid #3b82f6",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => (window.location.href = "/support")}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

export function ProductionExample() {
  return (
    <ErrorBoundary
      FallbackComponent={ProductionErrorFallback}
      onError={(error, errorInfo) => {
        // Send to error tracking service
        console.error("Error caught by boundary:", error, errorInfo);
        // sendToSentry(error, errorInfo);
      }}
    >
      <Suspense
        fallback={
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner">Loading...</div>
          </div>
        }
      >
        <ProductionApp />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Key Patterns:
 * 
 * 1. Always wrap your app with ErrorBoundary + Suspense:
 *    <ErrorBoundary FallbackComponent={ErrorUI}>
 *      <Suspense fallback={<Loading />}>
 *        <App />
 *      </Suspense>
 *    </ErrorBoundary>
 * 
 * 2. System startup errors are automatically thrown by useSystem()
 *    - Suspense catches the loading state (thrown Promise)
 *    - ErrorBoundary catches startup failures (thrown Error)
 * 
 * 3. Error messages include all failed resources:
 *    "System startup failed: api: error1, cache: error2"
 * 
 * 4. Use nested ErrorBoundaries for graceful degradation:
 *    - Outer boundary for complete failures
 *    - Inner boundaries for optional features
 * 
 * 5. In production:
 *    - Log errors to tracking service (Sentry, LogRocket)
 *    - Provide user-friendly error messages
 *    - Offer retry/reload options
 *    - Include support contact information
 */

