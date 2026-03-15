import { format } from "date-fns";
import { getWorkoutsByDate } from "@/data/workouts";
import { getAuthenticatedUser } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await getAuthenticatedUser();

  const { date: dateParam } = await searchParams;

  const dateString = dateParam ?? format(new Date(), "yyyy-MM-dd");
  const workouts = await getWorkoutsByDate(dateString);

  return <DashboardClient dateString={dateString} workouts={workouts} />;
}
