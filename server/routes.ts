import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

// Middleware to verify property access
const verifyPropertyAccess = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    const propertyId = req.params.id;

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

    // Check ownership: agent owns the property OR client is assigned to it
    const hasAccess = 
      (user.role === "agent" && property.agentId === userId) ||
      (user.role === "client" && property.clientId === userId);

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
        const properties = await storage.getPropertiesByAgent(userId);
        res.json(properties);
      } else {
        const property = await storage.getPropertyByClient(userId);
        res.json(property ? [property] : []);
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
      const hasAccess = 
        (user.role === "agent" && property.agentId === userId) ||
        (user.role === "client" && property.clientId === userId);

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

  return httpServer;
}
