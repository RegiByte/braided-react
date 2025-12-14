/**
 * Typed Hooks for the System
 *
 * Create manager and hooks once, use everywhere with full type inference.
 */

import { createSystemManager, createSystemHooks } from "braided-react";
import { systemConfig } from "./system";

/**
 * Create manager and hooks for our system configuration.
 *
 * These hooks provide full TypeScript inference:
 * - useResource('counter') returns the exact counter type
 * - useResource('logger') returns the exact logger type
 * - useSystem() returns the complete system type
 */
export const manager = createSystemManager(systemConfig);
export const { useSystem, useResource, SystemProvider } =
  createSystemHooks(manager);
