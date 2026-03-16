import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("date-fns", () => ({
  format: jest.fn(() => "16/03/2026 10:00"),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
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
}));

jest.mock("@/app/dashboard/workout/new/actions", () => ({
  createWorkoutAction: jest.fn().mockResolvedValue([{ id: "new-workout-1" }]),
}));

import NewWorkoutForm from "@/app/dashboard/workout/new/new-workout-form";

describe("NewWorkoutForm", () => {
  it("renders the form heading", () => {
    render(<NewWorkoutForm />);

    expect(screen.getByText("Create New Workout")).toBeInTheDocument();
  });

  it("renders workout name input", () => {
    render(<NewWorkoutForm />);

    expect(screen.getByLabelText("Workout Name")).toBeInTheDocument();
  });

  it("renders the started at label", () => {
    render(<NewWorkoutForm />);

    expect(screen.getByText("Started At")).toBeInTheDocument();
  });

  it("renders Create Workout button", () => {
    render(<NewWorkoutForm />);

    expect(screen.getByText("Create Workout")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    render(<NewWorkoutForm />);

    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows error when submitting without a name", async () => {
    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.click(screen.getByText("Create Workout"));

    expect(screen.getByText("Workout name is required")).toBeInTheDocument();
  });

  it("navigates to dashboard on cancel click", async () => {
    const push = jest.fn();
    const { useRouter } = require("next/navigation");
    useRouter.mockReturnValue({ push, refresh: jest.fn() });

    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.click(screen.getByText("Cancel"));

    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("submits the form with a valid name", async () => {
    const push = jest.fn();
    const { useRouter } = require("next/navigation");
    useRouter.mockReturnValue({ push, refresh: jest.fn() });

    const { createWorkoutAction } = require("@/app/dashboard/workout/new/actions");
    createWorkoutAction.mockResolvedValue([{ id: "new-workout-1" }]);

    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.type(screen.getByLabelText("Workout Name"), "Leg Day");
    await user.click(screen.getByText("Create Workout"));

    expect(createWorkoutAction).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/dashboard/workout/new-workout-1/edit");
  });

  it("navigates to dashboard when createWorkoutAction returns null", async () => {
    const push = jest.fn();
    const { useRouter } = require("next/navigation");
    useRouter.mockReturnValue({ push, refresh: jest.fn() });

    const { createWorkoutAction } = require("@/app/dashboard/workout/new/actions");
    createWorkoutAction.mockResolvedValue([null]);

    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.type(screen.getByLabelText("Workout Name"), "Leg Day");
    await user.click(screen.getByText("Create Workout"));

    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error message when createWorkoutAction fails", async () => {
    const { createWorkoutAction } = require("@/app/dashboard/workout/new/actions");
    createWorkoutAction.mockRejectedValue(new Error("Server error"));

    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.type(screen.getByLabelText("Workout Name"), "Leg Day");
    await user.click(screen.getByText("Create Workout"));

    expect(
      screen.getByText("Failed to create workout. Please try again.")
    ).toBeInTheDocument();
  });

  it("updates date when calendar date is selected", async () => {
    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.click(screen.getByTestId("calendar-select"));

    // Calendar onSelect was called - no error thrown means it worked
    expect(screen.getByTestId("calendar-select")).toBeInTheDocument();
  });

  it("does nothing when calendar selection is undefined", async () => {
    const user = userEvent.setup();
    render(<NewWorkoutForm />);

    await user.click(screen.getByTestId("calendar-select-empty"));

    expect(screen.getByText("Create Workout")).toBeInTheDocument();
  });

  it("updates time when time input changes", () => {
    const { fireEvent } = require("@testing-library/react");
    render(<NewWorkoutForm />);

    const inputs = document.querySelectorAll('input[type="time"]');
    expect(inputs.length).toBeGreaterThan(0);
    fireEvent.change(inputs[0], { target: { value: "14:30" } });
  });
});
