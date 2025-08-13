import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Create the connection
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// Create postgres client
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create drizzle instance
export const db = drizzle(client, { schema })

// Export schema for type inference
export * from './schema'

// Health check function
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await client.end()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Connection pool monitoring
export function getDatabaseStats() {
  return {
    totalConnections: client.options.max,
    idleTimeout: client.options.idle_timeout,
    connectTimeout: client.options.connect_timeout,
  }
}