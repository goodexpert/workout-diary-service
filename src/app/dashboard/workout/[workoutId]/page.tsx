import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { getWorkoutWithExercises } from "@/data/workouts";
import WorkoutForm from "./workout-form";

export default async function ViewWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  await getAuthenticatedUser();

  const { workoutId } = await params;
  const workout = await getWorkoutWithExercises(workoutId);

  if (!workout) {
    notFound();
  }

  return (
    <WorkoutForm
      mode="view"
      workoutId={workout.id}
      initialName={workout.name}
      initialStartedAt={workout.startedAt.toISOString()}
      initialCompletedAt={workout.completedAt?.toISOString() ?? null}
      workoutExercises={workout.workoutExercises.map((we) => ({
        id: we.id,
        order: we.order,
        exercise: { id: we.exercise.id, name: we.exercise.name },
        sets: we.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
        })),
      }))}
      exerciseCatalog={[]}
    />
  );
}
