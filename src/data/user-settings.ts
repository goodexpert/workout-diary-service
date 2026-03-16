import { eq } from "drizzle-orm";
import db from "@/db";
import { userSettings } from "@/db/schema";

export async function getUserSettings(userId: string) {
  return db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  }) ?? null;
}

export async function upsertUserSettings(
  userId: string,
  data: { country?: string; city?: string; timezone?: string }
) {
  return db
    .insert(userSettings)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: data,
    })
    .returning();
}
