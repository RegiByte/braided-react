/**
 * Typed Hooks for the System
 *
 * Create typed hooks once, use everywhere with full type inference.
 */

import { createSystemHooks } from 'braided-react'
import { systemConfig } from './system'

/**
 * Create typed hooks for our system configuration.
 *
 * These hooks provide full TypeScript inference:
 * - useResource('counter') returns the exact counter type
 * - useResource('logger') returns the exact logger type
 * - useSystem() returns the complete system type
 */
export const { SystemBridge, useSystem, useResource } =
  createSystemHooks<typeof systemConfig>()


