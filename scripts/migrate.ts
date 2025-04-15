import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environment
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL in environment
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Starting database migration...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Pushing schema to database...');
  
  try {
    // This will push the schema to the database
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Database schema pushed successfully!');
  } catch (error) {
    console.error('Failed to push schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();