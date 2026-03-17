import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const notFoundError = new Error("NEXT_NOT_FOUND");
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => { throw notFoundError; }),
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({ id: "user-1" }),
}));

jest.mock("@/data/workouts", () => ({
  getWorkoutWithExercises: jest.fn(),
}));

jest.mock("@/data/exercises", () => ({
  getAllExercises: jest.fn().mockResolvedValue([
    { id: "e1", name: "Bench Press" },
    { id: "e2", name: "Squat" },
    { id: "e3", name: "Deadlift" },
  ]),
}));

jest.mock("date-fns", () => ({
  format: jest.fn(() => "16th Mar 2026, 9:00 AM"),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }) => <div>{children}</div>,
  PopoverTrigger: ({ children, render }) => render || <button>{children}</button>,
  PopoverContent: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div>Calendar</div>,
}));

jest.mock("lucide-react", () => ({
  PencilIcon: () => <span>PencilIcon</span>,
  Trash2Icon: () => <span>Trash2Icon</span>,
  PlusIcon: () => <span>PlusIcon</span>,
  CheckIcon: () => <span>CheckIcon</span>,
  XIcon: () => <span>XIcon</span>,
  CalendarIcon: () => <span>CalendarIcon</span>,
  CopyIcon: () => <span>CopyIcon</span>,
}));

jest.mock(
  "@/app/dashboard/workout/[workoutId]/actions",
  () => ({
    completeWorkoutAction: jest.fn(),
    updateWorkoutAction: jest.fn(),
    addExerciseToWorkoutAction: jest.fn(),
    removeExerciseFromWorkoutAction: jest.fn(),
    updateExerciseOnWorkoutAction: jest.fn(),
    addSetAction: jest.fn(),
    updateSetAction: jest.fn(),
    removeSetAction: jest.fn(),
  })
);

import { notFound } from "next/navigation";
import EditWorkoutPage from "@/app/dashboard/workout/[workoutId]/edit/page";
import { getWorkoutWithExercises } from "@/data/workouts";

describe("EditWorkoutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders workout in edit mode with 'Complete Workout' button", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: null,
      workoutExercises: [],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    expect(screen.getByText("Upper Body")).toBeInTheDocument();
    expect(screen.getByText("Complete Workout")).toBeInTheDocument();
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  it("shows 'Add Exercise' button in edit mode", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: null,
      workoutExercises: [],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    expect(screen.getByText("Add Exercise")).toBeInTheDocument();
  });

  it("shows empty state message in edit mode", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: null,
      workoutExercises: [],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    expect(
      screen.getByText('No exercises added yet. Click "Add Exercise" to get started.')
    ).toBeInTheDocument();
  });

  it("renders exercises with sets in edit mode", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: null,
      workoutExercises: [
        {
          id: "we1",
          order: 1,
          exercise: { id: "e1", name: "Bench Press" },
          sets: [
            { id: "s1", setNumber: 1, weight: "60", reps: 10 },
          ],
        },
      ],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByText("Reps")).toBeInTheDocument();
  });

  it("disables 'Complete Workout' for already completed workouts", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: new Date("2026-03-16T10:00:00"),
      workoutExercises: [],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    const completedButtons = screen.getAllByText("Completed");
    const button = completedButtons.find((el) => el.tagName === "BUTTON");
    expect(button).toBeDisabled();
  });

  it("calls notFound when workout does not exist", async () => {
    getWorkoutWithExercises.mockResolvedValue(null);

    await expect(
      EditWorkoutPage({ params: Promise.resolve({ workoutId: "nonexistent" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("shows 'In Progress' for incomplete workouts in edit mode", async () => {
    getWorkoutWithExercises.mockResolvedValue({
      id: "w1",
      name: "Upper Body",
      startedAt: new Date("2026-03-16T09:00:00"),
      completedAt: null,
      workoutExercises: [],
    });

    const Component = await EditWorkoutPage({
      params: Promise.resolve({ workoutId: "w1" }),
    });
    render(Component);

    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
});
