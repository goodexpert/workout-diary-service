"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { duplicateWorkoutAction } from "./actions";

interface DuplicateWorkoutDialogProps {
  workoutId: string;
}

export default function DuplicateWorkoutDialog({
  workoutId,
}: DuplicateWorkoutDialogProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [duplicatedDate, setDuplicatedDate] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selectedDate) return;
    setIsPending(true);
    try {
      const targetDate = format(selectedDate, "yyyy-MM-dd");
      await duplicateWorkoutAction({ workoutId, targetDate });
      setDuplicatedDate(targetDate);
    } finally {
      setIsPending(false);
    }
  }

  function handleGoToDate() {
    if (!duplicatedDate) return;
    setOpen(false);
    setDuplicatedDate(null);
    setSelectedDate(undefined);
    router.push(`/dashboard?date=${duplicatedDate}`);
    router.refresh();
  }

  function handleStay() {
    setOpen(false);
    setDuplicatedDate(null);
    setSelectedDate(undefined);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (duplicatedDate) {
            handleStay();
          } else {
            setOpen(false);
            setSelectedDate(undefined);
          }
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        }
      >
        <Copy className="size-4" />
      </DialogTrigger>
      <DialogContent>
        {duplicatedDate ? (
          <>
            <DialogHeader>
              <DialogTitle>Workout Duplicated</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Workout has been duplicated to{" "}
              <span className="font-medium text-foreground">
                {format(new Date(`${duplicatedDate}T00:00:00`), "do MMM yyyy")}
              </span>
              . Would you like to go to that date?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleStay}>
                Stay Here
              </Button>
              <Button onClick={handleGoToDate}>
                Go to Date
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Duplicate Workout</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                autoFocus
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={!selectedDate || isPending}
              >
                {isPending ? "Duplicating..." : "Duplicate"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
