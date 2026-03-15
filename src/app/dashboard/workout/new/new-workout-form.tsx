"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createWorkoutAction } from "./actions";

function ceilToNearest30(date: Date): Date {
  const ms = 30 * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export default function NewWorkoutForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startedAt, setStartedAt] = useState<Date>(() => ceilToNearest30(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workout name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const [created] = await createWorkoutAction({ name: trimmed, startedAt: startedAt.toISOString() });
      router.push(created ? `/dashboard/workout/${created.id}/edit` : "/dashboard");
    } catch {
      setError("Failed to create workout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Upper Body, Leg Day"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Started At</Label>
              <Popover>
                <PopoverTrigger
                  render={<Button variant="outline" className="w-full justify-between gap-2" />}
                >
                  {format(startedAt, "dd/MM/yyyy HH:mm")}
                  <CalendarIcon className="size-4" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startedAt}
                    onSelect={(day) => {
                      if (!day) return;
                      const updated = new Date(day);
                      updated.setHours(startedAt.getHours(), startedAt.getMinutes());
                      setStartedAt(updated);
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
                        setStartedAt(updated);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Workout"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
