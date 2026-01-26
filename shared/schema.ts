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
export const libraryDocCategoryEnum = pgEnum("library_doc_category", ["Lettings", "Sales", "Compliance", "Landlord", "Tenant", "Internal"]);

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
  jobTitle: text("job_title"),
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
  clientEmail: text("client_email"),
  clientName: text("client_name"),
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
  propertyClients: many(propertyClients),
  documents: many(documents),
  payments: many(payments),
  reports: many(reports),
  welcomePackItems: many(welcomePackItems),
}));

// ============================================
// PROPERTY CLIENTS (Junction Table for Multiple Clients per Property)
// ============================================
export const propertyClients = pgTable("property_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  clientEmail: text("client_email").notNull(),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientDateOfBirth: timestamp("client_date_of_birth"),
  lifecycleStatus: lifecycleStatusEnum("lifecycle_status").notNull().default("onboarding_in_progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyClientsRelations = relations(propertyClients, ({ one }) => ({
  property: one(properties, {
    fields: [propertyClients.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [propertyClients.userId],
    references: [users.id],
  }),
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

// Property Clients
export const insertPropertyClientSchema = createInsertSchema(propertyClients).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPropertyClientSchema = createSelectSchema(propertyClients);
export type InsertPropertyClient = z.infer<typeof insertPropertyClientSchema>;
export type PropertyClient = typeof propertyClients.$inferSelect;

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

// ============================================
// LIBRARY DOCUMENTS TABLE (Agent Document Library)
// ============================================
export const libraryDocuments = pgTable("library_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: libraryDocCategoryEnum("category").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const libraryDocumentsRelations = relations(libraryDocuments, ({ one }) => ({
  agent: one(users, {
    fields: [libraryDocuments.agentId],
    references: [users.id],
  }),
}));

// Library Documents
export const insertLibraryDocumentSchema = createInsertSchema(libraryDocuments).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export type InsertLibraryDocument = z.infer<typeof insertLibraryDocumentSchema>;
export type LibraryDocument = typeof libraryDocuments.$inferSelect;

// ============================================
// FIXED CHECKLIST STAGES (System-defined, immutable)
// ============================================

export const FIXED_STAGES = [
  { id: "identity", name: "Identity", order: 0 },
  { id: "tenancy_forms", name: "Tenancy Forms", order: 1 },
  { id: "references", name: "References", order: 2 },
  { id: "income", name: "Income", order: 3 },
  { id: "guarantor", name: "Guarantor", order: 4 },
  { id: "payments_finalisation", name: "Payments & Finalisation", order: 5 },
] as const;

export type FixedStageId = typeof FIXED_STAGES[number]["id"];

// ============================================
// CHECKLIST TEMPLATE TABLES (Agent-defined onboarding requirements)
// ============================================

// Stage Template - defines stages like "Identity", "References", etc.
export const checklistStageTemplates = pgTable("checklist_stage_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Requirement Template - placeholder requirements like "Passport / Photo ID"
// Uses fixed stageId (one of FIXED_STAGES.id values)
export const checklistRequirementTemplates = pgTable("checklist_requirement_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  stageId: varchar("stage_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  required: boolean("required").default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CLIENT CHECKLIST SNAPSHOT TABLES (Copied from template when client is added)
// ============================================

// Client Stage Snapshot - copy of stages for a specific client/property
export const clientChecklistStages = pgTable("client_checklist_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Requirement Snapshot - copy of requirements for a specific client
export const clientChecklistStatusEnum = pgEnum("client_checklist_status", ["pending", "uploaded", "in_review", "approved", "rejected"]);

export const clientChecklistRequirements = pgTable("client_checklist_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull(),
  stageId: varchar("stage_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  required: boolean("required").default(true),
  order: integer("order").notNull().default(0),
  status: clientChecklistStatusEnum("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  uploadedAt: timestamp("uploaded_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const checklistStageTemplatesRelations = relations(checklistStageTemplates, ({ one, many }) => ({
  agent: one(users, { fields: [checklistStageTemplates.agentId], references: [users.id] }),
  requirements: many(checklistRequirementTemplates),
}));

export const checklistRequirementTemplatesRelations = relations(checklistRequirementTemplates, ({ one }) => ({
  agent: one(users, { fields: [checklistRequirementTemplates.agentId], references: [users.id] }),
}));

export const clientChecklistStagesRelations = relations(clientChecklistStages, ({ one, many }) => ({
  property: one(properties, { fields: [clientChecklistStages.propertyId], references: [properties.id] }),
  client: one(users, { fields: [clientChecklistStages.clientId], references: [users.id] }),
  requirements: many(clientChecklistRequirements),
}));

export const clientChecklistRequirementsRelations = relations(clientChecklistRequirements, ({ one }) => ({
  property: one(properties, { fields: [clientChecklistRequirements.propertyId], references: [properties.id] }),
}));

// Insert schemas and types
export const insertChecklistStageTemplateSchema = createInsertSchema(checklistStageTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChecklistStageTemplate = z.infer<typeof insertChecklistStageTemplateSchema>;
export type ChecklistStageTemplate = typeof checklistStageTemplates.$inferSelect;

export const insertChecklistRequirementTemplateSchema = createInsertSchema(checklistRequirementTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChecklistRequirementTemplate = z.infer<typeof insertChecklistRequirementTemplateSchema>;
export type ChecklistRequirementTemplate = typeof checklistRequirementTemplates.$inferSelect;

export const insertClientChecklistStageSchema = createInsertSchema(clientChecklistStages).omit({ id: true, createdAt: true });
export type InsertClientChecklistStage = z.infer<typeof insertClientChecklistStageSchema>;
export type ClientChecklistStage = typeof clientChecklistStages.$inferSelect;

export const insertClientChecklistRequirementSchema = createInsertSchema(clientChecklistRequirements).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClientChecklistRequirement = z.infer<typeof insertClientChecklistRequirementSchema>;
export type ClientChecklistRequirement = typeof clientChecklistRequirements.$inferSelect;

// Auth types for blueprint compatibility
export type UpsertUser = Omit<typeof users.$inferInsert, "createdAt" | "updatedAt">;

// ============================================
// HELP LINKS TABLE (Agent-managed help resources for clients)
// ============================================
export const helpLinkCategoryEnum = pgEnum("help_link_category", ["internet", "cleaning", "pest", "utilities", "removals", "other"]);

export const helpLinks = pgTable("help_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: helpLinkCategoryEnum("category").notNull(),
  businessName: text("business_name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const helpLinksRelations = relations(helpLinks, ({ one }) => ({
  agent: one(users, { fields: [helpLinks.agentId], references: [users.id] }),
}));

export const insertHelpLinkSchema = createInsertSchema(helpLinks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHelpLink = z.infer<typeof insertHelpLinkSchema>;
export type HelpLink = typeof helpLinks.$inferSelect;
