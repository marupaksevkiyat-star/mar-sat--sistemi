import {
  users,
  customers,
  products,
  orders,
  orderItems,
  visits,
  appointments,
  invoices,
  type User,
  type UpsertUser,
  type InsertCustomer,
  type Customer,
  type CustomerWithSalesPerson,
  type InsertProduct,
  type Product,
  type InsertOrder,
  type Order,
  type OrderWithDetails,
  type InsertOrderItem,
  type OrderItem,
  type InsertVisit,
  type Visit,
  type VisitWithDetails,
  type InsertAppointment,
  type Appointment,
  type AppointmentWithDetails,
  type InsertInvoice,
  type Invoice,
  type InvoiceWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, sum, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: string): Promise<CustomerWithSalesPerson | undefined>;
  getCustomers(salesPersonId?: string): Promise<CustomerWithSalesPerson[]>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer>;
  getNearbyCustomers(lat: number, lng: number, radiusKm?: number): Promise<CustomerWithSalesPerson[]>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  getOrders(filters?: { status?: string; salesPersonId?: string }): Promise<OrderWithDetails[]>;
  updateOrderStatus(id: string, status: string, updates?: Partial<InsertOrder>): Promise<Order>;
  updateOrderItems(orderId: string, items: InsertOrderItem[]): Promise<void>;
  
  // Visit operations
  createVisit(visit: InsertVisit): Promise<Visit>;
  getVisits(salesPersonId?: string, date?: Date): Promise<VisitWithDetails[]>;
  updateVisit(id: string, updates: Partial<InsertVisit>): Promise<Visit>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(salesPersonId?: string, date?: Date): Promise<AppointmentWithDetails[]>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  
  // Dashboard statistics
  getDashboardStats(userId?: string): Promise<{
    dailyVisits: number;
    activeOrders: number;
    monthlySales: number;
    deliveryRate: number;
  }>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(filters?: { status?: string }): Promise<InvoiceWithDetails[]>;
  updateInvoiceStatus(id: string, status: string, updates?: Partial<InsertInvoice>): Promise<Invoice>;
  
  // Recent activities
  getRecentOrders(limit?: number): Promise<OrderWithDetails[]>;
  getTodayAppointments(salesPersonId?: string): Promise<AppointmentWithDetails[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async getCustomer(id: string): Promise<CustomerWithSalesPerson | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .leftJoin(users, eq(customers.salesPersonId, users.id))
      .where(eq(customers.id, id));

    if (!customer.customers) return undefined;

    return {
      ...customer.customers,
      salesPerson: customer.users || undefined,
    };
  }

  async getCustomers(salesPersonId?: string): Promise<CustomerWithSalesPerson[]> {
    const query = db
      .select()
      .from(customers)
      .leftJoin(users, eq(customers.salesPersonId, users.id))
      .orderBy(desc(customers.createdAt));

    if (salesPersonId) {
      query.where(eq(customers.salesPersonId, salesPersonId));
    }

    const results = await query;
    return results.map(row => ({
      ...row.customers,
      salesPerson: row.users || undefined,
    }));
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async getNearbyCustomers(lat: number, lng: number, radiusKm: number = 5): Promise<CustomerWithSalesPerson[]> {
    // Simplified distance calculation - in production, use PostGIS
    const results = await db
      .select()
      .from(customers)
      .leftJoin(users, eq(customers.salesPersonId, users.id))
      .where(
        and(
          sql`${customers.latitude} IS NOT NULL`,
          sql`${customers.longitude} IS NOT NULL`
        )
      );

    return results
      .filter(row => {
        if (!row.customers.latitude || !row.customers.longitude) return false;
        const customerLat = parseFloat(row.customers.latitude);
        const customerLng = parseFloat(row.customers.longitude);
        const distance = this.calculateDistance(lat, lng, customerLat, customerLng);
        return distance <= radiusKm;
      })
      .map(row => ({
        ...row.customers,
        salesPerson: row.users || undefined,
      }));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails> {
    return await db.transaction(async (tx) => {
      // Generate order number
      const orderNumber = `SIP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      // Create order
      const [createdOrder] = await tx
        .insert(orders)
        .values({ ...order, orderNumber })
        .returning();

      // Create order items
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId: createdOrder.id,
      }));
      
      const createdItems = await tx
        .insert(orderItems)
        .values(orderItemsWithOrderId)
        .returning();

      // Get full order details
      const result = await this.getOrderWithDetails(createdOrder.id, tx);
      return result as OrderWithDetails;
    });
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    return await this.getOrderWithDetails(id);
  }

  private async getOrderWithDetails(id: string, tx?: any): Promise<OrderWithDetails | undefined> {
    const dbQuery = tx || db;
    
    const [orderData] = await dbQuery
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.salesPersonId, users.id))
      .where(eq(orders.id, id));

    if (!orderData) {
      return undefined;
    }

    const items = await dbQuery
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...orderData.orders,
      customer: orderData.customers!,
      salesPerson: orderData.users!,
      items: items.map((item: any) => ({
        ...item.order_items,
        product: item.products!,
      })),
    };
  }

  async getOrders(filters?: { status?: string; salesPersonId?: string }): Promise<OrderWithDetails[]> {
    let query = db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.salesPersonId, users.id))
      .orderBy(desc(orders.createdAt));

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status as any)) as any;
    }
    if (filters?.salesPersonId) {
      query = query.where(eq(orders.salesPersonId, filters.salesPersonId)) as any;
    }

    const ordersData = await query;
    
    // Get items for each order
    const ordersWithItems = await Promise.all(
      ordersData.map(async (orderData) => {
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderData.orders.id));

        return {
          ...orderData.orders,
          customer: orderData.customers!,
          salesPerson: orderData.users!,
          items: items.map((item: any) => ({
            ...item.order_items,
            product: item.products!,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async updateOrderStatus(id: string, status: string, updates?: Partial<InsertOrder>): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date(), ...updates };
    
    // Set timestamps based on status
    if (status === 'production') {
      updateData.productionStartedAt = new Date();
    } else if (status === 'production_ready') {
      updateData.productionCompletedAt = new Date();
    } else if (status === 'shipping') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderItems(orderId: string, items: InsertOrderItem[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete existing items
      await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
      
      // Insert new items
      if (items.length > 0) {
        await tx.insert(orderItems).values(items.map(item => ({
          ...item,
          orderId,
        })));
      }
    });
  }

  // Visit operations
  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [created] = await db.insert(visits).values(visit).returning();
    return created;
  }

  async getVisits(salesPersonId?: string, date?: Date): Promise<VisitWithDetails[]> {
    let query = db
      .select()
      .from(visits)
      .leftJoin(customers, eq(visits.customerId, customers.id))
      .leftJoin(users, eq(visits.salesPersonId, users.id))
      .leftJoin(orders, eq(visits.orderId, orders.id))
      .orderBy(desc(visits.visitDate));

    if (salesPersonId) {
      query = query.where(eq(visits.salesPersonId, salesPersonId));
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          gte(visits.visitDate, startOfDay),
          lte(visits.visitDate, endOfDay)
        )
      );
    }

    const results = await query;
    return results.map(row => ({
      ...row.visits,
      customer: row.customers || undefined,
      salesPerson: row.users!,
      order: row.orders || undefined,
    }));
  }

  async updateVisit(id: string, updates: Partial<InsertVisit>): Promise<Visit> {
    const [updated] = await db
      .update(visits)
      .set(updates)
      .where(eq(visits.id, id))
      .returning();
    return updated;
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async getAppointments(salesPersonId?: string, date?: Date): Promise<AppointmentWithDetails[]> {
    let query = db
      .select()
      .from(appointments)
      .leftJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(users, eq(appointments.salesPersonId, users.id))
      .orderBy(appointments.scheduledDate);

    if (salesPersonId) {
      query = query.where(eq(appointments.salesPersonId, salesPersonId));
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          gte(appointments.scheduledDate, startOfDay),
          lte(appointments.scheduledDate, endOfDay)
        )
      );
    }

    const results = await query;
    return results.map(row => ({
      ...row.appointments,
      customer: row.customers!,
      salesPerson: row.users!,
    }));
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set(updates)
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  // Dashboard statistics
  async getDashboardStats(userId?: string): Promise<{
    dailyVisits: number;
    activeOrders: number;
    monthlySales: number;
    deliveryRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Daily visits
    let dailyVisitsQuery = db
      .select({ count: count() })
      .from(visits)
      .where(
        and(
          gte(visits.visitDate, today),
          lte(visits.visitDate, endOfDay)
        )
      );

    if (userId) {
      dailyVisitsQuery = dailyVisitsQuery.where(eq(visits.salesPersonId, userId));
    }

    const [dailyVisitsResult] = await dailyVisitsQuery;

    // Active orders
    let activeOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'production', 'production_ready', 'shipping')`);

    if (userId) {
      activeOrdersQuery = activeOrdersQuery.where(eq(orders.salesPersonId, userId));
    }

    const [activeOrdersResult] = await activeOrdersQuery;

    // Monthly sales
    let monthlySalesQuery = db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfMonth),
          eq(orders.status, 'delivered')
        )
      );

    if (userId) {
      monthlySalesQuery = monthlySalesQuery.where(eq(orders.salesPersonId, userId));
    }

    const [monthlySalesResult] = await monthlySalesQuery;

    // Delivery rate (delivered orders / total orders this month)
    let totalOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth));

    let deliveredOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfMonth),
          eq(orders.status, 'delivered')
        )
      );

    if (userId) {
      totalOrdersQuery = totalOrdersQuery.where(eq(orders.salesPersonId, userId));
      deliveredOrdersQuery = deliveredOrdersQuery.where(eq(orders.salesPersonId, userId));
    }

    const [totalOrdersResult] = await totalOrdersQuery;
    const [deliveredOrdersResult] = await deliveredOrdersQuery;

    const deliveryRate = totalOrdersResult.count > 0 
      ? (deliveredOrdersResult.count / totalOrdersResult.count) * 100 
      : 0;

    return {
      dailyVisits: dailyVisitsResult.count,
      activeOrders: activeOrdersResult.count,
      monthlySales: parseFloat(monthlySalesResult.total || '0'),
      deliveryRate: Math.round(deliveryRate * 10) / 10,
    };
  }

  // Recent activities
  async getRecentOrders(limit: number = 10): Promise<OrderWithDetails[]> {
    const ordersData = await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.salesPersonId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    const ordersWithItems = await Promise.all(
      ordersData.map(async (orderData) => {
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderData.orders.id));

        return {
          ...orderData.orders,
          customer: orderData.customers!,
          salesPerson: orderData.users!,
          items: items.map((item: any) => ({
            ...item.order_items,
            product: item.products!,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async getTodayAppointments(salesPersonId?: string): Promise<AppointmentWithDetails[]> {
    const today = new Date();
    return await this.getAppointments(salesPersonId, today);
  }
}

export const storage = new DatabaseStorage();
