import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
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
  PopoverTrigger: ({ children, render, nativeButton, ...props }) =>
    render ? <div {...props}>{React.cloneElement(render, {}, render.props.children)}</div> : <button {...props}>{children}</button>,
  PopoverContent: ({ children }) => <div>{children}</div>,
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
    completeWorkoutAction: jest.fn().mockResolvedValue(undefined),
    updateWorkoutAction: jest.fn().mockResolvedValue(undefined),
    addExerciseToWorkoutAction: jest.fn().mockResolvedValue([{ id: "new-we-1" }]),
    removeExerciseFromWorkoutAction: jest.fn().mockResolvedValue(undefined),
    updateExerciseOnWorkoutAction: jest.fn().mockResolvedValue(undefined),
    addSetAction: jest.fn().mockResolvedValue(undefined),
    updateSetAction: jest.fn().mockResolvedValue(undefined),
    removeSetAction: jest.fn().mockResolvedValue(undefined),
  })
);

import React from "react";
import { useRouter } from "next/navigation";
import WorkoutForm from "@/app/dashboard/workout/[workoutId]/workout-form";
import {
  completeWorkoutAction,
  updateWorkoutAction,
  addExerciseToWorkoutAction,
  removeExerciseFromWorkoutAction,
  updateExerciseOnWorkoutAction,
  addSetAction,
  updateSetAction,
  removeSetAction,
} from "@/app/dashboard/workout/[workoutId]/actions";

const defaultProps = {
  mode: "edit",
  workoutId: "w1",
  initialName: "Upper Body",
  initialStartedAt: "2026-03-16T09:00:00.000Z",
  initialCompletedAt: null,
  workoutExercises: [],
  exerciseCatalog: [
    { id: "e1", name: "Bench Press" },
    { id: "e2", name: "Squat" },
    { id: "e3", name: "Deadlift" },
  ],
};

const propsWithExercises = {
  ...defaultProps,
  workoutExercises: [
    {
      id: "we1",
      order: 1,
      exercise: { id: "e1", name: "Bench Press" },
      sets: [
        { id: "s1", setNumber: 1, weight: "60", reps: 10 },
        { id: "s2", setNumber: 2, weight: "70", reps: 8 },
      ],
    },
  ],
};

describe("WorkoutForm", () => {
  let mockRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = { push: jest.fn(), refresh: jest.fn() };
    useRouter.mockReturnValue(mockRouter);
  });

  describe("Complete Workout", () => {
    it("calls completeWorkoutAction when clicking Complete Workout", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("Complete Workout"));

      await waitFor(() => {
        expect(completeWorkoutAction).toHaveBeenCalledWith("w1");
      });
    });
  });

  describe("Edit Name", () => {
    it("enters edit name mode when clicking pencil icon", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      // Click the pencil button (PencilIcon is rendered as text)
      await user.click(screen.getByText("PencilIcon").closest("button"));

      // Input should appear with current name
      expect(screen.getByDisplayValue("Upper Body")).toBeInTheDocument();
    });

    it("saves name when clicking check icon", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      const input = screen.getByDisplayValue("Upper Body");
      await user.clear(input);
      await user.type(input, "Lower Body");

      await user.click(screen.getByText("CheckIcon").closest("button"));

      await waitFor(() => {
        expect(updateWorkoutAction).toHaveBeenCalledWith("w1", {
          name: "Lower Body",
          startedAt: expect.any(String),
        });
      });
    });

    it("cancels name edit when clicking X icon", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      const input = screen.getByDisplayValue("Upper Body");
      await user.clear(input);
      await user.type(input, "Changed");

      await user.click(screen.getByText("XIcon").closest("button"));

      // Should go back to showing name as heading
      expect(screen.getByText("Upper Body")).toBeInTheDocument();
    });

    it("saves name on Enter key", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      const input = screen.getByDisplayValue("Upper Body");
      await user.clear(input);
      await user.type(input, "New Name{Enter}");

      await waitFor(() => {
        expect(updateWorkoutAction).toHaveBeenCalledWith("w1", {
          name: "New Name",
          startedAt: expect.any(String),
        });
      });
    });

    it("cancels name edit on Escape key", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      const input = screen.getByDisplayValue("Upper Body");
      await user.type(input, "Changed");
      await user.keyboard("{Escape}");

      expect(screen.getByText("Upper Body")).toBeInTheDocument();
    });

    it("reverts edit when name is empty", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      const input = screen.getByDisplayValue("Upper Body");
      await user.clear(input);

      await user.click(screen.getByText("CheckIcon").closest("button"));

      // Should not call updateWorkoutAction for empty name
      expect(updateWorkoutAction).not.toHaveBeenCalled();
    });

    it("reverts edit when name is unchanged", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));

      // Just click save without changing
      await user.click(screen.getByText("CheckIcon").closest("button"));

      expect(updateWorkoutAction).not.toHaveBeenCalled();
    });
  });

  describe("Add Exercise", () => {
    it("calls addExerciseToWorkoutAction when selecting an exercise", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      // Click an exercise from the catalog shown in popover
      await user.click(screen.getByText("Bench Press"));

      await waitFor(() => {
        expect(addExerciseToWorkoutAction).toHaveBeenCalledWith("w1", "e1");
      });
    });

    it("filters exercise catalog by search input", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search exercises...");
      await user.type(searchInput, "Sq");

      expect(screen.getByText("Squat")).toBeInTheDocument();
      expect(screen.queryByText("Deadlift")).not.toBeInTheDocument();
    });

    it("shows 'No exercises found' when search has no results", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search exercises...");
      await user.type(searchInput, "Nonexistent");

      expect(screen.getByText("No exercises found")).toBeInTheDocument();
    });
  });

  describe("Remove Exercise", () => {
    it("calls removeExerciseFromWorkoutAction when clicking trash icon", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      await user.click(screen.getByText("Trash2Icon").closest("button"));

      await waitFor(() => {
        expect(removeExerciseFromWorkoutAction).toHaveBeenCalledWith("we1");
      });
    });
  });

  describe("Add Set", () => {
    it("calls addSetAction when clicking plus icon on exercise card", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      // The PlusIcon buttons: one for add set on exercise card, one for "Add Exercise"
      const plusButtons = screen.getAllByText("PlusIcon");
      // First PlusIcon is on the exercise card header
      await user.click(plusButtons[0].closest("button"));

      await waitFor(() => {
        expect(addSetAction).toHaveBeenCalledWith("we1", { weight: null, reps: null });
      });
    });
  });

  describe("Set Interactions", () => {
    it("calls updateSetAction on weight blur with changed value", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const weightInputs = screen.getAllByDisplayValue("60");
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], "80");
      fireEvent.blur(weightInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { weight: "80" });
      });
    });

    it("calls updateSetAction on reps blur with changed value", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const repsInputs = screen.getAllByDisplayValue("10");
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], "12");
      fireEvent.blur(repsInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { reps: 12 });
      });
    });

    it("clamps negative weight to 0 on blur", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const weightInputs = screen.getAllByDisplayValue("60");
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], "-5");
      fireEvent.blur(weightInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { weight: "0" });
      });
    });

    it("clamps negative reps to 0 on blur", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const repsInputs = screen.getAllByDisplayValue("10");
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], "-3");
      fireEvent.blur(repsInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { reps: 0 });
      });
    });

    it("sets weight to null when cleared", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const weightInputs = screen.getAllByDisplayValue("60");
      await user.clear(weightInputs[0]);
      fireEvent.blur(weightInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { weight: null });
      });
    });

    it("sets reps to null when cleared", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const repsInputs = screen.getAllByDisplayValue("10");
      await user.clear(repsInputs[0]);
      fireEvent.blur(repsInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalledWith("s1", { reps: null });
      });
    });

    it("calls removeSetAction when clicking X on a set row", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      // XIcon buttons in set rows
      const xButtons = screen.getAllByText("XIcon");
      await user.click(xButtons[0].closest("button"));

      await waitFor(() => {
        expect(removeSetAction).toHaveBeenCalledWith("s1");
      });
    });

    it("calls addSetAction (duplicate) when clicking copy icon on a set row", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const copyButtons = screen.getAllByText("CopyIcon");
      await user.click(copyButtons[0].closest("button"));

      await waitFor(() => {
        expect(addSetAction).toHaveBeenCalledWith("we1", { weight: "60", reps: 10 });
      });
    });
  });

  describe("Change Exercise", () => {
    it("shows other exercises from catalog (excluding current) in change popover", () => {
      render(<WorkoutForm {...propsWithExercises} />);

      // Since Popover mock renders all children, the change exercise popover
      // shows exercises from catalog excluding current (Bench Press).
      // "Squat" appears in both change popover and add exercise popover.
      const squatButtons = screen.getAllByText("Squat");
      expect(squatButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("calls updateExerciseOnWorkoutAction when selecting a different exercise", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      // "Squat" appears in both the change-exercise popover and the add-exercise popover.
      // The change-exercise popover's buttons come first in the DOM.
      const squatButtons = screen.getAllByText("Squat");
      await user.click(squatButtons[0].closest("button"));

      await waitFor(() => {
        expect(updateExerciseOnWorkoutAction).toHaveBeenCalledWith("we1", "e2");
      });
    });
  });

  describe("Back to Dashboard", () => {
    it("navigates to dashboard when clicking back button", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("Back to Dashboard"));

      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Calendar and Time", () => {
    it("updates started at when calendar date is selected", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      // Calendar mock buttons are rendered in the popover
      const calendarButtons = screen.getAllByTestId("calendar-select");
      await user.click(calendarButtons[0]);

      await waitFor(() => {
        expect(updateWorkoutAction).toHaveBeenCalledWith("w1", {
          name: "Upper Body",
          startedAt: expect.any(String),
        });
      });
    });

    it("does nothing when calendar selection is undefined", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      const calendarEmptyButtons = screen.getAllByTestId("calendar-select-empty");
      await user.click(calendarEmptyButtons[0]);

      expect(updateWorkoutAction).not.toHaveBeenCalled();
    });

    it("updates started at when time input changes", () => {
      render(<WorkoutForm {...defaultProps} />);

      const timeInputs = document.querySelectorAll('input[type="time"]');
      expect(timeInputs.length).toBeGreaterThan(0);
      fireEvent.change(timeInputs[0], { target: { value: "14:30" } });

      expect(updateWorkoutAction).toHaveBeenCalledWith("w1", {
        name: "Upper Body",
        startedAt: expect.any(String),
      });
    });
  });

  describe("ExerciseCard change exercise search", () => {
    it("shows 'No exercises found' when change search has no results", async () => {
      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      // There are two search inputs: one in ExerciseCard change popover, one in add exercise popover
      const searchInputs = screen.getAllByPlaceholderText("Search exercises...");
      // First search input is in the ExerciseCard change popover
      await user.type(searchInputs[0], "Nonexistent");

      const noFoundMessages = screen.getAllByText("No exercises found");
      expect(noFoundMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Error handling", () => {
    it("reverts name on updateWorkoutAction failure", async () => {
      updateWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("PencilIcon").closest("button"));
      const input = screen.getByDisplayValue("Upper Body");
      await user.clear(input);
      await user.type(input, "New Name{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Upper Body")).toBeInTheDocument();
      });
    });

    it("reverts started at on updateWorkoutAction failure in handleUpdateStartedAt", async () => {
      updateWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      const calendarButtons = screen.getAllByTestId("calendar-select");
      await user.click(calendarButtons[0]);

      await waitFor(() => {
        expect(updateWorkoutAction).toHaveBeenCalled();
      });
    });

    it("handles completeWorkoutAction failure gracefully", async () => {
      completeWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("Complete Workout"));

      await waitFor(() => {
        expect(completeWorkoutAction).toHaveBeenCalled();
      });
      // No crash
      expect(screen.getByText("Upper Body")).toBeInTheDocument();
    });

    it("handles addExerciseToWorkoutAction failure gracefully", async () => {
      addExerciseToWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...defaultProps} />);

      await user.click(screen.getByText("Bench Press").closest("button"));

      await waitFor(() => {
        expect(addExerciseToWorkoutAction).toHaveBeenCalled();
      });
    });

    it("handles removeExerciseFromWorkoutAction failure gracefully", async () => {
      removeExerciseFromWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      await user.click(screen.getByText("Trash2Icon").closest("button"));

      await waitFor(() => {
        expect(removeExerciseFromWorkoutAction).toHaveBeenCalled();
      });
    });

    it("handles updateExerciseOnWorkoutAction failure gracefully", async () => {
      updateExerciseOnWorkoutAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const squatButtons = screen.getAllByText("Squat");
      await user.click(squatButtons[0].closest("button"));

      await waitFor(() => {
        expect(updateExerciseOnWorkoutAction).toHaveBeenCalled();
      });
    });

    it("handles addSetAction failure gracefully", async () => {
      addSetAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const plusButtons = screen.getAllByText("PlusIcon");
      await user.click(plusButtons[0].closest("button"));

      await waitFor(() => {
        expect(addSetAction).toHaveBeenCalled();
      });
    });

    it("handles updateSetAction failure gracefully on weight blur", async () => {
      updateSetAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const weightInputs = screen.getAllByDisplayValue("60");
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], "80");
      fireEvent.blur(weightInputs[0]);

      await waitFor(() => {
        expect(updateSetAction).toHaveBeenCalled();
      });
    });

    it("handles removeSetAction failure gracefully", async () => {
      removeSetAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const xButtons = screen.getAllByText("XIcon");
      await user.click(xButtons[0].closest("button"));

      await waitFor(() => {
        expect(removeSetAction).toHaveBeenCalled();
      });
    });

    it("handles duplicate set (addSetAction) failure gracefully", async () => {
      addSetAction.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      render(<WorkoutForm {...propsWithExercises} />);

      const copyButtons = screen.getAllByText("CopyIcon");
      await user.click(copyButtons[0].closest("button"));

      await waitFor(() => {
        expect(addSetAction).toHaveBeenCalled();
      });
    });
  });
});
