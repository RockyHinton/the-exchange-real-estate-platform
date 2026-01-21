import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const ADMIN_AGENT_EMAIL = "rockyhinton987@gmail.com";

export async function seedAdminAgent() {
  const existingAgent = await db.select().from(users).where(eq(users.email, ADMIN_AGENT_EMAIL));
  
  if (existingAgent.length === 0) {
    await db.insert(users).values({
      id: "admin-agent-seed",
      email: ADMIN_AGENT_EMAIL,
      firstName: "Admin",
      lastName: "Agent",
      role: "agent",
    });
    console.log(`[seed] Created admin agent: ${ADMIN_AGENT_EMAIL}`);
  } else if (!existingAgent[0].role) {
    await db.update(users)
      .set({ role: "agent" })
      .where(eq(users.email, ADMIN_AGENT_EMAIL));
    console.log(`[seed] Updated admin agent role: ${ADMIN_AGENT_EMAIL}`);
  } else {
    console.log(`[seed] Admin agent already exists: ${ADMIN_AGENT_EMAIL}`);
  }
}
