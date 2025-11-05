import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(databaseUrl, { 
    max: 1,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/0002_scans_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration: 0002_scans_table.sql');
    
    // Remove all comments first
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolon to get individual statements
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      console.log('Executing:', preview + '...');
      await sql.unsafe(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Scans table created with indexes.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
