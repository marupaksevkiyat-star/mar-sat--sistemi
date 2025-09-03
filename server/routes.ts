import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertVisitSchema,
  insertAppointmentSchema
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";

// Simple auth middleware for demo
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Session setup
  app.use(session({
    secret: 'demo-secret',
    resave: false,
    saveUninitialized: false,
  }));

  // Simple login route
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: username="${username}", password="${password}"`);
    
    // User credentials
    const userCredentials: Record<string, any> = {
      'admin': { password: '1234', user: { id: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@system.com', role: 'Admin' }},
      'ahmet': { password: '1234', user: { id: 'sales_manager', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@company.com', role: 'Satış Müdürü' }},
      'ayse': { password: '1234', user: { id: 'sales_staff', firstName: 'Ayşe', lastName: 'Demir', email: 'ayse@company.com', role: 'Satış Personeli' }},
      'mehmet': { password: '1234', user: { id: 'production_manager', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@company.com', role: 'Üretim Müdürü' }},
      'zeynep': { password: '1234', user: { id: 'production_staff', firstName: 'Zeynep', lastName: 'Çelik', email: 'zeynep@company.com', role: 'Üretim Personeli' }},
      'ali': { password: '1234', user: { id: 'accounting_manager', firstName: 'Ali', lastName: 'Öztürk', email: 'ali@company.com', role: 'Muhasebe Müdürü' }},
      'elif': { password: '1234', user: { id: 'accounting_staff', firstName: 'Elif', lastName: 'Şahin', email: 'elif@company.com', role: 'Muhasebe Personeli' }},
      'fatma': { password: '1234', user: { id: 'shipping_manager', firstName: 'Fatma', lastName: 'Özkan', email: 'fatma@company.com', role: 'Sevkiyat Müdürü' }},
      'murat': { password: '1234', user: { id: 'shipping_staff', firstName: 'Murat', lastName: 'Arslan', email: 'murat@company.com', role: 'Sevkiyat Personeli' }}
    };
    
    const userCred = userCredentials[username?.toLowerCase()];
    console.log(`Found user credential for "${username}":`, userCred ? 'Yes' : 'No');
    console.log('Available users:', Object.keys(userCredentials));
    
    if (userCred && userCred.password === password) {
      req.session.user = userCred.user;
      console.log(`Login successful for user: ${username}`);
      res.json({ success: true });
    } else {
      console.log(`Login failed for user: ${username}`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // For now, return mock users since we don't have a full user management system
      const mockUsers = [
        { id: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@system.com', role: 'Admin', status: 'active' },
        { id: 'sales_manager', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@company.com', role: 'Satış Müdürü', status: 'active' },
        { id: 'sales_staff', firstName: 'Ayşe', lastName: 'Demir', email: 'ayse@company.com', role: 'Satış Personeli', status: 'active' },
        { id: 'production_manager', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@company.com', role: 'Üretim Müdürü', status: 'active' },
        { id: 'production_staff', firstName: 'Zeynep', lastName: 'Çelik', email: 'zeynep@company.com', role: 'Üretim Personeli', status: 'active' },
        { id: 'accounting_manager', firstName: 'Ali', lastName: 'Öztürk', email: 'ali@company.com', role: 'Muhasebe Müdürü', status: 'active' },
        { id: 'accounting_staff', firstName: 'Elif', lastName: 'Şahin', email: 'elif@company.com', role: 'Muhasebe Personeli', status: 'active' },
        { id: 'shipping_manager', firstName: 'Fatma', lastName: 'Özkan', email: 'fatma@company.com', role: 'Sevkiyat Müdürü', status: 'active' },
        { id: 'shipping_staff', firstName: 'Murat', lastName: 'Arslan', email: 'murat@company.com', role: 'Sevkiyat Personeli', status: 'inactive' },
      ];
      res.json(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Add new user (admin only)
  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { firstName, lastName, email, role, password } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !email || !role || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // For now, just return success since we don't have a real user management system
      const newUser = {
        id: `user_${Date.now()}`,
        firstName,
        lastName,
        email,
        role,
        status: 'active',
        createdAt: new Date()
      };
      
      res.json({ 
        message: "User created successfully", 
        user: newUser 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { firstName, lastName, email, role, status, password } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // For now, just return success since we don't have a real user management system
      const updatedUser = {
        id,
        firstName,
        lastName,
        email,
        role,
        status: status || 'active',
        updatedAt: new Date(),
        ...(password && { passwordUpdated: true }) // Only include if password was provided
      };
      
      res.json({ 
        message: "User updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === req.session.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      res.json({ 
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Toggle user status (admin only)
  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      res.json({ 
        message: "User status updated successfully",
        user: { id, status }
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-orders', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get('/api/dashboard/today-appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const appointments = await storage.getTodayAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  // Customer routes
  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        salesPersonId: userId,
      });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const salesPersonId = userRole === 'admin' ? undefined : userId;
      const customers = await storage.getCustomers(salesPersonId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/nearby', isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const customers = await storage.getNearbyCustomers(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius ? parseFloat(radius as string) : undefined
      );
      res.json(customers);
    } catch (error) {
      console.error("Error fetching nearby customers:", error);
      res.status(500).json({ message: "Failed to fetch nearby customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, updates);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { order, items } = req.body;
      
      const orderData = insertOrderSchema.parse({
        ...order,
        salesPersonId: userId,
      });
      
      const orderItems = z.array(insertOrderItemSchema).parse(items);
      
      const createdOrder = await storage.createOrder(orderData, orderItems);
      res.json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const { status } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (userRole !== 'admin') filters.salesPersonId = userId;
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status, ...updates } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status, updates);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  app.put('/api/orders/:id/items', isAuthenticated, async (req, res) => {
    try {
      const items = z.array(insertOrderItemSchema).parse(req.body);
      await storage.updateOrderItems(req.params.id, items);
      res.json({ message: "Order items updated successfully" });
    } catch (error) {
      console.error("Error updating order items:", error);
      res.status(400).json({ message: "Failed to update order items" });
    }
  });

  // Visit routes
  app.post('/api/visits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const visitData = insertVisitSchema.parse({
        ...req.body,
        salesPersonId: userId,
      });
      const visit = await storage.createVisit(visitData);
      res.json(visit);
    } catch (error) {
      console.error("Error creating visit:", error);
      res.status(400).json({ message: "Failed to create visit" });
    }
  });

  app.get('/api/visits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const { date } = req.query;
      
      const salesPersonId = userRole === 'admin' ? undefined : userId;
      // For admin, if no date specified, get all visits from last 30 days
      let visitDate = date ? new Date(date as string) : undefined;
      if (userRole === 'admin' && !date) {
        visitDate = undefined; // Get all visits for admin
      }
      
      const visits = await storage.getVisits(salesPersonId, visitDate);
      res.json(visits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  app.put('/api/visits/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertVisitSchema.partial().parse(req.body);
      const visit = await storage.updateVisit(req.params.id, updates);
      res.json(visit);
    } catch (error) {
      console.error("Error updating visit:", error);
      res.status(400).json({ message: "Failed to update visit" });
    }
  });

  // Appointment routes
  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        salesPersonId: userId,
      });
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const { date } = req.query;
      
      const salesPersonId = userRole === 'admin' ? undefined : userId;
      const appointmentDate = date ? new Date(date as string) : undefined;
      
      const appointments = await storage.getAppointments(salesPersonId, appointmentDate);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: "Failed to update appointment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
