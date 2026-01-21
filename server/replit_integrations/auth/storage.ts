import { users, properties, type User, type UpsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq, or } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  checkEmailAuthorized(email: string): Promise<{ authorized: boolean; role?: "agent" | "client"; propertyId?: string }>;
  linkClientToProperty(userId: string, propertyId: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const normalizedEmail = userData.email?.toLowerCase().trim();
    
    const existingByEmail = normalizedEmail 
      ? await db.select().from(users).where(eq(users.email, normalizedEmail))
      : [];
    
    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0];
      const [updated] = await db
        .update(users)
        .set({
          id: userData.id,
          firstName: userData.firstName || existing.firstName,
          lastName: userData.lastName || existing.lastName,
          profileImageUrl: userData.profileImageUrl || existing.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, normalizedEmail!))
        .returning();
      return updated;
    }

    const [user] = await db
      .insert(users)
      .values({ ...userData, email: normalizedEmail })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: normalizedEmail,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async checkEmailAuthorized(email: string): Promise<{ authorized: boolean; role?: "agent" | "client"; propertyId?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existingUser.length > 0 && existingUser[0].role === "agent") {
      return { authorized: true, role: "agent" };
    }

    const propertyWithClient = await db.select().from(properties).where(eq(properties.clientEmail, normalizedEmail));
    if (propertyWithClient.length > 0) {
      return { authorized: true, role: "client", propertyId: propertyWithClient[0].id };
    }

    if (existingUser.length > 0 && existingUser[0].role === "client") {
      const linkedProperty = await db.select().from(properties).where(eq(properties.clientId, existingUser[0].id));
      if (linkedProperty.length > 0) {
        return { authorized: true, role: "client", propertyId: linkedProperty[0].id };
      }
    }

    return { authorized: false };
  }

  async linkClientToProperty(userId: string, propertyId: string): Promise<void> {
    await db.update(properties)
      .set({ clientId: userId, updatedAt: new Date() })
      .where(eq(properties.id, propertyId));
  }
}

export const authStorage = new AuthStorage();
