import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertProductSchema,
  insertClientSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertClientActivitySchema
} from "@shared/schema";
import { login, register, authenticate, getCurrentUser } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.route('/api');

  // ==================== ANALYTICS ====================
  app.get('/api/analytics', async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  });

  // ==================== AUTH ====================
  // Login endpoint
  app.post('/api/auth/login', login);
  
  // Register endpoint
  app.post('/api/auth/register', register);
  
  // ==================== USERS ====================
  // Get current user endpoint (authenticated)
  app.get('/api/users/me', authenticate, getCurrentUser);
  
  // Backward compatibility for existing code
  app.get('/api/users/me-legacy', async (req, res) => {
    // For demo purposes, return a dummy user
    // In a real app, this would use session/auth
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  // ==================== INVENTORY ====================
  app.get('/api/inventory', async (req, res) => {
    const products = await storage.getAllProducts();
    res.json(products);
  });

  app.get('/api/inventory/low-stock', async (req, res) => {
    const lowStockItems = await storage.getLowStockItems();
    res.json(lowStockItems);
  });

  app.get('/api/inventory/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  });

  app.post('/api/inventory', authenticate, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(validatedData);
      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.patch('/api/inventory/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.post('/api/inventory/:id/restock', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const quantity = req.body.quantity || 10;
    
    try {
      const updatedProduct = await storage.restockProduct(id, quantity);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: 'Failed to restock product' });
    }
  });

  // ==================== ORDERS ====================
  app.get('/api/orders', async (req, res) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  app.get('/api/orders/recent', async (req, res) => {
    const recentOrders = await storage.getRecentOrders();
    res.json(recentOrders);
  });

  app.get('/api/orders/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const order = await storage.getOrderWithDetails(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  });

  app.post('/api/orders', authenticate, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body.order);
      const items = z.array(insertOrderItemSchema).parse(req.body.items);
      
      const newOrder = await storage.createOrder(orderData, items);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id/status', authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const statusSchema = z.object({
      status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
    });

    try {
      const { status } = statusSchema.parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid status', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // ==================== CLIENTS ====================
  app.get('/api/clients', async (req, res) => {
    const clients = await storage.getAllClients();
    res.json(clients);
  });

  app.get('/api/clients/activity', async (req, res) => {
    const activities = await storage.getClientActivities();
    res.json(activities);
  });

  app.get('/api/clients/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  });

  app.post('/api/clients', authenticate, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient(validatedData);
      res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid client data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create client' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
