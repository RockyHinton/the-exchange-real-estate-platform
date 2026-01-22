import { 
  users,
  properties,
  documents,
  payments,
  reports,
  reportMessages,
  messages,
  welcomePackItems,
  type User, 
  type InsertUser,
  type Property,
  type InsertProperty,
  type Document,
  type InsertDocument,
  type Payment,
  type InsertPayment,
  type Report,
  type InsertReport,
  type ReportMessage,
  type InsertReportMessage,
  type Message,
  type InsertMessage,
  type WelcomePackItem,
  type InsertWelcomePackItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property operations
  getProperty(id: string): Promise<Property | undefined>;
  getPropertiesByAgent(agentId: string): Promise<Property[]>;
  getPropertiesWithClientsByAgent(agentId: string): Promise<(Property & { client?: User | null })[]>;
  getPropertyByClient(clientId: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  
  // Document operations
  getDocumentsByProperty(propertyId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  
  // Payment operations
  getPaymentsByProperty(propertyId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // Report operations
  getReportsByProperty(propertyId: string): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<InsertReport>): Promise<Report | undefined>;
  
  // Report Message operations
  getReportMessages(reportId: string): Promise<ReportMessage[]>;
  createReportMessage(message: InsertReportMessage): Promise<ReportMessage>;
  
  // Chat Message operations
  getMessagesByProperty(propertyId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(propertyId: string, receiverId: string): Promise<void>;
  
  // Welcome Pack operations
  getWelcomePackItems(propertyId: string): Promise<WelcomePackItem[]>;
  createWelcomePackItem(item: InsertWelcomePackItem): Promise<WelcomePackItem>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Property operations
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getPropertiesByAgent(agentId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.agentId, agentId));
  }

  async getPropertiesWithClientsByAgent(agentId: string): Promise<(Property & { client?: User | null })[]> {
    const props = await db.select().from(properties).where(eq(properties.agentId, agentId));
    
    const result = await Promise.all(props.map(async (prop) => {
      let client = null;
      if (prop.clientId) {
        const [clientUser] = await db.select().from(users).where(eq(users.id, prop.clientId));
        client = clientUser || null;
      }
      return { ...prop, client };
    }));
    
    return result;
  }

  async getPropertyByClient(clientId: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.clientId, clientId));
    return property || undefined;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }

  // Document operations
  async getDocumentsByProperty(propertyId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.propertyId, propertyId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(document).returning();
    return newDoc;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  // Payment operations
  async getPaymentsByProperty(propertyId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.propertyId, propertyId))
      .orderBy(payments.dueDate);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updated || undefined;
  }

  // Report operations
  async getReportsByProperty(propertyId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.propertyId, propertyId))
      .orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReport(id: string, updates: Partial<InsertReport>): Promise<Report | undefined> {
    const [updated] = await db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, id))
      .returning();
    return updated || undefined;
  }

  // Report Message operations
  async getReportMessages(reportId: string): Promise<ReportMessage[]> {
    return await db
      .select()
      .from(reportMessages)
      .where(eq(reportMessages.reportId, reportId))
      .orderBy(reportMessages.createdAt);
  }

  async createReportMessage(message: InsertReportMessage): Promise<ReportMessage> {
    const [newMessage] = await db.insert(reportMessages).values(message).returning();
    return newMessage;
  }

  // Chat Message operations
  async getMessagesByProperty(propertyId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.propertyId, propertyId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessagesAsRead(propertyId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.propertyId, propertyId),
          eq(messages.receiverId, receiverId),
          eq(messages.read, false)
        )
      );
  }

  // Welcome Pack operations
  async getWelcomePackItems(propertyId: string): Promise<WelcomePackItem[]> {
    return await db
      .select()
      .from(welcomePackItems)
      .where(eq(welcomePackItems.propertyId, propertyId))
      .orderBy(welcomePackItems.orderIndex);
  }

  async createWelcomePackItem(item: InsertWelcomePackItem): Promise<WelcomePackItem> {
    const [newItem] = await db.insert(welcomePackItems).values(item).returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();
