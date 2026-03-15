"use server";

import { z } from "zod";
import { completeWorkout, updateWorkout } from "@/data/workouts";
import {
  addWorkoutExercise,
  getNextExerciseOrder,
  removeWorkoutExercise,
  updateWorkoutExercise,
} from "@/data/workout-exercises";
import { addSet, getNextSetNumber, removeSet, updateSet } from "@/data/sets";
import { getAuthenticatedUser } from "@/lib/auth";

const UpdateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  startedAt: z.string().datetime(),
});

export async function updateWorkoutAction(
  workoutId: string,
  params: { name: string; startedAt: string }
) {
  const user = await getAuthenticatedUser();
  const validated = UpdateWorkoutSchema.parse(params);
  return updateWorkout(workoutId, user.id, {
    name: validated.name,
    startedAt: new Date(validated.startedAt),
  });
}

const CompleteWorkoutSchema = z.object({
  workoutId: z.string().min(1),
});

export async function completeWorkoutAction(workoutId: string) {
  const user = await getAuthenticatedUser();
  const validated = CompleteWorkoutSchema.parse({ workoutId });
  return completeWorkout(validated.workoutId, user.id);
}

const AddExerciseSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
});

export async function addExerciseToWorkoutAction(
  workoutId: string,
  exerciseId: string
) {
  AddExerciseSchema.parse({ workoutId, exerciseId });
  const order = await getNextExerciseOrder(workoutId);
  return addWorkoutExercise(workoutId, exerciseId, order);
}

const RemoveExerciseSchema = z.object({
  workoutExerciseId: z.string().min(1),
});

export async function removeExerciseFromWorkoutAction(
  workoutExerciseId: string
) {
  RemoveExerciseSchema.parse({ workoutExerciseId });
  return removeWorkoutExercise(workoutExerciseId);
}

const UpdateExerciseSchema = z.object({
  workoutExerciseId: z.string().min(1),
  exerciseId: z.string().min(1),
});

export async function updateExerciseOnWorkoutAction(
  workoutExerciseId: string,
  exerciseId: string
) {
  UpdateExerciseSchema.parse({ workoutExerciseId, exerciseId });
  return updateWorkoutExercise(workoutExerciseId, exerciseId);
}

const AddSetSchema = z.object({
  workoutExerciseId: z.string().min(1),
  weight: z.string().nullable(),
  reps: z.number().int().nonnegative().nullable(),
});

export async function addSetAction(
  workoutExerciseId: string,
  params: { weight: string | null; reps: number | null }
) {
  const validated = AddSetSchema.parse({ workoutExerciseId, ...params });
  const setNumber = await getNextSetNumber(workoutExerciseId);
  return addSet(validated.workoutExerciseId, {
    setNumber,
    weight: validated.weight,
    reps: validated.reps,
  });
}

const UpdateSetSchema = z.object({
  setId: z.string().min(1),
  weight: z.string().nullable().optional(),
  reps: z.number().int().nonnegative().nullable().optional(),
});

export async function updateSetAction(
  setId: string,
  params: { weight?: string | null; reps?: number | null }
) {
  const validated = UpdateSetSchema.parse({ setId, ...params });
  return updateSet(validated.setId, {
    weight: validated.weight,
    reps: validated.reps,
  });
}

const RemoveSetSchema = z.object({
  setId: z.string().min(1),
});

export async function removeSetAction(setId: string) {
  RemoveSetSchema.parse({ setId });
  return removeSet(setId);
}
