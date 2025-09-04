import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { orders, invoices, customers, orderItems, products } from "@shared/schema";
import { eq, and, inArray, notInArray } from "drizzle-orm";
import { 
  insertCustomerSchema, 
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertVisitSchema,
  insertAppointmentSchema,
  insertInvoiceSchema,
  insertMailSettingSchema,
  insertMailTemplateSchema,
  type User
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import { sendDeliveryNotification } from "./mailService";

// Extend the session interface to include user
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

// Simple auth middleware for demo
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
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
      const userRole = req.session.user.role;
      
      // Admin, üretim, sevkiyat ve muhasebe personeli tüm verileri görebilir
      // Sadece satış personeli kendi verilerini görebilir
      const canSeeAllData = userRole === 'admin' || userRole === 'Admin' || 
                           userRole === 'production' || userRole === 'production_staff' ||
                           userRole === 'shipping' || userRole === 'shipping_staff' ||
                           userRole === 'accounting' || userRole === 'accounting_staff' ||
                           userRole.includes('Üretim') || userRole.includes('Sevkiyat') || userRole.includes('Muhasebe');
      
      const filterUserId = canSeeAllData ? null : userId;
      const stats = await storage.getDashboardStats(filterUserId);
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

  // Delete customer (cascade delete - removes all related data)
  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      const customerId = req.params.id;
      
      // Check permissions - only admin or the customer's sales person can delete
      if (userRole !== 'admin' && userRole !== 'Admin') {
        // For non-admin users, check if they own this customer
        const customer = await storage.getCustomer(customerId);
        if (!customer || customer.salesPersonId !== req.session.user.id) {
          return res.status(403).json({ message: "Bu müşteriyi silme yetkiniz yok" });
        }
      }
      
      await storage.deleteCustomer(customerId);
      res.json({ message: "Müşteri ve tüm ilişkili verileri başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Müşteri silinirken bir hata oluştu" });
    }
  });

  // Deactivate customer (soft delete - keeps all related data)
  app.patch('/api/customers/:id/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      const customerId = req.params.id;
      
      // Check permissions - only admin or the customer's sales person can deactivate
      if (userRole !== 'admin' && userRole !== 'Admin') {
        // For non-admin users, check if they own this customer
        const customer = await storage.getCustomer(customerId);
        if (!customer || customer.salesPersonId !== req.session.user.id) {
          return res.status(403).json({ message: "Bu müşteriyi pasife alma yetkiniz yok" });
        }
      }
      
      const customer = await storage.deactivateCustomer(customerId);
      res.json({ message: "Müşteri başarıyla pasife alındı", customer });
    } catch (error) {
      console.error("Error deactivating customer:", error);
      res.status(500).json({ message: "Müşteri pasife alınırken bir hata oluştu" });
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

  // CRITICAL: Delivered orders MUST come before /api/orders/:id route!
  app.get('/api/orders/delivered-by-customer', isAuthenticated, async (req, res) => {
    console.log("🚀 ÇALIŞTI: delivered-by-customer endpoint");
    try {
      // Önce faturalaşmış siparişleri tespit et
      const invoicedOrderIds = await db
        .select({ orderId: invoices.orderId })
        .from(invoices);
      
      const invoicedIds = invoicedOrderIds.map(inv => inv.orderId);
      console.log("📋 Toplam faturalaşmış sipariş sayısı:", invoicedIds.length);

      // Müşteriyi de dahil ederek delivered ama faturalaşmamış orderları getir
      const result = await db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
          totalAmount: orders.totalAmount,
          deliveredAt: orders.deliveredAt,
          companyName: customers.companyName,
          customerEmail: customers.email,
          customerPhone: customers.phone
        })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(
          and(
            eq(orders.status, 'delivered'),
            // Faturalaşmamış siparişleri getir
            invoicedIds.length > 0 ? notInArray(orders.id, invoicedIds) : undefined
          )
        );
      
      console.log("📦 Raw delivered orders:", result.length);
      
      if (result.length === 0) {
        return res.json([]);
      }
      
      // Müşteri bazında grupla
      const customerMap = new Map();
      
      for (const order of result) {
        if (!customerMap.has(order.customerId)) {
          customerMap.set(order.customerId, {
            customerId: order.customerId,
            customer: {
              companyName: order.companyName,
              email: order.customerEmail,
              phone: order.customerPhone
            },
            pendingInvoices: [], // Bekleyen irsaliyeler
            totalOrders: 0,
            totalAmount: 0
          });
        }
        
        const customerData = customerMap.get(order.customerId);
        customerData.pendingInvoices.push({
          id: order.orderId,
          orderNumber: order.orderNumber,
          totalAmount: parseFloat(order.totalAmount),
          deliveredAt: order.deliveredAt
        });
        customerData.totalOrders++;
        customerData.totalAmount += parseFloat(order.totalAmount);
      }
      
      const groupedData = Array.from(customerMap.values());
      console.log("✅ SUCCESS: Returning", groupedData.length, "customers with pending invoices");
      res.json(groupedData);
    } catch (error) {
      console.error("❌ ERROR:", error);
      res.status(500).json({ message: "Database error: " + error.message });
    }
  });

  // Müşteri cari hesap detayları - bekleyen irsaliyeler ve kesilmiş faturalar
  app.get('/api/customers/:customerId/account-details', isAuthenticated, async (req, res) => {
    try {
      const { customerId } = req.params;
      console.log("📋 Cari hesap detayları istendi:", customerId);

      // Bekleyen irsaliyeler (delivered ama henüz faturalanmamış)
      const pendingInvoices = await db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          totalAmount: orders.totalAmount,
          deliveredAt: orders.deliveredAt,
          notes: orders.notes
        })
        .from(orders)
        .where(
          and(
            eq(orders.customerId, customerId),
            eq(orders.status, 'delivered')
          )
        );

      // Her irsaliye için ürün detaylarını getir
      const pendingWithDetails = await Promise.all(
        pendingInvoices.map(async (invoice) => {
          const items = await db
            .select({
              id: orderItems.id,
              productId: orderItems.productId,
              productName: products.name,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
              totalPrice: orderItems.totalPrice,
              unit: products.unit
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, invoice.orderId));

          return {
            ...invoice,
            items
          };
        })
      );

      // Kesilmiş faturalar
      const existingInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.customerId, customerId));

      console.log("✅ Cari hesap:", {
        pendingCount: pendingWithDetails.length,
        existingCount: existingInvoices.length
      });

      res.json({
        customerId,
        pendingInvoices: pendingWithDetails,
        existingInvoices
      });

    } catch (error) {
      console.error("❌ Cari hesap detay hatası:", error);
      res.status(500).json({ message: "Cari hesap detayları alınamadı" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { customerId, totalAmount, status, notes, items } = req.body;
      
      // customerId kontrolü
      if (!customerId) {
        console.error('❌ Customer ID is missing!');
        return res.status(400).json({ message: "Müşteri seçimi gerekli" });
      }
      
      // Basit order oluşturma
      const orderData = {
        customerId,
        totalAmount: totalAmount?.toString() || '0',
        status: status || 'pending',
        notes: notes || '',
        salesPersonId: userId,
      };
      
      // Create order first to get orderId
      const createdOrder = await storage.createOrder(orderData, []);
      
      // Prepare items for order creation with orderId
      const orderItems = Array.isArray(items) ? items.map((item: any) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: item.unitPrice?.toString() || '0',
        totalPrice: item.totalPrice?.toString() || '0',
      })) : [];
      
      // Update order with items if any exist
      if (orderItems.length > 0) {
        await storage.updateOrderItems(createdOrder.id, orderItems);
      }
      
      res.json({ success: true, order: createdOrder });
    } catch (error) {
      console.error("Sipariş oluşturma hatası:", error);
      res.status(400).json({ message: "Sipariş oluşturulamadı" });
    }
  });


  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const { status } = req.query;
      
      console.log(`📋 Orders request - User: ${userId}, Role: ${userRole}, Status filter: ${status}`);
      
      const filters: any = {};
      if (status) filters.status = status;
      
      // Admin, üretim, sevkiyat ve muhasebe personeli tüm siparişleri görebilir
      // Sadece satış personeli kendi siparişlerini görebilir
      if (userRole !== 'admin' && userRole !== 'Admin' && 
          userRole !== 'production' && userRole !== 'production_staff' &&
          userRole !== 'shipping' && userRole !== 'shipping_staff' &&
          userRole !== 'accounting' && userRole !== 'accounting_staff' &&
          !userRole.includes('Üretim') && !userRole.includes('Sevkiyat') && !userRole.includes('Muhasebe')) {
        filters.salesPersonId = userId;
        console.log(`🔒 Filtering orders by salesPersonId: ${userId}`);
      } else {
        console.log(`👤 User can see all orders - Role: ${userRole}`);
      }
      
      const orders = await storage.getOrders(filters);
      console.log(`📊 Found ${orders.length} orders for user ${userId}`);
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
      
      // Eğer sipariş "delivered" durumuna geçtiyse, müşteriye mail gönder
      if (status === 'delivered') {
        console.log(`📧 Sending delivery notification for order: ${req.params.id}`);
        try {
          await sendDeliveryNotification(req.params.id);
          console.log(`✅ Delivery notification sent successfully for order: ${req.params.id}`);
        } catch (mailError) {
          console.error(`❌ Failed to send delivery notification for order ${req.params.id}:`, mailError);
          // Mail gönderimi başarısız olsa bile sipariş durumu güncellensin
        }
      }
      
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

  // Today's appointments for sales staff
  app.get('/api/appointments/today/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      const date = req.params.date;
      
      const salesPersonId = userRole === 'admin' ? undefined : userId;
      const appointmentDate = new Date(date);
      
      const appointments = await storage.getAppointments(salesPersonId, appointmentDate);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      res.status(500).json({ message: "Failed to fetch today's appointments" });
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

  // Invoice routes
  app.post('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  // Toplu faturalama endpoint'i
  app.post('/api/invoices/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const { customerId, orderIds, shippingAddress, notes } = req.body;
      
      console.log("🧾 Toplu faturalama başlatılıyor:", { customerId, orderIds: orderIds?.length });
      
      if (!customerId || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "customerId ve orderIds gerekli" });
      }

      // Müşteri siparişlerini kontrol et
      const customerOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.customerId, customerId),
            eq(orders.status, 'delivered'),
            inArray(orders.id, orderIds)
          )
        );

      if (customerOrders.length === 0) {
        return res.status(400).json({ message: "Bu müşteriye ait teslim edilmiş sipariş bulunamadı" });
      }

      console.log("✅ Bulundu:", customerOrders.length, "teslim edilmiş sipariş");

      // Toplam tutarı hesapla
      const totalAmount = customerOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

      // Fatura numarası oluştur (toplu faturalar için özel format)
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = timestamp.toISOString().slice(11, 19).replace(/:/g, '');
      const bulkInvoiceNumber = `BULK-${dateStr}-${timeStr}`;

      console.log("💰 Toplam tutar:", totalAmount, "TL");
      console.log("📋 Fatura numarası:", bulkInvoiceNumber);

      // İlk sipariş referans olarak alınır (aslında birden fazla siparişi temsil eder)
      const referenceOrder = customerOrders[0];

      // Toplu fatura oluştur
      const bulkInvoice = {
        orderId: referenceOrder.id, // Referans sipariş
        customerId: customerId,
        status: 'generated',
        shippingAddress: shippingAddress || referenceOrder.deliveryAddress || 'Adres belirtilmedi',
        notes: notes || `Toplu fatura - ${customerOrders.length} sipariş birleştirildi: ${orderIds.join(', ')}`,
        invoiceNumber: bulkInvoiceNumber
      };

      // Database'e kaydet
      const [savedInvoice] = await db
        .insert(invoices)
        .values(bulkInvoice)
        .returning();

      console.log("🎉 Toplu fatura oluşturuldu:", savedInvoice.invoiceNumber);

      // Response data
      const response = {
        ...savedInvoice,
        orderCount: customerOrders.length,
        totalAmount: totalAmount,
        orderIds: orderIds,
        orders: customerOrders
      };

      res.json(response);

    } catch (error) {
      console.error("❌ Toplu faturalama hatası:", error);
      res.status(500).json({ message: "Toplu faturalama başarısız: " + error.message });
    }
  });

  // Akıllı toplu faturalama - aynı ürünleri toplar ve KDV hesaplar
  app.post('/api/invoices/bulk-smart', isAuthenticated, async (req: any, res) => {
    try {
      const { customerId, orderIds, selectedOrders, vatRate = 20, customInvoiceNumber } = req.body;
      
      console.log("🧾 Akıllı toplu faturalama:", { customerId, orderCount: orderIds?.length });
      
      // Seçilen siparişlerdeki tüm ürünleri getir
      const allItems = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          unit: products.unit
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds));

      console.log("📦 Toplam ürün satırı:", allItems.length);

      // Aynı ürünleri grupla ve topla
      const productGroups = new Map();
      
      for (const item of allItems) {
        const key = item.productId;
        if (!productGroups.has(key)) {
          productGroups.set(key, {
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice),
            totalQuantity: 0,
            totalAmount: 0
          });
        }
        
        const group = productGroups.get(key);
        group.totalQuantity += item.quantity;
        group.totalAmount += parseFloat(item.totalPrice);
      }

      const groupedProducts = Array.from(productGroups.values());
      console.log("📊 Gruplandırılmış ürünler:", groupedProducts.length);

      // Toplam tutarları hesapla - dinamik KDV oranı
      const subtotal = groupedProducts.reduce((sum, product) => sum + product.totalAmount, 0);
      const kdvRate = vatRate / 100; // Frontend'den %20 olarak gelirse 0.20'ye çevir
      const kdvAmount = subtotal * kdvRate;
      const totalWithKdv = subtotal + kdvAmount;

      console.log("💰 Fatura özeti:", { 
        subtotal: subtotal.toFixed(2), 
        kdvOrani: `%${vatRate}`,
        kdv: kdvAmount.toFixed(2), 
        toplam: totalWithKdv.toFixed(2) 
      });

      // Fatura numarası oluştur - benzersizlik kontrollü
      let finalInvoiceNumber;
      if (customInvoiceNumber && customInvoiceNumber.trim()) {
        let baseNumber = customInvoiceNumber.trim();
        console.log("📋 Manuel fatura numarası kontrol ediliyor:", baseNumber);
        
        // Aynı numara var mı kontrol et
        let counter = 0;
        let candidateNumber = baseNumber;
        
        while (true) {
          const existingInvoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.invoiceNumber, candidateNumber))
            .limit(1);
            
          if (existingInvoice.length === 0) {
            // Bu numara mevcut değil, kullanabiliriz
            finalInvoiceNumber = candidateNumber;
            if (counter > 0) {
              console.log("🔄 Benzersiz numara oluşturuldu:", finalInvoiceNumber);
            } else {
              console.log("✅ Manuel numara benzersiz:", finalInvoiceNumber);
            }
            break;
          }
          
          // Bu numara mevcut, sıralama ekle
          counter++;
          candidateNumber = `${baseNumber}-${counter}`;
          console.log("⚠️ Numara mevcut, deneniyor:", candidateNumber);
        }
      } else {
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = timestamp.toISOString().slice(11, 19).replace(/:/g, '');
        finalInvoiceNumber = `SMART-${dateStr}-${timeStr}`;
        console.log("🔄 Otomatik fatura numarası oluşturuldu:", finalInvoiceNumber);
      }

      // Fatura detaylarını notes'a ekle
      const invoiceDetails = {
        orderIds: orderIds,
        orderCount: orderIds.length,
        groupedProducts: groupedProducts,
        subtotal: subtotal,
        kdvRate: kdvRate,
        kdvAmount: kdvAmount,
        totalWithKdv: totalWithKdv
      };

      // Toplu fatura oluştur
      const bulkInvoice = {
        orderId: orderIds[0], // Referans sipariş
        customerId: customerId,
        status: 'generated',
        shippingAddress: selectedOrders[0]?.deliveryAddress || 'Adres belirtilmedi',
        notes: `Akıllı toplu fatura - ${orderIds.length} sipariş - ${groupedProducts.length} ürün grubu - %${vatRate} KDV dahil: ${totalWithKdv.toFixed(2)} TL`,
        invoiceNumber: finalInvoiceNumber
      };

      // Database'e kaydet
      const [savedInvoice] = await db
        .insert(invoices)
        .values(bulkInvoice)
        .returning();

      console.log("🎉 Akıllı toplu fatura oluşturuldu:", savedInvoice.invoiceNumber);

      // Response
      const response = {
        ...savedInvoice,
        orderCount: orderIds.length,
        invoiceDetails: invoiceDetails,
        success: true
      };

      res.json(response);

    } catch (error) {
      console.error("❌ Akıllı toplu faturalama hatası:", error);
      res.status(500).json({ message: "Akıllı faturalama başarısız: " + error.message });
    }
  });

  app.get('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const filters = status && status !== 'all' ? { status: status as string } : undefined;
      const invoices = await storage.getInvoices(filters);
      
      console.log("📋 Fetching invoices, count:", invoices.length);
      if (invoices.length > 0) {
        console.log("🔍 Sample invoice customer info:", {
          hasCustomer: !!invoices[0].customer,
          customerInfo: invoices[0].customer
        });
      }
      
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.patch('/api/invoices/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const updates = status === 'shipped' ? { shippedAt: new Date() } : 
                      status === 'delivered' ? { deliveredAt: new Date() } : {};
      const invoice = await storage.updateInvoiceStatus(req.params.id, status, updates);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(400).json({ message: "Failed to update invoice status" });
    }
  });

  // İrsaliye e-posta gönderme endpoint'i (mailto: link yaklaşımı)
  app.post('/api/orders/send-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const { to, subject, message, orderHtml } = req.body;
      
      // Basit mailto: link yaklaşımı kullanacağız
      // Frontend'de window.open ile kullanıcının varsayılan e-posta uygulamasını açacağız
      const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message || 'İrsaliye ektedir.')}`;
      
      res.json({ 
        success: true, 
        mailtoLink,
        message: 'E-posta linki hazırlandı' 
      });
    } catch (error) {
      console.error('Mail link error:', error);
      res.status(500).json({ message: 'E-posta linki oluşturulurken hata oluştu' });
    }
  });

  // Mail Settings routes
  app.get('/api/mail-settings/smtp', isAuthenticated, async (req: any, res) => {
    try {
      const setting = await storage.getMailSetting('smtp_settings');
      if (setting) {
        const smtpData = JSON.parse(setting.settingValue || '{}');
        res.json(smtpData);
      } else {
        res.json({});
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      res.status(500).json({ message: 'Failed to fetch SMTP settings' });
    }
  });

  app.post('/api/mail-settings/smtp', isAuthenticated, async (req: any, res) => {
    try {
      const settingData = {
        settingName: 'smtp_settings',
        settingValue: JSON.stringify(req.body),
        isActive: true
      };
      await storage.setMailSetting(settingData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      res.status(500).json({ message: 'Failed to save SMTP settings' });
    }
  });

  // Mail Templates routes
  app.get('/api/mail-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getMailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching mail templates:', error);
      res.status(500).json({ message: 'Failed to fetch mail templates' });
    }
  });

  app.get('/api/mail-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.getMailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching mail template:', error);
      res.status(500).json({ message: 'Failed to fetch mail template' });
    }
  });

  app.post('/api/mail-templates', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMailTemplateSchema.parse(req.body);
      const template = await storage.createMailTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error('Error creating mail template:', error);
      res.status(500).json({ message: 'Failed to create mail template' });
    }
  });

  app.put('/api/mail-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateMailTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error) {
      console.error('Error updating mail template:', error);
      res.status(500).json({ message: 'Failed to update mail template' });
    }
  });

  app.delete('/api/mail-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMailTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting mail template:', error);
      res.status(500).json({ message: 'Failed to delete mail template' });
    }
  });

  // Mail gönderme endpoint - manuel mail gönderimi için
  app.post('/api/orders/:id/send-delivery-email', isAuthenticated, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      
      // Sipariş detaylarını al
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Müşteri email kontrolü
      if (!order.customer.email) {
        return res.status(400).json({ message: 'Customer email not found' });
      }

      // Mail gönderimi
      const success = await sendDeliveryNotification(orderId);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Delivery notification sent successfully',
          customerEmail: order.customer.email
        });
      } else {
        res.status(500).json({ message: 'Failed to send delivery notification' });
      }
    } catch (error) {
      console.error('Error sending delivery email:', error);
      res.status(500).json({ message: 'Failed to send delivery email' });
    }
  });


  // Get orders ready for shipping (production_ready status)
  app.get('/api/orders/ready-for-shipping', isAuthenticated, async (req, res) => {
    try {
      const readyOrders = await storage.getOrders({ status: 'production_ready' });
      res.json(readyOrders);
    } catch (error) {
      console.error("Error fetching ready-for-shipping orders:", error);
      res.status(500).json({ message: "Failed to fetch ready-for-shipping orders" });
    }
  });

  // CARİ HESAP API'LERİ

  // Müşteri ödemelerini getir
  app.get('/api/customers/:customerId/payments', isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments(req.params.customerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Yeni ödeme ekle
  app.post('/api/customers/:customerId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const paymentData = {
        ...req.body,
        customerId: req.params.customerId,
        createdBy: req.session.user.id
      };
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  // Müşteri cari hesap hareketlerini getir
  app.get('/api/customers/:customerId/transactions', isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getAccountTransactions(req.params.customerId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Müşteri cari hesap özeti
  app.get('/api/customers/:customerId/account-summary', isAuthenticated, async (req, res) => {
    try {
      const summary = await storage.getCustomerAccountSummary(req.params.customerId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching account summary:", error);
      res.status(500).json({ message: "Failed to fetch account summary" });
    }
  });

  // Vadesi geçmiş ödemeleri güncelle (admin)
  app.post('/api/payments/update-overdue', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.session.user.role;
      if (userRole !== 'admin' && userRole !== 'Admin') {
        return res.status(403).json({ message: "Bu işlem için admin yetkisi gerekli" });
      }
      
      await storage.updateOverduePayments();
      res.json({ message: "Vadesi geçmiş ödemeler güncellendi" });
    } catch (error) {
      console.error("Error updating overdue payments:", error);
      res.status(500).json({ message: "Failed to update overdue payments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
