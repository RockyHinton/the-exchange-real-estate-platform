import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum("user_role", ["agent", "client"]);
export const propertyStatusEnum = pgEnum("property_status", ["active", "pending", "closed"]);
export const lifecycleStatusEnum = pgEnum("lifecycle_status", ["onboarding_in_progress", "onboarding_ready_to_confirm", "approved_active_tenancy"]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "uploaded", "in_review", "approved", "rejected"]);
export const rentStatusEnum = pgEnum("rent_status", ["unpaid", "pending", "paid"]);
export const reportCategoryEnum = pgEnum("report_category", ["maintenance", "admin", "urgent"]);
export const reportPriorityEnum = pgEnum("report_priority", ["low", "medium", "high"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "resolved", "ignored"]);

// ============================================
// SESSIONS TABLE (Required for Replit Auth)
// ============================================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// ============================================
// USERS TABLE (Extended from Replit Auth)
// ============================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  role: userRoleEnum("role"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  ownedProperties: many(properties, { relationName: "agentProperties" }),
  rentedProperty: one(properties, { 
    fields: [users.id],
    references: [properties.clientId],
    relationName: "clientProperty"
  }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  documents: many(documents),
  reports: many(reports),
  payments: many(payments),
}));

// ============================================
// PROPERTIES TABLE
// ============================================
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  clientId: varchar("client_id").references(() => users.id),
  status: propertyStatusEnum("status").notNull().default("active"),
  lifecycleStatus: lifecycleStatusEnum("lifecycle_status").notNull().default("onboarding_in_progress"),
  guarantorRequired: boolean("guarantor_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id],
    relationName: "agentProperties"
  }),
  client: one(users, {
    fields: [properties.clientId],
    references: [users.id],
    relationName: "clientProperty"
  }),
  documents: many(documents),
  payments: many(payments),
  reports: many(reports),
  welcomePackItems: many(welcomePackItems),
}));

// ============================================
// DOCUMENTS TABLE
// ============================================
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  status: documentStatusEnum("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  required: boolean("required").default(true),
  path: text("path"),
  isGuarantor: boolean("is_guarantor").default(false),
  uploadDate: timestamp("upload_date"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

// ============================================
// PAYMENTS (RENT SCHEDULE) TABLE
// ============================================
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: rentStatusEnum("status").notNull().default("unpaid"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  property: one(properties, {
    fields: [payments.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// ============================================
// REPORTS (ISSUES) TABLE
// ============================================
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: reportCategoryEnum("category").notNull(),
  priority: reportPriorityEnum("priority").notNull().default("medium"),
  status: reportStatusEnum("status").notNull().default("open"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const reportsRelations = relations(reports, ({ one, many }) => ({
  property: one(properties, {
    fields: [reports.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  messages: many(reportMessages),
}));

// ============================================
// REPORT MESSAGES TABLE
// ============================================
export const reportMessages = pgTable("report_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportMessagesRelations = relations(reportMessages, ({ one }) => ({
  report: one(reports, {
    fields: [reportMessages.reportId],
    references: [reports.id],
  }),
  sender: one(users, {
    fields: [reportMessages.senderId],
    references: [users.id],
  }),
}));

// ============================================
// MESSAGES (CHAT) TABLE
// ============================================
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

// ============================================
// WELCOME PACK ITEMS TABLE
// ============================================
export const welcomePackItems = pgTable("welcome_pack_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon").notNull(),
  fieldLabel: text("field_label"),
  fieldValue: text("field_value"),
  fieldCopyable: boolean("field_copyable").default(false),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const welcomePackItemsRelations = relations(welcomePackItems, ({ one }) => ({
  property: one(properties, {
    fields: [welcomePackItems.propertyId],
    references: [properties.id],
  }),
}));

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// Users (Auth)
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Properties
export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectPropertySchema = createSelectSchema(properties);
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Documents
export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectDocumentSchema = createSelectSchema(documents);
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Payments
export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPaymentSchema = createSelectSchema(payments);
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Reports
export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true 
});
export const selectReportSchema = createSelectSchema(reports);
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Report Messages
export const insertReportMessageSchema = createInsertSchema(reportMessages).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertReportMessage = z.infer<typeof insertReportMessageSchema>;
export type ReportMessage = typeof reportMessages.$inferSelect;

// Messages
export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Welcome Pack Items
export const insertWelcomePackItemSchema = createInsertSchema(welcomePackItems).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertWelcomePackItem = z.infer<typeof insertWelcomePackItemSchema>;
export type WelcomePackItem = typeof welcomePackItems.$inferSelect;

// Auth types for blueprint compatibility
export type UpsertUser = Omit<typeof users.$inferInsert, "createdAt" | "updatedAt">;
