import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const objectStorageService = new ObjectStorageService();

// Middleware to require specific role
const requireRole = (role: "agent" | "client") => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== role) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      req.dbUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Helper to get property ID from various route parameter names
const getPropertyIdFromParams = (params: any): string | undefined => {
  return params.id || params.propertyId;
};

// Middleware to verify property access
const verifyPropertyAccess = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    const propertyId = getPropertyIdFromParams(req.params);

    if (!userId || !propertyId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check ownership: agent owns the property OR client is assigned via property_clients
    let hasAccess = false;
    if (user.role === "agent" && property.agentId === userId) {
      hasAccess = true;
    } else if (user.role === "client") {
      // Check property_clients table or legacy clientId
      const isClient = await storage.isClientOfProperty(userId, propertyId);
      hasAccess = isClient || property.clientId === userId;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden: You don't have access to this property" });
    }

    req.dbUser = user;
    req.property = property;
    next();
  } catch (error) {
    console.error("Property access check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register object storage routes
  registerObjectStorageRoutes(app);

  // ============================================
  // USER ROUTES
  // ============================================

  // Get current user with role information
  app.get("/api/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Set user role (first-time setup only)
  app.post("/api/user/role", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { role } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!role || !["agent", "client"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user already has a role (prevent role switching)
      const existingUser = await storage.getUser(userId);
      if (existingUser?.role) {
        return res.status(400).json({ message: "Role already set. Contact support to change roles." });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set user role" });
    }
  });

  // ============================================
  // PROPERTY ROUTES
  // ============================================

  // Get properties for current user (role-based filtering)
  app.get("/api/properties", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.role) {
        return res.status(400).json({ message: "Please select a role first" });
      }

      if (user.role === "agent") {
        const properties = await storage.getPropertiesWithClientsByAgent(userId);
        res.json(properties);
      } else {
        // Clients can now have multiple properties via property_clients table
        const properties = await storage.getPropertiesByClient(userId);
        res.json(properties);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get single property (with ownership verification)
  app.get("/api/properties/:id", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    res.json(req.property);
  });

  // Create a new property (agents only)
  app.post("/api/properties", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { address, city, postcode, price, imageUrl, clientEmail, clientName, guarantorRequired } = req.body;
      const agentId = req.dbUser.id;

      if (!address || !city || !postcode || !price) {
        return res.status(400).json({ message: "Address, city, postcode, and price are required" });
      }

      const normalizedClientEmail = clientEmail?.toLowerCase().trim() || null;

      const property = await storage.createProperty({
        address,
        city,
        postcode,
        price,
        imageUrl: imageUrl || null,
        agentId,
        clientEmail: normalizedClientEmail,
        clientName: clientName || null,
        guarantorRequired: guarantorRequired || false,
        status: "active",
        lifecycleStatus: "onboarding_in_progress",
      });

      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // Update a property (agents only, must own the property)
  app.put("/api/properties/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const agentId = req.dbUser.id;

      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (existingProperty.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }

      const { address, city, postcode, price, imageUrl, clientEmail, clientName, status, lifecycleStatus, guarantorRequired } = req.body;

      const normalizedClientEmail = clientEmail?.toLowerCase().trim() || existingProperty.clientEmail;

      const updated = await storage.updateProperty(propertyId, {
        address: address || existingProperty.address,
        city: city || existingProperty.city,
        postcode: postcode || existingProperty.postcode,
        price: price || existingProperty.price,
        imageUrl: imageUrl !== undefined ? imageUrl : existingProperty.imageUrl,
        clientEmail: normalizedClientEmail,
        clientName: clientName !== undefined ? clientName : existingProperty.clientName,
        status: status || existingProperty.status,
        lifecycleStatus: lifecycleStatus || existingProperty.lifecycleStatus,
        guarantorRequired: guarantorRequired !== undefined ? guarantorRequired : existingProperty.guarantorRequired,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Delete a property (agents only, must own the property)
  app.delete("/api/properties/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const agentId = req.dbUser.id;

      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (existingProperty.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }

      const deleted = await storage.deleteProperty(propertyId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete property" });
      }
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // ============================================
  // PROPERTY CLIENT ROUTES
  // ============================================

  // Get all clients for a property
  app.get("/api/properties/:id/clients", isAuthenticated, async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const userId = req.user?.claims?.sub;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Only agents who own the property can see all clients
      if (user.role !== "agent" || property.agentId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const clients = await storage.getPropertyClients(propertyId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching property clients:", error);
      res.status(500).json({ message: "Failed to fetch property clients" });
    }
  });

  // Get client's own propertyClient record (for clients to get their ID)
  app.get("/api/properties/:id/my-client-record", isAuthenticated, async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const userId = req.user?.claims?.sub;

      const user = await storage.getUser(userId);
      if (!user || user.role !== "client") {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }

      const clients = await storage.getPropertyClients(propertyId);
      const myRecord = clients.find(c => c.userId === userId);
      
      if (!myRecord) {
        return res.status(404).json({ message: "Client record not found" });
      }

      res.json(myRecord);
    } catch (error) {
      console.error("Error fetching client record:", error);
      res.status(500).json({ message: "Failed to fetch client record" });
    }
  });

  // Add a client to a property
  app.post("/api/properties/:id/clients", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const { clientEmail, clientName, clientPhone, clientDateOfBirth } = req.body;
      const agentId = req.dbUser.id;

      if (!clientEmail) {
        return res.status(400).json({ message: "Client email is required" });
      }

      if (!clientName) {
        return res.status(400).json({ message: "Client name is required" });
      }

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }

      // Check if client already exists on this property
      const existingClient = await storage.getPropertyClientByEmail(propertyId, clientEmail);
      if (existingClient) {
        return res.status(400).json({ message: "This client is already assigned to this property" });
      }

      // Check if there's a registered user with this email
      const existingUser = await storage.getUserByEmail(clientEmail.toLowerCase());

      const client = await storage.addPropertyClient({
        propertyId,
        userId: existingUser?.id || null,
        clientEmail: clientEmail.toLowerCase(),
        clientName: clientName,
        clientPhone: clientPhone || null,
        clientDateOfBirth: clientDateOfBirth ? new Date(clientDateOfBirth) : null,
        lifecycleStatus: "onboarding_in_progress",
      });

      // Automatically create checklist snapshot for the new client
      // This copies the agent's current requirement templates to the client's personalized checklist
      await storage.createClientChecklistSnapshot(propertyId, client.id, agentId);

      // Return the client with user info if available
      res.status(201).json({
        ...client,
        user: existingUser || null,
      });
    } catch (error) {
      console.error("Error adding property client:", error);
      res.status(500).json({ message: "Failed to add property client" });
    }
  });

  // Update a property client
  app.put("/api/properties/:propertyId/clients/:clientId", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { propertyId, clientId } = req.params;
      const { clientEmail, clientName, lifecycleStatus } = req.body;
      const agentId = req.dbUser.id;

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }

      const updated = await storage.updatePropertyClient(clientId, {
        clientEmail: clientEmail || undefined,
        clientName: clientName !== undefined ? clientName : undefined,
        lifecycleStatus: lifecycleStatus || undefined,
      });

      if (!updated) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating property client:", error);
      res.status(500).json({ message: "Failed to update property client" });
    }
  });

  // Remove a client from a property
  app.delete("/api/properties/:propertyId/clients/:clientId", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { propertyId, clientId } = req.params;
      const { endTenancy } = req.body || {};
      const agentId = req.dbUser.id;

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }

      const deletedClient = await storage.removePropertyClient(clientId);
      if (!deletedClient) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Always clear properties.clientId if it matches the deleted client's userId
      // This prevents deleted clients from being able to log in via legacy auth checks
      if (deletedClient.userId && property.clientId === deletedClient.userId) {
        await storage.updateProperty(propertyId, { 
          clientId: null 
        });
      }

      if (endTenancy) {
        await db.transaction(async (tx) => {
          await storage.deletePropertyMessages(propertyId);
          await storage.deletePropertyReports(propertyId);
          await storage.deletePropertyDocuments(propertyId);
          await storage.deletePropertyPayments(propertyId);
          await storage.updateProperty(propertyId, { 
            lifecycleStatus: "onboarding_in_progress",
            clientId: null,
            clientEmail: null,
            clientName: null
          });
        });
      }

      res.json({ message: endTenancy ? "Tenancy ended successfully" : "Client removed successfully" });
    } catch (error) {
      console.error("Error removing property client:", error);
      res.status(500).json({ message: "Failed to remove property client" });
    }
  });

  // ============================================
  // DOCUMENT ROUTES (Property-scoped)
  // ============================================

  // Get documents for a property
  app.get("/api/properties/:id/documents", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const documents = await storage.getDocumentsByProperty(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Update document status (agents only)
  app.patch("/api/documents/:id/status", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { status } = req.body;
      const docId = req.params.id;

      if (!["pending", "uploaded", "in_review", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify the agent owns the property this document belongs to
      const doc = await storage.getDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      const property = await storage.getProperty(doc.propertyId);
      if (!property || property.agentId !== req.dbUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateDocument(docId, { status });
      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // ============================================
  // PAYMENT ROUTES (Property-scoped)
  // ============================================

  // Get payments for a property
  app.get("/api/properties/:id/payments", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const payments = await storage.getPaymentsByProperty(req.params.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Create a payment (agents only)
  app.post("/api/properties/:id/payments", isAuthenticated, requireRole("agent"), verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const { dueDate, amount, status } = req.body;
      const propertyId = req.params.id;

      if (!dueDate || !amount) {
        return res.status(400).json({ message: "Due date and amount are required" });
      }

      const payment = await storage.createPayment({
        propertyId,
        userId: req.dbUser.id,
        dueDate: new Date(dueDate),
        amount: Number(amount),
        status: status || "unpaid",
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Bulk update rent schedule (agents only) - replaces all payments for a property
  app.put("/api/properties/:id/payments", isAuthenticated, requireRole("agent"), verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const propertyId = req.params.id;
      const { payments: newPayments } = req.body;

      if (!Array.isArray(newPayments)) {
        return res.status(400).json({ message: "Payments array is required" });
      }

      // Delete existing payments for this property
      await storage.deletePropertyPayments(propertyId);

      // Create new payments
      const createdPayments = [];
      for (const p of newPayments) {
        const payment = await storage.createPayment({
          propertyId,
          userId: req.dbUser.id,
          dueDate: new Date(p.dueDate),
          amount: Number(p.amount),
          status: p.status || "unpaid",
        });
        createdPayments.push(payment);
      }

      res.json(createdPayments);
    } catch (error) {
      console.error("Error updating rent schedule:", error);
      res.status(500).json({ message: "Failed to update rent schedule" });
    }
  });

  // Update payment status
  app.patch("/api/payments/:id/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status } = req.body;
      const paymentId = req.params.id;
      const userId = req.user?.claims?.sub;

      if (!["unpaid", "pending", "paid"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get payment and verify ownership
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const property = await storage.getProperty(payment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Verify user has access to this property
      let hasAccess = false;
      if (user.role === "agent" && property.agentId === userId) {
        hasAccess = true;
      } else if (user.role === "client") {
        const isClient = await storage.isClientOfProperty(userId, property.id);
        hasAccess = isClient || property.clientId === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this payment" });
      }

      // Clients can mark as pending, only agents can mark as paid
      if (user.role === "client" && status === "paid") {
        return res.status(403).json({ message: "Only agents can verify payments" });
      }

      const updated = await storage.updatePayment(paymentId, { 
        status,
        paidDate: status === "paid" ? new Date() : null
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // ============================================
  // REPORT ROUTES (Property-scoped)
  // ============================================

  // Get reports for a property
  app.get("/api/properties/:id/reports", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const reports = await storage.getReportsByProperty(req.params.id);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Create a report (clients only)
  app.post("/api/properties/:id/reports", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const { category, priority, description } = req.body;
      const userId = req.user?.claims?.sub;

      const report = await storage.createReport({
        propertyId: req.params.id,
        userId,
        category,
        priority: priority || "medium",
        description,
        status: "open",
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Update report status (agents only)
  app.patch("/api/reports/:id/status", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { status } = req.body;

      if (!["open", "resolved", "ignored"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Verify agent owns the property
      const property = await storage.getProperty(report.propertyId);
      if (!property || property.agentId !== req.dbUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateReport(req.params.id, { 
        status,
        resolvedAt: status === "resolved" ? new Date() : null
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Get report messages
  app.get("/api/reports/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const property = await storage.getProperty(report.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      let hasAccess = false;
      if (user.role === "agent" && property.agentId === userId) {
        hasAccess = true;
      } else if (user.role === "client") {
        const isClient = await storage.isClientOfProperty(userId, property.id);
        hasAccess = isClient || property.clientId === userId || report.userId === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await storage.getReportMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching report messages:", error);
      res.status(500).json({ message: "Failed to fetch report messages" });
    }
  });

  // Add report message
  app.post("/api/reports/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const property = await storage.getProperty(report.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      let hasAccess = false;
      if (user.role === "agent" && property.agentId === userId) {
        hasAccess = true;
      } else if (user.role === "client") {
        const isClient = await storage.isClientOfProperty(userId, property.id);
        hasAccess = isClient || property.clientId === userId || report.userId === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { content } = req.body;
      const message = await storage.createReportMessage({
        reportId: req.params.id,
        senderId: userId,
        content,
        isAdmin: user.role === "agent",
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error adding report message:", error);
      res.status(500).json({ message: "Failed to add report message" });
    }
  });

  // Upload document file
  app.post("/api/documents/:id/upload", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      let hasAccess = false;
      if (user.role === "agent" && property.agentId === userId) {
        hasAccess = true;
      } else if (user.role === "client") {
        const isClient = await storage.isClientOfProperty(userId, property.id);
        hasAccess = isClient || property.clientId === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateDocument(req.params.id, {
        status: "in_review",
        uploadDate: new Date(),
        fileUrl: `/uploads/${req.params.id}`,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Update property lifecycle status
  app.patch("/api/properties/:id/lifecycle", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const { status } = req.body;

      if (!["onboarding_in_progress", "onboarding_ready_to_confirm", "approved_active_tenancy"].includes(status)) {
        return res.status(400).json({ message: "Invalid lifecycle status" });
      }

      const updated = await storage.updateProperty(req.params.id, { lifecycleStatus: status });
      res.json(updated);
    } catch (error) {
      console.error("Error updating lifecycle status:", error);
      res.status(500).json({ message: "Failed to update lifecycle status" });
    }
  });

  // ============================================
  // MESSAGE ROUTES (Property-scoped)
  // ============================================

  // Get messages for a property
  app.get("/api/properties/:id/messages", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const messages = await storage.getMessagesByProperty(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/properties/:id/messages", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const { receiverId, content } = req.body;
      const userId = req.user?.claims?.sub;

      const message = await storage.createMessage({
        propertyId: req.params.id,
        senderId: userId,
        receiverId,
        content,
        read: false,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/properties/:id/messages/mark-read", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.markMessagesAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // ============================================
  // WELCOME PACK ROUTES
  // ============================================

  // Get welcome pack items for a property
  app.get("/api/properties/:id/welcome-pack", isAuthenticated, verifyPropertyAccess, async (req: any, res: Response) => {
    try {
      const items = await storage.getWelcomePackItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching welcome pack:", error);
      res.status(500).json({ message: "Failed to fetch welcome pack" });
    }
  });

  // ============================================
  // LIBRARY DOCUMENT ROUTES (Agent Document Library)
  // ============================================

  // Get all library documents for the authenticated agent
  app.get("/api/library-documents", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const docs = await storage.getLibraryDocuments(agentId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching library documents:", error);
      res.status(500).json({ message: "Failed to fetch library documents" });
    }
  });

  // Create a new library document
  app.post("/api/library-documents", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const { name, category, description, fileUrl, fileName, fileSize, mimeType } = req.body;
      
      if (!name || !category || !fileUrl || !fileName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const doc = await storage.createLibraryDocument({
        agentId,
        name,
        category,
        description: description || null,
        fileUrl,
        fileName,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
      });

      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating library document:", error);
      res.status(500).json({ message: "Failed to create library document" });
    }
  });

  // Update a library document
  app.patch("/api/library-documents/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const docId = req.params.id;
      
      const doc = await storage.getLibraryDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this document" });
      }

      const { name, category, description } = req.body;
      const updated = await storage.updateLibraryDocument(docId, {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating library document:", error);
      res.status(500).json({ message: "Failed to update library document" });
    }
  });

  // Delete a library document
  app.delete("/api/library-documents/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const docId = req.params.id;
      
      const doc = await storage.getLibraryDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.agentId !== agentId) {
        return res.status(403).json({ message: "Forbidden: You don't own this document" });
      }

      await storage.deleteLibraryDocument(docId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting library document:", error);
      res.status(500).json({ message: "Failed to delete library document" });
    }
  });

  // ============================================
  // CHECKLIST TEMPLATE ROUTES
  // ============================================

  // Get all stage templates for the authenticated agent
  app.get("/api/checklist-templates/stages", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const stages = await storage.getChecklistStageTemplates(agentId);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching stage templates:", error);
      res.status(500).json({ message: "Failed to fetch stage templates" });
    }
  });

  // Create a stage template
  app.post("/api/checklist-templates/stages", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const { name, order } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const stage = await storage.createChecklistStageTemplate({
        agentId,
        name,
        order: order ?? 0,
      });

      res.status(201).json(stage);
    } catch (error) {
      console.error("Error creating stage template:", error);
      res.status(500).json({ message: "Failed to create stage template" });
    }
  });

  // Update a stage template
  app.patch("/api/checklist-templates/stages/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { name, order } = req.body;
      const updated = await storage.updateChecklistStageTemplate(req.params.id, {
        ...(name && { name }),
        ...(order !== undefined && { order }),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Stage not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating stage template:", error);
      res.status(500).json({ message: "Failed to update stage template" });
    }
  });

  // Delete a stage template
  app.delete("/api/checklist-templates/stages/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteChecklistStageTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Stage not found" });
      }
      res.json({ message: "Stage deleted successfully" });
    } catch (error) {
      console.error("Error deleting stage template:", error);
      res.status(500).json({ message: "Failed to delete stage template" });
    }
  });

  // Get all requirement templates for the authenticated agent
  app.get("/api/checklist-templates/requirements", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const requirements = await storage.getChecklistRequirementTemplates(agentId);
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching requirement templates:", error);
      res.status(500).json({ message: "Failed to fetch requirement templates" });
    }
  });

  // Create a requirement template
  app.post("/api/checklist-templates/requirements", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const agentId = req.dbUser.id;
      const { stageId, title, description, required, order } = req.body;
      
      if (!stageId || !title) {
        return res.status(400).json({ message: "Stage and title are required" });
      }

      const requirement = await storage.createChecklistRequirementTemplate({
        agentId,
        stageId,
        title,
        description: description || null,
        required: required ?? true,
        order: order ?? 0,
      });

      res.status(201).json(requirement);
    } catch (error) {
      console.error("Error creating requirement template:", error);
      res.status(500).json({ message: "Failed to create requirement template" });
    }
  });

  // Update a requirement template
  app.patch("/api/checklist-templates/requirements/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { stageId, title, description, required, order } = req.body;
      const updated = await storage.updateChecklistRequirementTemplate(req.params.id, {
        ...(stageId && { stageId }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(required !== undefined && { required }),
        ...(order !== undefined && { order }),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating requirement template:", error);
      res.status(500).json({ message: "Failed to update requirement template" });
    }
  });

  // Delete a requirement template
  app.delete("/api/checklist-templates/requirements/:id", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteChecklistRequirementTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
      console.error("Error deleting requirement template:", error);
      res.status(500).json({ message: "Failed to delete requirement template" });
    }
  });

  // ============================================
  // CLIENT CHECKLIST SNAPSHOT ROUTES
  // ============================================

  // Get client checklist stages and requirements
  app.get("/api/properties/:propertyId/clients/:clientId/checklist", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { propertyId, clientId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Access control: Only the property owner (agent) or assigned clients can access
      if (user.role === "agent" && property.agentId !== userId) {
        return res.status(403).json({ message: "Forbidden: Not your property" });
      }
      
      if (user.role === "client") {
        const isClient = await storage.isClientOfProperty(userId, propertyId);
        if (!isClient) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this property" });
        }
      }
      
      const stages = await storage.getClientChecklistStages(propertyId, clientId);
      const requirements = await storage.getClientChecklistRequirements(propertyId, clientId);
      
      res.json({ stages, requirements });
    } catch (error) {
      console.error("Error fetching client checklist:", error);
      res.status(500).json({ message: "Failed to fetch client checklist" });
    }
  });

  // Create client checklist snapshot (called when adding client)
  app.post("/api/properties/:propertyId/clients/:clientId/checklist/snapshot", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { propertyId, clientId } = req.params;
      const agentId = req.dbUser.id;
      
      await storage.createClientChecklistSnapshot(propertyId, clientId, agentId);
      
      res.status(201).json({ message: "Checklist snapshot created" });
    } catch (error) {
      console.error("Error creating checklist snapshot:", error);
      res.status(500).json({ message: "Failed to create checklist snapshot" });
    }
  });

  // Update a client checklist requirement (status, file upload, etc.)
  app.patch("/api/checklist-requirements/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status, fileUrl, fileName, rejectionReason } = req.body;
      const updated = await storage.updateClientChecklistRequirement(req.params.id, {
        ...(status && { status }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(rejectionReason !== undefined && { rejectionReason }),
        ...(fileUrl && { uploadedAt: new Date() }),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating client requirement:", error);
      res.status(500).json({ message: "Failed to update requirement" });
    }
  });

  // Upload file to a client checklist requirement
  app.post("/api/checklist-requirements/:id/upload", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // fileUrl comes from the client after uploading to object storage
      const { fileName, fileUrl } = req.body;
      
      if (!fileUrl) {
        return res.status(400).json({ message: "fileUrl is required" });
      }

      const updated = await storage.updateClientChecklistRequirement(req.params.id, {
        status: "uploaded",
        fileUrl,
        fileName: fileName || "uploaded_file",
        uploadedAt: new Date(),
      });

      if (!updated) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error uploading to checklist requirement:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Delete client checklist snapshot (when removing client)
  app.delete("/api/properties/:propertyId/clients/:clientId/checklist", isAuthenticated, requireRole("agent"), async (req: any, res: Response) => {
    try {
      const { propertyId, clientId } = req.params;
      await storage.deleteClientChecklistSnapshot(propertyId, clientId);
      res.json({ message: "Checklist deleted successfully" });
    } catch (error) {
      console.error("Error deleting client checklist:", error);
      res.status(500).json({ message: "Failed to delete client checklist" });
    }
  });

  return httpServer;
}
