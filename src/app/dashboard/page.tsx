import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getWorkoutsByDate } from "@/data/workouts";
import { getUserSettings } from "@/data/user-settings";
import { getAuthenticatedUser } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await getAuthenticatedUser();
  const settings = await getUserSettings(user.id);

  const { date: dateParam } = await searchParams;

  const dateString = dateParam ?? (
    settings?.timezone
      ? formatInTimeZone(new Date(), settings.timezone, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const workouts = await getWorkoutsByDate(dateString, settings?.timezone ?? undefined);

  return <DashboardClient dateString={dateString} workouts={workouts} />;
}
