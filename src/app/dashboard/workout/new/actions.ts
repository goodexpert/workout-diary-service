"use server";

import { z } from "zod";
import { createWorkout } from "@/data/workouts";
import { getAuthenticatedUser } from "@/lib/auth";

const CreateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  startedAt: z.string().datetime(),
});

export async function createWorkoutAction(params: {
  name: string;
  startedAt: string;
}) {
  const user = await getAuthenticatedUser();
  const validated = CreateWorkoutSchema.parse(params);
  return createWorkout({
    name: validated.name,
    userId: user.id,
    startedAt: new Date(validated.startedAt),
  });
}
