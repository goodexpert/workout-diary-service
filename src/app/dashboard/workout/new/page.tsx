import { getAuthenticatedUser } from "@/lib/auth";
import NewWorkoutForm from "./new-workout-form";

export default async function NewWorkoutPage() {
  await getAuthenticatedUser();

  return <NewWorkoutForm />;
}
