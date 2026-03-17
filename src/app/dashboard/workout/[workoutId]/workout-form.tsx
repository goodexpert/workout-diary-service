"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { PencilIcon, Trash2Icon, PlusIcon, CheckIcon, XIcon, CalendarIcon, CopyIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  completeWorkoutAction,
  updateWorkoutAction,
  addExerciseToWorkoutAction,
  removeExerciseFromWorkoutAction,
  updateExerciseOnWorkoutAction,
  addSetAction,
  updateSetAction,
  removeSetAction,
} from "./actions";

interface SetData {
  id: string;
  setNumber: number;
  weight: string | null;
  reps: number | null;
}

interface WorkoutExerciseData {
  id: string;
  order: number;
  exercise: { id: string; name: string };
  sets: SetData[];
}

interface WorkoutFormProps {
  mode: "view" | "edit";
  workoutId: string;
  initialName: string;
  initialStartedAt: string;
  initialCompletedAt: string | null;
  workoutExercises: WorkoutExerciseData[];
  exerciseCatalog: { id: string; name: string }[];
}

export default function WorkoutForm({
  mode,
  workoutId,
  initialName,
  initialStartedAt,
  initialCompletedAt,
  workoutExercises,
  exerciseCatalog,
}: WorkoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dashboardPath = dateParam ? `/dashboard?date=${dateParam}` : "/dashboard";
  const isEditing = mode === "edit";
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(initialName);
  const [editName, setEditName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exercisePopoverOpen, setExercisePopoverOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<Date>(new Date(initialStartedAt));

  const isCompleted = !!initialCompletedAt;

  const existingExerciseIds = new Set(
    workoutExercises.map((we) => we.exercise.id)
  );
  const filteredExercises = exerciseCatalog.filter(
    (e) =>
      !existingExerciseIds.has(e.id) &&
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  async function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === name) {
      setEditName(name);
      setIsEditingName(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateWorkoutAction(workoutId, {
        name: trimmed,
        startedAt: startedAt.toISOString(),
      });
      setName(trimmed);
      setIsEditingName(false);
      router.refresh();
    } catch {
      setEditName(name);
      setIsEditingName(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStartedAt(newDate: Date) {
    setStartedAt(newDate);
    try {
      await updateWorkoutAction(workoutId, {
        name,
        startedAt: newDate.toISOString(),
      });
      router.refresh();
    } catch {
      setStartedAt(new Date(initialStartedAt));
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      await completeWorkoutAction(workoutId);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddExercise(exerciseId: string) {
    setIsSubmitting(true);
    setExercisePopoverOpen(false);
    setExerciseSearch("");
    try {
      const [workoutExercise] = await addExerciseToWorkoutAction(workoutId, exerciseId);
      await addSetAction(workoutExercise.id, { weight: null, reps: null });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveExercise(workoutExerciseId: string) {
    setIsSubmitting(true);
    try {
      await removeExerciseFromWorkoutAction(workoutExerciseId);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangeExercise(
    workoutExerciseId: string,
    exerciseId: string
  ) {
    setIsSubmitting(true);
    try {
      await updateExerciseOnWorkoutAction(workoutExerciseId, exerciseId);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddSet(workoutExerciseId: string) {
    setIsSubmitting(true);
    try {
      await addSetAction(workoutExerciseId, { weight: null, reps: null });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateSet(
    setId: string,
    data: { weight?: string | null; reps?: number | null }
  ) {
    try {
      await updateSetAction(setId, data);
      router.refresh();
    } catch {
      // ignore
    }
  }

  async function handleDuplicateSet(
    workoutExerciseId: string,
    weight: string | null,
    reps: number | null
  ) {
    setIsSubmitting(true);
    try {
      await addSetAction(workoutExerciseId, { weight, reps });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveSet(setId: string) {
    setIsSubmitting(true);
    try {
      await removeSetAction(setId);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isEditing && isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditName(name);
                      setIsEditingName(false);
                    }
                  }}
                  className="text-2xl font-bold h-auto py-1"
                  autoFocus
                  disabled={isSubmitting}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveName}
                  disabled={isSubmitting}
                >
                  <CheckIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditName(name);
                    setIsEditingName(false);
                  }}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{name}</h1>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingName(true)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isEditing ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="ghost" size="sm" className="h-auto px-1 py-0 text-muted-foreground hover:text-foreground">
                      <CalendarIcon className="size-3 mr-1" />
                      {format(startedAt, "do MMM yyyy, h:mm a")}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startedAt}
                    onSelect={(day) => {
                      if (!day) return;
                      const updated = new Date(day);
                      updated.setHours(startedAt.getHours(), startedAt.getMinutes());
                      handleUpdateStartedAt(updated);
                    }}
                    autoFocus
                  />
                  <div className="border-t px-3 py-2">
                    <Input
                      type="time"
                      value={format(startedAt, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":").map(Number);
                        const updated = new Date(startedAt);
                        updated.setHours(hours, minutes);
                        handleUpdateStartedAt(updated);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span suppressHydrationWarning>{format(startedAt, "do MMM yyyy, h:mm a")}</span>
            )}
            <span>&middot;</span>
            {isEditing ? (
              <span>{isCompleted ? "Completed" : "In Progress"}</span>
            ) : (
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {isCompleted ? "Completed" : "In Progress"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isEditing ? (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || isCompleted}
            >
              {isCompleted ? "Completed" : "Complete Workout"}
            </Button>
          ) : (
            <Link href={`/dashboard/workout/${workoutId}/edit${dateParam ? `?date=${dateParam}` : ""}`}>
              <Button>Edit Workout</Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(dashboardPath)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Exercise Cards */}
      {workoutExercises.map((we) => (
        <ExerciseCard
          key={we.id}
          mode={mode}
          workoutExercise={we}
          exerciseCatalog={exerciseCatalog}
          isSubmitting={isSubmitting}
          onRemoveExercise={handleRemoveExercise}
          onChangeExercise={handleChangeExercise}
          onAddSet={handleAddSet}
          onUpdateSet={handleUpdateSet}
          onRemoveSet={handleRemoveSet}
          onDuplicateSet={handleDuplicateSet}
        />
      ))}

      {workoutExercises.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {isEditing
            ? 'No exercises added yet. Click "Add Exercise" to get started.'
            : "No exercises in this workout."}
        </p>
      )}

      {/* Add Exercise - edit mode only */}
      {isEditing && (
        <Popover open={exercisePopoverOpen} onOpenChange={setExercisePopoverOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-full" disabled={isSubmitting}>
                <PlusIcon className="size-4 mr-2" />
                Add Exercise
              </Button>
            }
          />
          <PopoverContent className="w-72 p-2" align="start">
            <Input
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="mb-2"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-1">
                  No exercises found
                </p>
              ) : (
                filteredExercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleAddExercise(exercise.id)}
                    disabled={isSubmitting}
                  >
                    {exercise.name}
                  </Button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </main>
  );
}

function ExerciseCard({
  mode,
  workoutExercise,
  exerciseCatalog,
  isSubmitting,
  onRemoveExercise,
  onChangeExercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onDuplicateSet,
}: {
  mode: "view" | "edit";
  workoutExercise: WorkoutExerciseData;
  exerciseCatalog: { id: string; name: string }[];
  isSubmitting: boolean;
  onRemoveExercise: (id: string) => void;
  onChangeExercise: (workoutExerciseId: string, exerciseId: string) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onUpdateSet: (
    setId: string,
    data: { weight?: string | null; reps?: number | null }
  ) => void;
  onRemoveSet: (setId: string) => void;
  onDuplicateSet: (
    workoutExerciseId: string,
    weight: string | null,
    reps: number | null
  ) => void;
}) {
  const isEditing = mode === "edit";
  const [changePopoverOpen, setChangePopoverOpen] = useState(false);
  const [changeSearch, setChangeSearch] = useState("");

  const filteredExercises = exerciseCatalog.filter(
    (e) =>
      e.id !== workoutExercise.exercise.id &&
      e.name.toLowerCase().includes(changeSearch.toLowerCase())
  );

  return (
    <Card className="relative">
      <CardHeader className={isEditing ? "pr-24" : undefined}>
        {isEditing ? (
          <Popover open={changePopoverOpen} onOpenChange={setChangePopoverOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={
                <CardTitle className="cursor-pointer hover:underline">
                  {workoutExercise.exercise.name}
                </CardTitle>
              }
            />
            <PopoverContent className="w-72 p-2" align="start">
              <Input
                placeholder="Search exercises..."
                value={changeSearch}
                onChange={(e) => setChangeSearch(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-1">
                    No exercises found
                  </p>
                ) : (
                  filteredExercises.map((exercise) => (
                    <Button
                      key={exercise.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        onChangeExercise(workoutExercise.id, exercise.id);
                        setChangePopoverOpen(false);
                        setChangeSearch("");
                      }}
                      disabled={isSubmitting}
                    >
                      {exercise.name}
                    </Button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <CardTitle>{workoutExercise.exercise.name}</CardTitle>
        )}
      </CardHeader>
      {isEditing && (
        <div className="absolute top-4 right-4 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddSet(workoutExercise.id)}
            disabled={isSubmitting}
          >
            <PlusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveExercise(workoutExercise.id)}
            disabled={isSubmitting}
          >
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        </div>
      )}
      <CardContent className="space-y-2">
        {workoutExercise.sets.length > 0 && (
          <div className={`grid ${isEditing ? "grid-cols-[auto_1fr_1fr_auto]" : "grid-cols-[auto_1fr_1fr]"} gap-2 items-center text-sm font-medium text-muted-foreground pb-1`}>
            <span>#</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            {isEditing && <span />}
          </div>
        )}
        {workoutExercise.sets
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((set) => (
            <SetRow
              key={set.id}
              mode={mode}
              set={set}
              isSubmitting={isSubmitting}
              onUpdate={onUpdateSet}
              onRemove={onRemoveSet}
              onDuplicate={() =>
                onDuplicateSet(workoutExercise.id, set.weight, set.reps)
              }
            />
          ))}
      </CardContent>
    </Card>
  );
}

function SetRow({
  mode,
  set,
  isSubmitting,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  mode: "view" | "edit";
  set: SetData;
  isSubmitting: boolean;
  onUpdate: (
    setId: string,
    data: { weight?: string | null; reps?: number | null }
  ) => void;
  onRemove: (setId: string) => void;
  onDuplicate: () => void;
}) {
  const isEditing = mode === "edit";
  const [weight, setWeight] = useState(set.weight ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  function handleWeightBlur() {
    const raw = weight.trim() || null;
    const newWeight = raw !== null && parseFloat(raw) < 0 ? "0" : raw;
    if (newWeight !== raw) setWeight(newWeight ?? "");
    if (newWeight !== set.weight) {
      onUpdate(set.id, { weight: newWeight });
    }
  }

  function handleRepsBlur() {
    const parsed = reps.trim() ? parseInt(reps, 10) : null;
    const clamped = parsed !== null && parsed < 0 ? 0 : parsed;
    if (clamped !== parsed) setReps(clamped?.toString() ?? "");
    if (clamped !== set.reps) {
      onUpdate(set.id, { reps: clamped });
    }
  }

  return (
    <div className={`grid ${isEditing ? "grid-cols-[auto_1fr_1fr_auto]" : "grid-cols-[auto_1fr_1fr]"} gap-2 items-center`}>
      <span className="text-sm text-muted-foreground w-6 text-center">
        {set.setNumber}
      </span>
      {isEditing ? (
        <>
          <Input
            type="number"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={handleWeightBlur}
            placeholder="Weight"
            className="h-8"
            disabled={isSubmitting}
          />
          <Input
            type="number"
            min="0"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={handleRepsBlur}
            placeholder="Reps"
            className="h-8"
            disabled={isSubmitting}
          />
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onDuplicate}
              disabled={isSubmitting}
            >
              <CopyIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onRemove(set.id)}
              disabled={isSubmitting}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="text-sm">{set.weight ?? "-"}</span>
          <span className="text-sm">{set.reps ?? "-"}</span>
        </>
      )}
    </div>
  );
}
