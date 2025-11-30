/**
 * System Configuration - Simulates a heavy startup
 */

import { defineResource } from 'braided-react/braided'

/**
 * Database Resource - Simulates async connection
 */
export const databaseResource = defineResource({
  start: async () => {
    console.log('🗄️  Database connecting...')
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('✅ Database connected')

    const data = new Map<string, any>()

    return {
      async query(sql: string) {
        console.log(`🗄️  Query: ${sql}`)
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { rows: [], sql }
      },
      async insert(key: string, value: any) {
        data.set(key, value)
        console.log(`🗄️  Inserted: ${key}`)
      },
      async get(key: string) {
        return data.get(key)
      },
    }
  },
  halt: () => {
    console.log('🗄️  Database disconnecting...')
  },
})

/**
 * Cache Resource - Simulates async setup
 */
export const cacheResource = defineResource({
  start: async () => {
    console.log('💾 Cache initializing...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('✅ Cache ready')

    const cache = new Map<string, any>()

    return {
      async set(key: string, value: any) {
        cache.set(key, value)
        console.log(`💾 Cached: ${key}`)
      },
      async get(key: string) {
        return cache.get(key)
      },
      async clear() {
        cache.clear()
        console.log('💾 Cache cleared')
      },
    }
  },
  halt: (cache) => {
    console.log('💾 Cache shutting down...')
    cache.clear()
  },
})

/**
 * System Configuration
 */
export const systemConfig = {
  database: databaseResource,
  cache: cacheResource,
}


