import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("date-fns", () => ({
  format: jest.fn((date, fmt) => {
    if (fmt === "yyyy-MM-dd") return "2026-04-01";
    if (fmt === "do MMM yyyy") return "1st Apr 2026";
    return "mock-date";
  }),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }) => (
    <button data-testid="pick-date" onClick={() => onSelect(new Date("2026-04-01T00:00:00"))}>
      Calendar
    </button>
  ),
}));

let dialogOnOpenChange;
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }) => {
    dialogOnOpenChange = onOpenChange;
    return <div>{children}</div>;
  },
  DialogTrigger: ({ children, render }) => {
    const onClick = render?.props?.onClick;
    return (
      <button
        data-testid="duplicate-trigger"
        onClick={(e) => {
          if (onClick) onClick(e);
          if (dialogOnOpenChange) dialogOnOpenChange(true);
        }}
      >
        {children}
      </button>
    );
  },
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogClose: ({ children }) => <button>{children}</button>,
}));

jest.mock("lucide-react", () => ({
  Copy: () => <span>CopyIcon</span>,
}));

const mockDuplicateAction = jest.fn().mockResolvedValue({ id: "new-workout-id" });
jest.mock("@/app/dashboard/actions", () => ({
  duplicateWorkoutAction: (...args) => mockDuplicateAction(...args),
}));

import { useRouter } from "next/navigation";
import DuplicateWorkoutDialog from "@/app/dashboard/duplicate-workout-dialog";

describe("DuplicateWorkoutDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dialogOnOpenChange = undefined;
    useRouter.mockReturnValue({ push: mockPush, refresh: mockRefresh });
  });

  it("shows confirmation dialog after successful duplication", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("Workout Duplicated")).toBeInTheDocument();
    });
    expect(screen.getByText("Go to Date")).toBeInTheDocument();
    expect(screen.getByText("Stay Here")).toBeInTheDocument();
  });

  it("navigates to duplicated date when 'Go to Date' is clicked", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("Go to Date")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Go to Date"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard?date=2026-04-01");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("stays on current page when 'Stay Here' is clicked", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("Stay Here")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Stay Here"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("displays the target date in confirmation message", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("1st Apr 2026")).toBeInTheDocument();
    });
  });

  it("does not duplicate when no date is selected", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByText("Duplicate"));

    expect(mockDuplicateAction).not.toHaveBeenCalled();
  });

  it("resets state when dialog is closed without duplicating", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    // Select a date first
    await user.click(screen.getByTestId("pick-date"));

    // Close dialog via onOpenChange(false) without duplicating
    act(() => { dialogOnOpenChange(false); });

    // Open dialog again - should show the date picker (not confirmation)
    act(() => { dialogOnOpenChange(true); });
    expect(screen.getByText("Duplicate Workout")).toBeInTheDocument();
  });

  it("calls handleStay when dialog is closed after duplication", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("Workout Duplicated")).toBeInTheDocument();
    });

    // Close dialog via onOpenChange(false) after duplication
    act(() => { dialogOnOpenChange(false); });

    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls duplicateWorkoutAction with correct params", async () => {
    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(mockDuplicateAction).toHaveBeenCalledWith({
        workoutId: "w1",
        targetDate: "2026-04-01",
      });
    });
  });

  it("disables Duplicate button while pending", async () => {
    let resolveAction;
    mockDuplicateAction.mockImplementation(
      () => new Promise((resolve) => { resolveAction = resolve; })
    );

    const user = userEvent.setup();
    render(<DuplicateWorkoutDialog workoutId="w1" />);

    await user.click(screen.getByTestId("pick-date"));
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(screen.getByText("Duplicating...")).toBeInTheDocument();
    });
    expect(screen.getByText("Duplicating...")).toBeDisabled();

    resolveAction({ id: "new-id" });

    await waitFor(() => {
      expect(screen.getByText("Workout Duplicated")).toBeInTheDocument();
    });
  });
});
