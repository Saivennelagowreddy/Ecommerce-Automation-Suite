import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// Required for Node.js environment
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL in environment
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Starting database schema push...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Creating tables...');
  
  try {
    // Create tables in the correct order
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        stock_quantity INTEGER NOT NULL,
        low_stock_threshold INTEGER NOT NULL DEFAULT 5,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        avatar_url TEXT,
        last_active TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        order_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        total_amount DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS client_activities (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        related_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Database schema created successfully!');
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    // Add a sample admin user
    await db.insert(schema.users).values({
      username: 'admin',
      password: 'password', // In a real app, use a hashing library here
      name: 'Admin User',
      email: 'admin@example.com'
    }).onConflictDoNothing();
    
    // Add sample clients
    await db.insert(schema.clients).values([
      {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '123-456-7890',
        lastActive: new Date()
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '987-654-3210',
        lastActive: new Date()
      }
    ]).onConflictDoNothing();
    
    // Add sample products
    await db.insert(schema.products).values([
      {
        name: 'Blue T-Shirt (Medium)',
        description: 'Comfortable cotton t-shirt in blue',
        price: 19.99,
        stockQuantity: 3,
        lowStockThreshold: 5
      },
      {
        name: 'Black Jeans (32x32)',
        description: 'Classic black denim jeans',
        price: 49.99,
        stockQuantity: 10,
        lowStockThreshold: 3
      },
      {
        name: 'Wireless Headphones',
        description: 'Noise-cancelling wireless headphones',
        price: 99.99,
        stockQuantity: 8,
        lowStockThreshold: 2
      }
    ]).onConflictDoNothing();
    
    // Check if we have clients and products before adding orders
    const clientsResult = await db.select().from(schema.clients);
    const productsResult = await db.select().from(schema.products);
    
    if (clientsResult.length > 0 && productsResult.length > 0) {
      // Add a sample order
      const [order] = await db.insert(schema.orders).values({
        orderNumber: 'ORD-2305',
        clientId: clientsResult[0].id,
        orderDate: new Date(),
        status: 'processing',
        total: 69.98,
        totalAmount: 69.98
      }).returning();
      
      // Add order items
      if (order) {
        await db.insert(schema.orderItems).values([
          {
            orderId: order.id,
            productId: productsResult[0].id,
            quantity: 1,
            unitPrice: 19.99
          },
          {
            orderId: order.id,
            productId: productsResult[1].id,
            quantity: 1,
            unitPrice: 49.99
          }
        ]);
        
        // Add client activity
        await db.insert(schema.clientActivities).values({
          clientId: clientsResult[0].id,
          activityType: 'order',
          description: `Placed order #${order.orderNumber}`,
          timestamp: new Date(),
          relatedId: order.id.toString()
        });
      }
    }
    
    console.log('Sample data inserted successfully!');
    
  } catch (error) {
    console.error('Failed to set up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();