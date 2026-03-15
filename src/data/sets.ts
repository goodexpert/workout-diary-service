import { eq, max } from "drizzle-orm";
import db from "@/db";
import { sets } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

async function verifySetOwnership(setId: string) {
  const user = await getAuthenticatedUser();

  const set = await db.query.sets.findFirst({
    where: eq(sets.id, setId),
    with: { workoutExercise: { with: { workout: true } } },
  });

  if (!set || set.workoutExercise.workout.userId !== user.id) {
    throw new Error("Set not found");
  }

  return set;
}

async function verifyWorkoutExerciseOwnership(workoutExerciseId: string) {
  const user = await getAuthenticatedUser();

  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: (we, { eq }) => eq(we.id, workoutExerciseId),
    with: { workout: true },
  });

  if (!workoutExercise || workoutExercise.workout.userId !== user.id) {
    throw new Error("Workout exercise not found");
  }

  return workoutExercise;
}

export async function getNextSetNumber(workoutExerciseId: string): Promise<number> {
  const result = await db
    .select({ maxSetNumber: max(sets.setNumber) })
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId));

  return (result[0]?.maxSetNumber ?? 0) + 1;
}

export async function addSet(
  workoutExerciseId: string,
  data: { setNumber: number; weight: string | null; reps: number | null }
) {
  await verifyWorkoutExerciseOwnership(workoutExerciseId);

  return db
    .insert(sets)
    .values({ workoutExerciseId, ...data })
    .returning();
}

export async function updateSet(
  setId: string,
  data: { weight?: string | null; reps?: number | null }
) {
  await verifySetOwnership(setId);

  return db
    .update(sets)
    .set(data)
    .where(eq(sets.id, setId))
    .returning();
}

export async function removeSet(setId: string) {
  await verifySetOwnership(setId);

  return db
    .delete(sets)
    .where(eq(sets.id, setId))
    .returning();
}
