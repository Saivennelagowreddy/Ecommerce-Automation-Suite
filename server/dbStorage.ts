import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  type User, type InsertUser, users,
  type Product, type InsertProduct, products,
  type Client, type InsertClient, clients,
  type Order, type InsertOrder, orders,
  type OrderItem, type InsertOrderItem, orderItems,
  type ClientActivity, type InsertClientActivity, clientActivities,
  type OrderWithDetails, type ClientActivityWithDetails, type Analytics
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getLowStockItems(): Promise<any[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    return updatedProduct;
  }

  async restockProduct(id: number, quantity: number): Promise<Product> {
    const product = await this.getProduct(id);
    
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    const updatedQuantity = product.stockQuantity + quantity;
    return this.updateProduct(id, { stockQuantity: updatedQuantity });
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.orderDate));
  }

  async getRecentOrders(): Promise<any[]> {
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        clientId: orders.clientId,
        orderDate: orders.orderDate,
        clientName: clients.name
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .orderBy(desc(orders.orderDate))
      .limit(10);

    return recentOrders;
  }

  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;
    
    const client = await this.getClient(order.clientId);
    if (!client) throw new Error(`Client with ID ${order.clientId} not found`);
    
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);
        return { ...item, product };
      })
    );

    return {
      ...order,
      client,
      items: itemsWithProducts
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    const orderItemsWithOrderId = items.map(item => ({
      ...item,
      orderId: newOrder.id
    }));
    
    const newItems = await db.insert(orderItems).values(orderItemsWithOrderId).returning();
    
    // Update product stock quantities
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        const newQuantity = product.stockQuantity - item.quantity;
        await this.updateProduct(item.productId, { stockQuantity: newQuantity >= 0 ? newQuantity : 0 });
      }
    }
    
    // Create client activity for this order
    const client = await this.getClient(order.clientId);
    if (client) {
      await this.createClientActivity({
        clientId: client.id,
        description: `Placed order #${order.orderNumber}`,
        timestamp: new Date(),
        activityType: "order",
        relatedId: newOrder.id.toString()
      });
    }
    
    return this.getOrderWithDetails(newOrder.id) as Promise<OrderWithDetails>;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    // Create client activity for status update
    const client = await this.getClient(updatedOrder.clientId);
    if (client) {
      await this.createClientActivity({
        clientId: client.id,
        description: `Order #${updatedOrder.orderNumber} status changed to ${status}`,
        timestamp: new Date(),
        activityType: "status",
        relatedId: updatedOrder.id.toString()
      });
    }
    
    return updatedOrder;
  }

  // Client Activity operations
  async getClientActivity(id: number): Promise<ClientActivity | undefined> {
    const [activity] = await db.select().from(clientActivities).where(eq(clientActivities.id, id));
    return activity;
  }

  async getClientActivities(): Promise<any[]> {
    const activities = await db
      .select()
      .from(clientActivities)
      .leftJoin(clients, eq(clientActivities.clientId, clients.id))
      .orderBy(desc(clientActivities.timestamp))
      .limit(10);
    
    return activities.map(({ client_activities, clients }) => ({
      ...client_activities,
      client: clients
    }));
  }

  async createClientActivity(activity: InsertClientActivity): Promise<ClientActivity> {
    const [newActivity] = await db.insert(clientActivities).values(activity).returning();
    return newActivity;
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics> {
    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count orders created today
    const todayOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.orderDate} >= ${today.toISOString()}`);
    
    // Calculate total revenue
    const revenueResult = await db
      .select({ total: sql<number>`sum(${orders.total})` })
      .from(orders);
    
    // Count low stock items
    const lowStockCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);
    
    // Count new clients in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClientsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(sql`${clients.createdAt} >= ${thirtyDaysAgo.toISOString()}`);
    
    return {
      ordersToday: todayOrders[0]?.count || 0,
      revenue: revenueResult[0]?.total || 0,
      lowStockItems: lowStockCount[0]?.count || 0,
      newClients: newClientsCount[0]?.count || 0
    };
  }
}