import { and, eq, gte, lt } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import db from "@/db";
import { workouts, workoutExercises, sets } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getWorkoutById(id: string) {
  const user = await getAuthenticatedUser();

  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, id), eq(workouts.userId, user.id)),
  });
}

export async function getWorkoutWithExercises(id: string) {
  const user = await getAuthenticatedUser();

  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, id), eq(workouts.userId, user.id)),
    with: {
      workoutExercises: {
        with: { exercise: true, sets: true },
        orderBy: (we, { asc }) => [asc(we.order)],
      },
    },
  });
}

export async function completeWorkout(id: string, userId: string) {
  return db
    .update(workouts)
    .set({ completedAt: new Date() })
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();
}

export async function updateWorkout(
  id: string,
  userId: string,
  data: { name: string; startedAt: Date }
) {
  return db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();
}

export async function createWorkout(data: { name: string; userId: string; startedAt: Date }) {
  return db.insert(workouts).values(data).returning();
}

export async function duplicateWorkout(
  workoutId: string,
  targetDate: Date,
  userId: string
) {
  const original = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    with: {
      workoutExercises: {
        with: { sets: true },
        orderBy: (we, { asc }) => [asc(we.order)],
      },
    },
  });

  if (!original) throw new Error("Workout not found");

  const originalStart = new Date(original.startedAt);
  const newStartedAt = new Date(targetDate);
  newStartedAt.setHours(
    originalStart.getHours(),
    originalStart.getMinutes(),
    originalStart.getSeconds(),
    originalStart.getMilliseconds()
  );

  const [newWorkout] = await db
    .insert(workouts)
    .values({
      userId,
      name: original.name,
      startedAt: newStartedAt,
      completedAt: null,
    })
    .returning();

  for (const we of original.workoutExercises) {
    const [newWe] = await db
      .insert(workoutExercises)
      .values({
        workoutId: newWorkout.id,
        exerciseId: we.exerciseId,
        order: we.order,
      })
      .returning();

    if (we.sets.length > 0) {
      await db.insert(sets).values(
        we.sets.map((s) => ({
          workoutExerciseId: newWe.id,
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
        }))
      );
    }
  }

  return newWorkout;
}

export async function deleteWorkout(workoutId: string, userId: string) {
  return db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}

export async function getWorkoutsByDate(dateString: string, timezone?: string) {
  const user = await getAuthenticatedUser();

  const [year, month, day] = dateString.split("-").map(Number);
  let dayStart: Date;
  let dayEnd: Date;

  if (timezone) {
    dayStart = fromZonedTime(new Date(year, month - 1, day), timezone);
    dayEnd = fromZonedTime(new Date(year, month - 1, day + 1), timezone);
  } else {
    dayStart = new Date(year, month - 1, day);
    dayEnd = new Date(year, month - 1, day + 1);
  }

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, user.id),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd),
    ),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
        },
        orderBy: (we, { asc }) => [asc(we.order)],
      },
    },
    orderBy: (w, { asc }) => [asc(w.startedAt)],
  });
}
