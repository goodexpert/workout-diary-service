"use server";

import { z } from "zod";
import { getUserSettings, upsertUserSettings } from "@/data/user-settings";
import { getAuthenticatedUser } from "@/lib/auth";

const UpdateLocationSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
});

export async function updateLocationSettingsAction(params: {
  country?: string;
  city?: string;
  timezone?: string;
}) {
  const user = await getAuthenticatedUser();
  const validated = UpdateLocationSchema.parse(params);
  return upsertUserSettings(user.id, validated);
}

export async function initializeSettingsAction(browser: {
  timezone: string;
  country: string;
  city: string;
}) {
  const user = await getAuthenticatedUser();
  const settings = await getUserSettings(user.id);

  const updates: { timezone?: string; country?: string; city?: string } = {};
  if (!settings?.timezone && browser.timezone) updates.timezone = browser.timezone;
  if (!settings?.country && browser.country) updates.country = browser.country;
  if (!settings?.city && browser.city) updates.city = browser.city;

  if (Object.keys(updates).length === 0) return;
  await upsertUserSettings(user.id, updates);
}
