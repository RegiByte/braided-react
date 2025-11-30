/**
 * System Configuration
 *
 * Define your stateful resources here. This example shows a simple
 * counter and logger with a dependency relationship.
 */

import { defineResource } from 'braided-react/braided'
import type { StartedResource } from 'braided-react'

/**
 * Counter Resource - No dependencies
 *
 * A simple stateful counter that can be incremented.
 */
export const counterResource = defineResource({
  start: () => {
    console.log('🔢 Counter starting...')
    let count = 0

    return {
      get count() {
        return count
      },
      increment() {
        count++
        console.log(`Counter incremented to ${count}`)
      },
      reset() {
        count = 0
        console.log('Counter reset to 0')
      },
    }
  },
  halt: (counter) => {
    console.log(`🔢 Counter halting (final count: ${counter.count})`)
  },
})

/**
 * Logger Resource - Depends on counter
 *
 * Logs messages and can access the counter to log its current value.
 */
export const loggerResource = defineResource<{
  counter: StartedResource<typeof counterResource>
}>({
  dependencies: ['counter'],
  start: ({ counter }) => {
    console.log('📝 Logger starting...')
    const logs: string[] = []

    return {
      get logs() {
        return [...logs]
      },
      log(message: string) {
        const timestamp = new Date().toLocaleTimeString()
        const entry = `[${timestamp}] ${message}`
        logs.push(entry)
        console.log(`📝 ${entry}`)
      },
      logCount() {
        const message = `Counter is at ${counter.count}`
        const timestamp = new Date().toLocaleTimeString()
        const entry = `[${timestamp}] ${message}`
        logs.push(entry)
        console.log(`📝 ${entry}`)
      },
      clear() {
        logs.length = 0
        console.log('📝 Logs cleared')
      },
    }
  },
  halt: (logger) => {
    console.log(`📝 Logger halting (${logger.logs.length} logs recorded)`)
  },
})

/**
 * System Configuration
 *
 * Compose your resources into a system. The library will start them
 * in dependency order (counter first, then logger).
 */
export const systemConfig = {
  counter: counterResource,
  logger: loggerResource,
}


