import {
  users,
  customers,
  products,
  orders,
  orderItems,
  visits,
  appointments,
  invoices,
  mailSettings,
  mailTemplates,
  payments,
  accountTransactions,
  deliverySlips,
  deliverySlipItems,
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
  type InsertMailSetting,
  type MailSetting,
  type InsertMailTemplate,
  type MailTemplate,
  type InsertPayment,
  type Payment,
  type InsertAccountTransaction,
  type AccountTransaction,
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
  deleteCustomer(id: string): Promise<void>;
  deactivateCustomer(id: string): Promise<Customer>;
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
    pendingOrders: number;
    productionOrders: number;
    shippingOrders: number;
    deliveredOrders: number;
  }>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(filters?: { status?: string }): Promise<InvoiceWithDetails[]>;
  updateInvoiceStatus(id: string, status: string, updates?: Partial<InsertInvoice>): Promise<Invoice>;
  
  // Recent activities
  getRecentOrders(limit?: number): Promise<OrderWithDetails[]>;
  getTodayAppointments(salesPersonId?: string): Promise<AppointmentWithDetails[]>;
  
  // Mail Settings operations
  getMailSetting(settingName: string): Promise<MailSetting | undefined>;
  setMailSetting(setting: InsertMailSetting): Promise<MailSetting>;
  
  // Mail Templates operations
  getMailTemplates(): Promise<MailTemplate[]>;
  getMailTemplate(id: string): Promise<MailTemplate | undefined>;
  createMailTemplate(template: InsertMailTemplate): Promise<MailTemplate>;
  updateMailTemplate(id: string, updates: Partial<InsertMailTemplate>): Promise<MailTemplate>;
  deleteMailTemplate(id: string): Promise<void>;
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
    let whereConditions = [
      sql`${customers.status} != 'deleted'`,
      sql`${customers.status} != 'inactive'`
    ];
    
    if (salesPersonId) {
      whereConditions.push(eq(customers.salesPersonId, salesPersonId));
    }

    const results = await db
      .select()
      .from(customers)
      .leftJoin(users, eq(customers.salesPersonId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(customers.createdAt));

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

  async deleteCustomer(id: string): Promise<void> {
    // Cascade delete - remove all related data first, then the customer
    
    // Delete order items for orders belonging to this customer
    await db.delete(orderItems).where(
      sql`${orderItems.orderId} IN (SELECT id FROM ${orders} WHERE ${orders.customerId} = ${id})`
    );
    
    // Delete orders
    await db.delete(orders).where(eq(orders.customerId, id));
    
    // Delete visits
    await db.delete(visits).where(eq(visits.customerId, id));
    
    // Delete appointments
    await db.delete(appointments).where(eq(appointments.customerId, id));
    
    // Finally delete the customer
    await db.delete(customers).where(eq(customers.id, id));
  }

  async deactivateCustomer(id: string): Promise<Customer> {
    // Soft delete - just mark as inactive, keep all related data
    const [updated] = await db
      .update(customers)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async updateCustomerStatus(id: string, status: 'active' | 'potential' | 'inactive'): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ status, updatedAt: new Date() })
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
          sql`${customers.longitude} IS NOT NULL`,
          sql`${customers.status} != 'deleted'`
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

  // Order operations - Basit ve güvenli
  async createOrder(order: InsertOrder, items: InsertOrderItem[] = []): Promise<OrderWithDetails> {
    return await db.transaction(async (tx) => {
      // Order number oluştur
      const orderNumber = `SIP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      // Order'ı oluştur
      const [createdOrder] = await tx
        .insert(orders)
        .values({ ...order, orderNumber })
        .returning();

      // Items varsa ekle
      if (items && items.length > 0) {
        const orderItemsWithOrderId = items.map(item => ({
          ...item,
          orderId: createdOrder.id,
        }));
        
        await tx
          .insert(orderItems)
          .values(orderItemsWithOrderId);
      }

      // Full order details ile return et
      const fullOrder = await this.getOrderWithDetails(createdOrder.id, tx);
      return fullOrder!;
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
      .leftJoin(users, eq(orders.salesPersonId, users.id));

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status as any));
    }
    if (filters?.salesPersonId) {
      conditions.push(eq(orders.salesPersonId, filters.salesPersonId));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }

    query = query.orderBy(desc(orders.createdAt)) as any;

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
            product: item.products,
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
      customer: row.customers || { id: 'unknown', companyName: 'Bilinmeyen Müşteri', contactPerson: 'N/A' },
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

    // Order status breakdown
    let pendingOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));
    
    let productionOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('production', 'production_ready')`);
    
    let shippingOrdersQuery = db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'shipping'));
    
    let deliveredOrdersForStatsQuery = db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    if (userId) {
      pendingOrdersQuery = pendingOrdersQuery.where(eq(orders.salesPersonId, userId));
      productionOrdersQuery = productionOrdersQuery.where(eq(orders.salesPersonId, userId));
      shippingOrdersQuery = shippingOrdersQuery.where(eq(orders.salesPersonId, userId));
      deliveredOrdersForStatsQuery = deliveredOrdersForStatsQuery.where(eq(orders.salesPersonId, userId));
    }

    const [pendingResult] = await pendingOrdersQuery;
    const [productionResult] = await productionOrdersQuery;
    const [shippingResult] = await shippingOrdersQuery;
    const [deliveredStatsResult] = await deliveredOrdersForStatsQuery;

    return {
      dailyVisits: dailyVisitsResult.count,
      activeOrders: activeOrdersResult.count,
      monthlySales: parseFloat(monthlySalesResult.total || '0'),
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      pendingOrders: pendingResult.count,
      productionOrders: productionResult.count,
      shippingOrders: shippingResult.count,
      deliveredOrders: deliveredStatsResult.count,
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
            product: item.products,
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

  // Invoice operations
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Generate invoice number
    const timestamp = Date.now().toString();
    const invoiceNumber = `INV-${timestamp.slice(-6)}`;
    
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        invoiceNumber,
      })
      .returning();
    return invoice;
  }

  async getInvoices(filters?: { status?: string }): Promise<InvoiceWithDetails[]> {
    let query = db
      .select()
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id));

    if (filters?.status) {
      query = query.where(eq(invoices.status, filters.status as any)) as any;
    }

    query = query.orderBy(desc(invoices.createdAt)) as any;

    const invoicesData = await query;
    
    return invoicesData.map((row: any) => ({
      ...row.invoices,
      order: row.orders!,
      customer: row.customers!,
    }));
  }

  async updateInvoiceStatus(id: string, status: string, updates?: Partial<InsertInvoice>): Promise<Invoice> {
    const updateData: any = { status, updatedAt: new Date(), ...updates };
    
    const [invoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  // Mail Settings operations
  async getMailSetting(settingName: string): Promise<MailSetting | undefined> {
    const [setting] = await db.select().from(mailSettings).where(eq(mailSettings.settingName, settingName));
    return setting;
  }

  async setMailSetting(settingData: InsertMailSetting): Promise<MailSetting> {
    const [setting] = await db
      .insert(mailSettings)
      .values(settingData)
      .onConflictDoUpdate({
        target: mailSettings.settingName,
        set: {
          ...settingData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  // Mail Templates operations
  async getMailTemplates(): Promise<MailTemplate[]> {
    return await db.select().from(mailTemplates).orderBy(desc(mailTemplates.createdAt));
  }

  async getMailTemplate(id: string): Promise<MailTemplate | undefined> {
    const [template] = await db.select().from(mailTemplates).where(eq(mailTemplates.id, id));
    return template;
  }

  async createMailTemplate(templateData: InsertMailTemplate): Promise<MailTemplate> {
    const [template] = await db.insert(mailTemplates).values(templateData).returning();
    return template;
  }

  async updateMailTemplate(id: string, updates: Partial<InsertMailTemplate>): Promise<MailTemplate> {
    const [template] = await db
      .update(mailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mailTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMailTemplate(id: string): Promise<void> {
    await db.delete(mailTemplates).where(eq(mailTemplates.id, id));
  }

  // Ödeme yönetimi
  async getPayments(customerId?: string): Promise<Payment[]> {
    let query = db.select().from(payments);
    if (customerId) {
      query = query.where(eq(payments.customerId, customerId)) as any;
    }
    return query.orderBy(desc(payments.paymentDate));
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    
    // Ödeme kaydı için cari hesap hareketini oluştur
    await this.createAccountTransaction({
      customerId: payment.customerId,
      paymentId: payment.id,
      type: "credit", // Ödeme = Alacak
      amount: payment.amount,
      description: `Ödeme: ${payment.paymentMethod} - ${payment.description || 'Ödeme'}`,
      transactionDate: payment.paymentDate
    });

    return payment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Cari hesap hareketleri
  async getAccountTransactions(customerId: string): Promise<AccountTransaction[]> {
    return db
      .select()
      .from(accountTransactions)
      .where(eq(accountTransactions.customerId, customerId))
      .orderBy(desc(accountTransactions.transactionDate));
  }

  async createAccountTransaction(transactionData: InsertAccountTransaction): Promise<AccountTransaction> {
    const [transaction] = await db.insert(accountTransactions).values(transactionData).returning();
    return transaction;
  }

  // Müşteri cari hesap özeti
  async getCustomerAccountSummary(customerId: string) {
    // Toplam borç (faturalar)
    const totalDebit = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${accountTransactions.amount} AS DECIMAL)), 0)` })
      .from(accountTransactions)
      .where(and(
        eq(accountTransactions.customerId, customerId),
        eq(accountTransactions.type, "debit")
      ));

    // Toplam alacak (ödemeler)
    const totalCredit = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${accountTransactions.amount} AS DECIMAL)), 0)` })
      .from(accountTransactions)
      .where(and(
        eq(accountTransactions.customerId, customerId),
        eq(accountTransactions.type, "credit")
      ));

    // Vadesi geçmiş ödemeler
    const overdue = await db
      .select()
      .from(payments)
      .where(and(
        eq(payments.customerId, customerId),
        eq(payments.status, "overdue")
      ));

    const balance = Number(totalDebit[0]?.total || 0) - Number(totalCredit[0]?.total || 0);

    return {
      totalDebit: Number(totalDebit[0]?.total || 0),
      totalCredit: Number(totalCredit[0]?.total || 0),
      balance, // Pozitif = borçlu, Negatif = alacaklı
      overdueCount: overdue.length,
      overduePayments: overdue
    };
  }

  // Vadesi geçmiş ödemeleri güncelle
  async updateOverduePayments(): Promise<void> {
    const today = new Date();
    await db
      .update(payments)
      .set({ status: "overdue" })
      .where(and(
        eq(payments.status, "pending"),
        sql`${payments.dueDate} < ${today}`
      ));
  }

  // Delivery Slip işlemleri
  async createDeliverySlipForOrder(orderId: string): Promise<void> {
    console.log(`🚚 Creating delivery slip for order: ${orderId}`);
    
    // Siparişi al
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Bu sipariş için zaten irsaliye var mı kontrol et
    const existingSlips = await db
      .select()
      .from(deliverySlips)
      .where(eq(deliverySlips.orderId, orderId));
    
    if (existingSlips.length > 0) {
      console.log(`⚠️ Delivery slip already exists for order: ${orderId}`);
      return;
    }
    
    // İrsaliye numarası oluştur
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const deliverySlipNumber = `IRS-${dateStr}-${timeStr}`;
    
    // İrsaliye oluştur
    const [newSlip] = await db
      .insert(deliverySlips)
      .values({
        deliverySlipNumber,
        orderId,
        customerId: order.customerId,
        status: 'pending' as const,
        deliveryAddress: order.customer?.address || 'Adres belirtilmedi',
        notes: 'Sevkiyat sırasında oluşturulan irsaliye',
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // İrsaliye kalemlerini oluştur
    if (order.items && order.items.length > 0) {
      const deliverySlipItemsData = order.items.map((item: any) => ({
        deliverySlipId: newSlip.id,
        productId: item.productId,
        productName: item.productName || item.product?.name,
        quantity: item.quantity,
        unit: item.unit || item.product?.unit || 'adet',
        unitPrice: String(item.unitPrice || '0'),
        totalPrice: String(item.totalPrice || '0'),
        deliveredQuantity: item.quantity, // Başlangıçta tüm miktar teslim edilecek
      }));
      
      await db.insert(deliverySlipItems).values(deliverySlipItemsData);
    }
    
    console.log(`✅ Delivery slip created: ${deliverySlipNumber} for order: ${orderId}`);
  }

  async updateDeliverySlipSignature(orderId: string, signatureData: {
    customerSignature?: string;
    recipientName?: string;
  }): Promise<void> {
    console.log(`🔄 Updating delivery slip signature for order: ${orderId}`);
    
    // Bu siparişe ait irsaliyeleri bul
    const existingSlips = await db
      .select()
      .from(deliverySlips)
      .where(eq(deliverySlips.orderId, orderId));
    
    if (existingSlips.length === 0) {
      console.log(`⚠️ No delivery slips found for order: ${orderId}`);
      return;
    }
    
    // Tüm irsaliyeleri güncelle (genelde tek tane olur ama güvenlik için)
    for (const slip of existingSlips) {
      const updateData: any = {
        updatedAt: new Date(),
        status: 'delivered',
        deliveredAt: new Date(),
      };
      
      if (signatureData.customerSignature) {
        updateData.customerSignature = signatureData.customerSignature;
      }
      
      if (signatureData.recipientName) {
        updateData.recipientName = signatureData.recipientName;
      }
      
      await db
        .update(deliverySlips)
        .set(updateData)
        .where(eq(deliverySlips.id, slip.id));
      
      console.log(`✅ Updated delivery slip ${slip.deliverySlipNumber} for order: ${orderId}`);
    }
  }
}

export const storage = new DatabaseStorage();
