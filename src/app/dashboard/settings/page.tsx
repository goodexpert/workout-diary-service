import { getAuthenticatedUser } from "@/lib/auth";
import { getUserSettings } from "@/data/user-settings";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  const settings = await getUserSettings(user.id);

  return (
    <SettingsClient
      settings={settings ?? { country: null, city: null, timezone: null }}
    />
  );
}
