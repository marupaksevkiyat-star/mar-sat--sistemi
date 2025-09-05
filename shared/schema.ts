import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("sales"), // sales, production, shipping, admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: varchar("status").notNull().default("active"), // active, potential, not_interested
  salesPersonId: varchar("sales_person_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  unit: varchar("unit").notNull().default("adet"), // adet, metre, kg
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "production",
  "production_ready",
  "shipping",
  "delivered",
  "cancelled"
]);

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  salesPersonId: varchar("sales_person_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  productionNotes: text("production_notes"),
  deliveryAddress: text("delivery_address"),
  productionStartedAt: timestamp("production_started_at"),
  productionCompletedAt: timestamp("production_completed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  deliveryRecipient: varchar("delivery_recipient"),
  deliverySignature: text("delivery_signature"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Visits table for sales tracking
export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesPersonId: varchar("sales_person_id").notNull().references(() => users.id),
  customerId: varchar("customer_id").references(() => customers.id),
  visitType: varchar("visit_type").notNull(), // new_customer, existing_customer, follow_up
  outcome: varchar("outcome"), // sale, follow_up, not_interested
  notes: text("notes"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  visitDate: timestamp("visit_date").defaultNow(),
  followUpDate: timestamp("follow_up_date"),
  orderId: varchar("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesPersonId: varchar("sales_person_id").notNull().references(() => users.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  scheduledDate: timestamp("scheduled_date").notNull(), // Keep as scheduledDate to match existing DB
  appointmentType: varchar("appointment_type"), // visit, call
  title: varchar("title"),
  notes: text("notes"),
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  outcome: varchar("outcome"), // sale_completed, follow_up_needed, not_interested
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table for shipping management
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  status: varchar("status").notNull().default("draft"), // draft, pending, shipped, delivered, cancelled
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("20"), // KDV oranı %
  description: text("description"), // Fatura açıklaması
  shippingAddress: text("shipping_address"),
  trackingNumber: varchar("tracking_number"),
  notes: text("notes"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mail Settings table - Mail yapılandırmaları için
export const mailSettings = pgTable("mail_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingName: varchar("setting_name").notNull().unique(), // "smtp_settings", "default_from_email", etc.
  settingValue: text("setting_value"), // JSON string for complex settings
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mail Templates table - Mail şablonları için  
export const mailTemplates = pgTable("mail_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateName: varchar("template_name").notNull(),
  templateType: varchar("template_type").notNull(), // "invoice", "order_confirmation", "welcome", etc.
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: text("variables"), // JSON array of template variables like {{customerName}}
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ödemeler tablosu
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // nakit, havale, kredi_karti, cek
  description: text("description"),
  paymentDate: timestamp("payment_date").notNull(),
  dueDate: timestamp("due_date"), // vade tarihi
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, pending, overdue
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cari hesap hareketleri tablosu
export const accountTransactions = pgTable("account_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  paymentId: varchar("payment_id").references(() => payments.id, { onDelete: "set null" }),
  type: varchar("type", { length: 20 }).notNull(), // "debit" (borç), "credit" (alacak)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// İrsaliye detayları tablosu
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: varchar("product_name").notNull(), // Ürün adının kopyası (tarihsel veri için)
  quantity: integer("quantity").notNull(),
  unit: varchar("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery Slips (İrsaliye) table
export const deliverySlips = pgTable("delivery_slips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliverySlipNumber: varchar("delivery_slip_number").notNull().unique(), // İrsaliye numarası
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: "set null" }), // Hangi faturaya ait (nullable - henüz faturalanmamış olabilir)
  orderId: varchar("order_id").notNull().references(() => orders.id), // Hangi siparişten
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  status: varchar("status").notNull().default("prepared"), // prepared, delivered, returned
  deliveryAddress: text("delivery_address"),
  recipientName: varchar("recipient_name"),
  recipientPhone: varchar("recipient_phone"),
  driverName: varchar("driver_name"),
  driverPhone: varchar("driver_phone"),
  vehiclePlate: varchar("vehicle_plate"),
  deliveredAt: timestamp("delivered_at"),
  customerSignature: text("customer_signature"), // Müşteri imzası - base64 image data
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery Slip Items (İrsaliye Kalemleri) table
export const deliverySlipItems = pgTable("delivery_slip_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliverySlipId: varchar("delivery_slip_id").notNull().references(() => deliverySlips.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: varchar("product_name").notNull(), // Ürün adının kopyası
  quantity: integer("quantity").notNull(),
  unit: varchar("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0"), // Birim fiyat
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull().default("0"), // Toplam fiyat
  deliveredQuantity: integer("delivered_quantity").notNull().default(0), // Gerçekte teslim edilen miktar
  notes: text("notes"), // Kalem notları
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  orders: many(orders),
  visits: many(visits),
  appointments: many(appointments),
  invoices: many(invoices),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  salesPerson: one(users, {
    fields: [customers.salesPersonId],
    references: [users.id],
  }),
  orders: many(orders),
  visits: many(visits),
  appointments: many(appointments),
  invoices: many(invoices),
  payments: many(payments),
  accountTransactions: many(accountTransactions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  salesPerson: one(users, {
    fields: [orders.salesPersonId],
    references: [users.id],
  }),
  items: many(orderItems),
  visit: one(visits),
  invoice: one(invoices),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  salesPerson: one(users, {
    fields: [visits.salesPersonId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [visits.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [visits.orderId],
    references: [orders.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  salesPerson: one(users, {
    fields: [appointments.salesPersonId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  payments: many(payments),
  accountTransactions: many(accountTransactions),
  items: many(invoiceItems),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const accountTransactionsRelations = relations(accountTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [accountTransactions.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [accountTransactions.invoiceId],
    references: [invoices.id],
  }),
  payment: one(payments, {
    fields: [accountTransactions.paymentId],
    references: [payments.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.union([z.string(), z.date()]).transform(
    val => val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMailSettingSchema = createInsertSchema(mailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMailTemplateSchema = createInsertSchema(mailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  paymentDate: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  dueDate: z.union([z.string(), z.date(), z.null()]).transform(val => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
});

export const insertAccountTransactionSchema = createInsertSchema(accountTransactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertMailSetting = z.infer<typeof insertMailSettingSchema>;
export type MailSetting = typeof mailSettings.$inferSelect;
export type InsertMailTemplate = z.infer<typeof insertMailTemplateSchema>;
export type MailTemplate = typeof mailTemplates.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertAccountTransaction = z.infer<typeof insertAccountTransactionSchema>;
export type AccountTransaction = typeof accountTransactions.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Delivery Slip schemas
export const insertDeliverySlipSchema = createInsertSchema(deliverySlips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySlipItemSchema = createInsertSchema(deliverySlipItems).omit({
  id: true,
  createdAt: true,
});

export type InsertDeliverySlip = z.infer<typeof insertDeliverySlipSchema>;
export type DeliverySlip = typeof deliverySlips.$inferSelect;
export type InsertDeliverySlipItem = z.infer<typeof insertDeliverySlipItemSchema>;
export type DeliverySlipItem = typeof deliverySlipItems.$inferSelect;

// Extended types for API responses
export type OrderWithDetails = Order & {
  customer: Customer;
  salesPerson: User;
  items: (OrderItem & { product: Product })[];
};

export type CustomerWithSalesPerson = Customer & {
  salesPerson?: User;
};

export type VisitWithDetails = Visit & {
  customer?: Customer;
  salesPerson: User;
  order?: Order;
};

export type AppointmentWithDetails = Appointment & {
  customer: Customer;
  salesPerson: User;
};

export type InvoiceWithDetails = Invoice & {
  order: Order;
  customer: Customer;
  items?: (InvoiceItem & { product: Product })[];
  payments?: Payment[];
};
