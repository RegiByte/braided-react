/**
 * Typed React Hooks
 *
 * Generated from the system configuration with full type inference.
 */

import { createSystemHooks } from "braided-react";
import type { systemConfig } from "./system";

export const { SystemBridge, useSystem, useResource } =
  createSystemHooks<typeof systemConfig>();

