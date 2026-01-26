import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAgentEmails } from "./config";

export async function seedAgents() {
  const agentEmails = getAgentEmails();
  
  if (agentEmails.length === 0) {
    console.log("[seed] No AGENT_EMAILS configured. Skipping agent seeding.");
    return;
  }

  for (const email of agentEmails) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail));
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: normalizedEmail,
        firstName: "Agent",
        lastName: "",
        role: "agent",
      });
      console.log(`[seed] Pre-provisioned agent: ${normalizedEmail}`);
    } else if (!existingUser[0].role || existingUser[0].role !== "agent") {
      await db.update(users)
        .set({ role: "agent", updatedAt: new Date() })
        .where(eq(users.email, normalizedEmail));
      console.log(`[seed] Updated to agent role: ${normalizedEmail}`);
    } else {
      console.log(`[seed] Agent already exists: ${normalizedEmail}`);
    }
  }
}
