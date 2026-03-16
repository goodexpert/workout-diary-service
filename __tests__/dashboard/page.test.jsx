import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

jest.mock("date-fns", () => ({
  format: jest.fn((date, fmt) => {
    if (fmt === "yyyy-MM-dd") return "2026-03-16";
    if (fmt === "do MMM yyyy") return "16th Mar 2026";
    if (fmt === "h:mm a") return "9:00 AM";
    return "mock-date";
  }),
}));

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({ id: "user-1" }),
}));

jest.mock("@/data/workouts", () => ({
  getWorkoutsByDate: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
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

jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }) => (
    <div>
      <button data-testid="calendar-select" onClick={() => onSelect(new Date("2026-04-01T00:00:00"))}>
        Calendar
      </button>
      <button data-testid="calendar-select-empty" onClick={() => onSelect(undefined)}>
        CalendarEmpty
      </button>
    </div>
  ),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }) => <div>{children}</div>,
  PopoverTrigger: ({ children, render }) => render || <button>{children}</button>,
  PopoverContent: ({ children }) => <div>{children}</div>,
}));

jest.mock("lucide-react", () => ({
  CalendarIcon: () => <span>CalendarIcon</span>,
  FilePlusCorner: () => <span>FilePlusCorner</span>,
  Copy: () => <span>CopyIcon</span>,
  Trash2: () => <span>TrashIcon</span>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }) => <div>{children}</div>,
  DialogTrigger: ({ children }) => <button>{children}</button>,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogClose: ({ children }) => <button>{children}</button>,
}));

jest.mock("@/app/dashboard/actions", () => ({
  duplicateWorkoutAction: jest.fn().mockResolvedValue({ id: "new-workout-id" }),
  deleteWorkoutAction: jest.fn().mockResolvedValue(undefined),
}));

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import DashboardClient from "@/app/dashboard/dashboard-client";

describe("DashboardClient", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardClient dateString="2026-03-16" workouts={[]} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders 'Log New Workout' button", () => {
    render(<DashboardClient dateString="2026-03-16" workouts={[]} />);

    expect(screen.getByText("Log New Workout")).toBeInTheDocument();
  });

  it("shows empty state when no workouts", () => {
    render(<DashboardClient dateString="2026-03-16" workouts={[]} />);

    expect(
      screen.getByText("No workouts logged for this date")
    ).toBeInTheDocument();
  });

  it("renders workout cards when workouts exist", () => {
    const workouts = [
      {
        id: "w1",
        name: "Upper Body",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: new Date("2026-03-16T10:00:00"),
        workoutExercises: [
          { id: "we1", order: 1, exercise: { id: "e1", name: "Bench Press" } },
        ],
      },
      {
        id: "w2",
        name: "Leg Day",
        startedAt: new Date("2026-03-16T14:00:00"),
        completedAt: null,
        workoutExercises: [],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    expect(screen.getAllByText("Upper Body").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Leg Day").length).toBeGreaterThanOrEqual(1);
  });

  it("shows completion badge for completed workouts", () => {
    const workouts = [
      {
        id: "w1",
        name: "Upper Body",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: new Date("2026-03-16T10:00:00"),
        workoutExercises: [],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows 'In progress' badge for incomplete workouts", () => {
    const workouts = [
      {
        id: "w1",
        name: "Leg Day",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: null,
        workoutExercises: [],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders exercise badges on workout cards", () => {
    const workouts = [
      {
        id: "w1",
        name: "Upper Body",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: null,
        workoutExercises: [
          { id: "we1", order: 1, exercise: { id: "e1", name: "Bench Press" } },
          { id: "we2", order: 2, exercise: { id: "e2", name: "Shoulder Press" } },
        ],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Shoulder Press")).toBeInTheDocument();
  });

  it("navigates to new date when calendar date is selected", async () => {
    const push = jest.fn();
    useRouter.mockReturnValue({ push, refresh: jest.fn() });

    const user = userEvent.setup();
    render(<DashboardClient dateString="2026-03-16" workouts={[]} />);

    await user.click(screen.getByTestId("calendar-select"));

    expect(push).toHaveBeenCalledWith("/dashboard?date=2026-03-16");
  });

  it("does nothing when calendar selection is undefined", async () => {
    const push = jest.fn();
    useRouter.mockReturnValue({ push, refresh: jest.fn() });

    const user = userEvent.setup();
    render(<DashboardClient dateString="2026-03-16" workouts={[]} />);

    await user.click(screen.getByTestId("calendar-select-empty"));

    expect(push).not.toHaveBeenCalled();
  });

  it("renders duplicate button on each workout card", () => {
    const workouts = [
      {
        id: "w1",
        name: "Upper Body",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: null,
        workoutExercises: [],
      },
      {
        id: "w2",
        name: "Leg Day",
        startedAt: new Date("2026-03-16T14:00:00"),
        completedAt: null,
        workoutExercises: [],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    const copyIcons = screen.getAllByText("CopyIcon");
    expect(copyIcons).toHaveLength(2);
  });

  it("renders duplicate workout dialog title", () => {
    const workouts = [
      {
        id: "w1",
        name: "Upper Body",
        startedAt: new Date("2026-03-16T09:00:00"),
        completedAt: null,
        workoutExercises: [],
      },
    ];

    render(<DashboardClient dateString="2026-03-16" workouts={workouts} />);

    expect(screen.getByText("Duplicate Workout")).toBeInTheDocument();
  });

});
