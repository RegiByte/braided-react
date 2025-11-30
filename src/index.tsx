/**
 * braided-react
 *
 * React integration for Braided - Bridge your stateful systems to React
 * without giving up lifecycle control.
 *
 * Philosophy:
 * - React observes the system, doesn't own it
 * - System lifecycle is managed outside React
 * - Minimal API surface - just primitives for composition
 *
 * @example
 * ```typescript
 * import { createSystemHooks } from 'braided-react'
 * import { startSystem } from 'braided'
 *
 * const systemConfig = {
 *   database: databaseResource,
 *   api: apiResource,
 * }
 *
 * // Create typed hooks
 * const { SystemBridge, useResource } = createSystemHooks<typeof systemConfig>()
 *
 * // Start system outside React
 * const { system } = await startSystem(systemConfig)
 *
 * // Bridge to React
 * <SystemBridge system={system}>
 *   <App />
 * </SystemBridge>
 *
 * // Use in components
 * function MyComponent() {
 *   const database = useResource('database')
 *   return <div>...</div>
 * }
 * ```
 */

export { createSystemHooks } from "./hooks";
export { createSystemManager } from "./manager";
export { LazySystemBridge } from "./lazy";

export type { ManagedSystem } from "./manager";
export type { LazySystemBridgeProps } from "./lazy";
