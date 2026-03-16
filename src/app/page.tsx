import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dumbbell, ListChecks, CalendarSearch } from "lucide-react";

export default async function Home() {
  let isAuthenticated = false;
  try {
    await getAuthenticatedUser();
    isAuthenticated = true;
  } catch {
    // User is not authenticated, continue to render homepage
  }

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your Personal Workout Diary
        </h2>
        <p className="max-w-lg text-lg text-muted-foreground">
          Track your workouts, log exercises and sets, and review your fitness
          progress — all in one place.
        </p>
        <SignUpButton mode="modal">
          <Button size="lg" className="mt-2 text-base">
            Get Started
          </Button>
        </SignUpButton>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-4xl px-6 pb-24">
        <p className="mb-8 text-center text-sm font-semibold tracking-widest text-muted-foreground">
          FEATURES
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="text-center">
            <CardHeader className="items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Dumbbell className="h-6 w-6" />
              </div>
              <CardTitle>Track Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Log each workout session with date and exercises.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ListChecks className="h-6 w-6" />
              </div>
              <CardTitle>Monitor Sets & Reps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Record weight and repetitions for every set you perform.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarSearch className="h-6 w-6" />
              </div>
              <CardTitle>Review Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse your workout history by date.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="flex w-full flex-col items-center gap-4 bg-muted px-6 py-16 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Ready to start your fitness journey?
        </h3>
        <p className="text-muted-foreground">
          Sign up for free and begin tracking your workouts today.
        </p>
        <SignUpButton mode="modal">
          <Button size="lg" className="mt-2 text-base">
            Get Started
          </Button>
        </SignUpButton>
      </section>
    </div>
  );
}
