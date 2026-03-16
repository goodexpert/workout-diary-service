"use server";

import { z } from "zod";
import { deleteWorkout, duplicateWorkout } from "@/data/workouts";
import { getAuthenticatedUser } from "@/lib/auth";

const DeleteWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
});

export async function deleteWorkoutAction(params: { workoutId: string }) {
  const user = await getAuthenticatedUser();
  const validated = DeleteWorkoutSchema.parse(params);
  await deleteWorkout(validated.workoutId, user.id);
}

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
