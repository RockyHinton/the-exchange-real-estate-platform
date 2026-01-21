import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const ADMIN_AGENT_EMAIL = "rockyhinton987@gmail.com";

export async function seedAdminAgent() {
  const normalizedEmail = ADMIN_AGENT_EMAIL.toLowerCase().trim();
  const existingAgent = await db.select().from(users).where(eq(users.email, normalizedEmail));
  
  if (existingAgent.length === 0) {
    await db.insert(users).values({
      id: `seed-${Date.now()}`,
      email: normalizedEmail,
      firstName: "Admin",
      lastName: "Agent",
      role: "agent",
    });
    console.log(`[seed] Created admin agent: ${normalizedEmail}`);
  } else if (!existingAgent[0].role) {
    await db.update(users)
      .set({ role: "agent", updatedAt: new Date() })
      .where(eq(users.email, normalizedEmail));
    console.log(`[seed] Updated admin agent role: ${normalizedEmail}`);
  } else {
    console.log(`[seed] Admin agent already exists: ${normalizedEmail}`);
  }
}
