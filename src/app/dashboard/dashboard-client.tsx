"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkoutExercise {
  id: string;
  order: number;
  exercise: {
    id: string;
    name: string;
  };
}

interface Workout {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  workoutExercises: WorkoutExercise[];
}

interface DashboardClientProps {
  dateString: string;
  workouts: Workout[];
}

export default function DashboardClient({
  dateString,
  workouts,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const date = new Date(`${dateString}T00:00:00`);

  function handleDateSelect(day: Date | undefined) {
    if (!day) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(day, "yyyy-MM-dd"));
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/workout/new">
            <Button>
              Log New Workout
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline" className="gap-2" />}
            >
              <CalendarIcon className="size-4" />
              {format(date, "do MMM yyyy")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-muted-foreground">
              No workouts logged for this date
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/dashboard/workout/${workout.id}`} className="block">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-bold">{workout.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {format(workout.startedAt, "h:mm a")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        workout.completedAt != null ? "default" : "secondary"
                      }
                    >
                      {workout.completedAt != null ? "Completed" : "In progress"}
                    </Badge>
                    {workout.workoutExercises.map((we) => (
                      <Badge key={we.id} variant="outline">
                        {we.exercise.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
