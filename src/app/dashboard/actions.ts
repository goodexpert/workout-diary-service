"use server";

import { z } from "zod";
import { duplicateWorkout } from "@/data/workouts";
import { getAuthenticatedUser } from "@/lib/auth";

const DuplicateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function duplicateWorkoutAction(params: {
  workoutId: string;
  targetDate: string;
}) {
  const user = await getAuthenticatedUser();
  const validated = DuplicateWorkoutSchema.parse(params);
  return duplicateWorkout(
    validated.workoutId,
    new Date(`${validated.targetDate}T00:00:00.000Z`),
    user.id
  );
}
