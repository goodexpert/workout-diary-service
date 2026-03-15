import { and, eq, max } from "drizzle-orm";
import db from "@/db";
import { workoutExercises, workouts } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getNextExerciseOrder(workoutId: string): Promise<number> {
  const result = await db
    .select({ maxOrder: max(workoutExercises.order) })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  return (result[0]?.maxOrder ?? 0) + 1;
}

export async function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  order: number
) {
  const user = await getAuthenticatedUser();

  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)),
  });

  if (!workout) {
    throw new Error("Workout not found");
  }

  return db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId, order })
    .returning();
}

export async function updateWorkoutExercise(
  workoutExerciseId: string,
  exerciseId: string
) {
  const user = await getAuthenticatedUser();

  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true },
  });

  if (!workoutExercise || workoutExercise.workout.userId !== user.id) {
    throw new Error("Workout exercise not found");
  }

  return db
    .update(workoutExercises)
    .set({ exerciseId })
    .where(eq(workoutExercises.id, workoutExerciseId))
    .returning();
}

export async function removeWorkoutExercise(workoutExerciseId: string) {
  const user = await getAuthenticatedUser();

  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true },
  });

  if (!workoutExercise || workoutExercise.workout.userId !== user.id) {
    throw new Error("Workout exercise not found");
  }

  return db
    .delete(workoutExercises)
    .where(eq(workoutExercises.id, workoutExerciseId))
    .returning();
}
