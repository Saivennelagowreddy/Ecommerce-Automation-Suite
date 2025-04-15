import { 
  users, 
  products, 
  clients, 
  orders, 
  orderItems, 
  clientActivities,
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct, 
  type Client, 
  type InsertClient, 
  type Order, 
  type InsertOrder, 
  type OrderItem, 
  type InsertOrderItem,
  type ClientActivity,
  type InsertClientActivity,
  type OrderWithDetails,
  type Analytics
} from "@shared/schema";
import { format } from "date-fns";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getLowStockItems(): Promise<any[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  restockProduct(id: number, quantity: number): Promise<Product>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getRecentOrders(): Promise<any[]>;
  getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Client Activity operations
  getClientActivity(id: number): Promise<ClientActivity | undefined>;
  getClientActivities(): Promise<any[]>;
  createClientActivity(activity: InsertClientActivity): Promise<ClientActivity>;
  
  // Analytics operation
  getAnalytics(): Promise<Analytics>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private clients: Map<number, Client>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private clientActivities: Map<number, ClientActivity>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentClientId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentClientActivityId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.clients = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.clientActivities = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentClientId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentClientActivityId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // Initialize with sample data for demonstration
  private async initializeSampleData() {
    // Create admin user
    await this.createUser({
      username: "admin",
      password: "password",
      name: "Admin User",
      email: "admin@example.com",
    });

    // Create some products
    const product1 = await this.createProduct({
      name: "Blue T-Shirt (Medium)",
      description: "Comfortable cotton t-shirt in blue color, medium size",
      price: 19.99,
      stockQuantity: 3,
      lowStockThreshold: 5,
    });

    const product2 = await this.createProduct({
      name: "Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      price: 89.99,
      stockQuantity: 5,
      lowStockThreshold: 5,
    });

    const product3 = await this.createProduct({
      name: "Smartphone Case",
      description: "Protective case for latest smartphone models",
      price: 24.99,
      stockQuantity: 2,
      lowStockThreshold: 10,
    });

    const product4 = await this.createProduct({
      name: "Leather Wallet",
      description: "Genuine leather wallet with multiple card slots",
      price: 49.99,
      stockQuantity: 4,
      lowStockThreshold: 5,
    });

    // Create some clients
    const client1 = await this.createClient({
      name: "John Smith",
      email: "john@example.com",
      phone: "555-1234",
      lastActive: new Date(),
    });

    const client2 = await this.createClient({
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "555-5678",
      lastActive: new Date(),
    });

    const client3 = await this.createClient({
      name: "Michael Brown",
      email: "michael@example.com",
      phone: "555-9012",
      lastActive: new Date(),
    });

    // Create some orders
    const order1 = await this.createOrder(
      {
        orderNumber: "ORD-2305",
        clientId: client1.id,
        orderDate: new Date(),
        status: "completed",
        total: 89.99,
      },
      [{ orderId: 1, productId: product2.id, quantity: 1, unitPrice: 89.99 }]
    );

    const order2 = await this.createOrder(
      {
        orderNumber: "ORD-2304",
        clientId: client2.id,
        orderDate: new Date(),
        status: "processing",
        total: 39.98,
      },
      [{ orderId: 2, productId: product1.id, quantity: 2, unitPrice: 19.99 }]
    );

    const order3 = await this.createOrder(
      {
        orderNumber: "ORD-2303",
        clientId: client3.id,
        orderDate: new Date(),
        status: "pending",
        total: 24.99,
      },
      [{ orderId: 3, productId: product3.id, quantity: 1, unitPrice: 24.99 }]
    );

    // Create client activities
    await this.createClientActivity({
      clientId: client1.id,
      activityType: "order",
      description: "Placed a new order",
      timestamp: new Date(),
      relatedId: "ORD-2305",
    });

    await this.createClientActivity({
      clientId: client2.id,
      activityType: "profile",
      description: "Updated their profile information",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    });

    await this.createClientActivity({
      clientId: client3.id,
      activityType: "review",
      description: "Left a review for product Wireless Headphones",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getLowStockItems(): Promise<any[]> {
    return Array.from(this.products.values())
      .filter((product) => product.stockQuantity <= product.lowStockThreshold)
      .map((product) => ({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity,
        threshold: product.lowStockThreshold,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async restockProduct(id: number, quantity: number): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const updatedProduct = { 
      ...product, 
      stockQuantity: product.stockQuantity + quantity 
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.email === email
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    
    // Create a client activity for new client registration
    await this.createClientActivity({
      clientId: client.id,
      activityType: "registration",
      description: "Registered as a new client",
      timestamp: new Date(),
    });
    
    return client;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getRecentOrders(): Promise<any[]> {
    const orders = Array.from(this.orders.values())
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
    
    return Promise.all(orders.map(async (order) => {
      const client = await this.getClient(order.clientId);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: client?.name || 'Unknown Client',
        status: order.status,
      };
    }));
  }

  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const client = await this.getClient(order.clientId);
    if (!client) return undefined;
    
    const itemsList = Array.from(this.orderItems.values())
      .filter((item) => item.orderId === id);
    
    const items = await Promise.all(itemsList.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product || { id: 0, name: 'Unknown Product', description: '', price: 0, stockQuantity: 0, lowStockThreshold: 0 },
      };
    }));
    
    return {
      ...order,
      client,
      items,
    };
  }

  async createOrder(insertOrder: InsertOrder, insertItems: InsertOrderItem[]): Promise<OrderWithDetails> {
    // Create the order
    const id = this.currentOrderId++;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    
    // Create the order items
    const items = await Promise.all(insertItems.map(async (item) => {
      const orderItemId = this.currentOrderItemId++;
      const orderItem: OrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product stock quantity
      const product = await this.getProduct(item.productId);
      if (product) {
        const updatedStock = Math.max(0, product.stockQuantity - item.quantity);
        await this.updateProduct(product.id, { stockQuantity: updatedStock });
      }
      
      return orderItem;
    }));
    
    // Create client activity for the new order
    await this.createClientActivity({
      clientId: order.clientId,
      activityType: "order",
      description: "Placed a new order",
      timestamp: new Date(),
      relatedId: order.orderNumber,
    });
    
    // Return the complete order with details
    return this.getOrderWithDetails(id) as Promise<OrderWithDetails>;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    
    // Create client activity for the order status update
    await this.createClientActivity({
      clientId: order.clientId,
      activityType: "order_status",
      description: `Order status updated to ${status}`,
      timestamp: new Date(),
      relatedId: order.orderNumber,
    });
    
    return updatedOrder;
  }

  // Client Activity operations
  async getClientActivity(id: number): Promise<ClientActivity | undefined> {
    return this.clientActivities.get(id);
  }

  async getClientActivities(): Promise<any[]> {
    const activities = Array.from(this.clientActivities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    return Promise.all(activities.map(async (activity) => {
      const client = await this.getClient(activity.clientId);
      return {
        id: activity.id,
        client: {
          id: client?.id || 0,
          name: client?.name || 'Unknown Client',
          avatarUrl: client?.avatarUrl,
        },
        description: activity.description,
        timestamp: activity.timestamp,
        relatedId: activity.relatedId,
      };
    }));
  }

  async createClientActivity(insertActivity: InsertClientActivity): Promise<ClientActivity> {
    const id = this.currentClientActivityId++;
    const activity: ClientActivity = { ...insertActivity, id };
    this.clientActivities.set(id, activity);
    return activity;
  }

  // Analytics operation
  async getAnalytics(): Promise<Analytics> {
    // Count orders from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = Array.from(this.orders.values())
      .filter((order) => new Date(order.orderDate) >= today)
      .length;
    
    // Calculate total revenue
    const revenue = Array.from(this.orders.values())
      .reduce((total, order) => total + order.total, 0);
    
    // Count low stock items
    const lowStockItems = Array.from(this.products.values())
      .filter((product) => product.stockQuantity <= product.lowStockThreshold)
      .length;
    
    // Count new clients in the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const newClients = Array.from(this.clients.values())
      .filter((client) => client.lastActive && new Date(client.lastActive) >= lastWeek)
      .length;
    
    return {
      ordersToday,
      revenue,
      lowStockItems,
      newClients,
    };
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './dbStorage';

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
