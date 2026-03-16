import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
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
        data-testid="delete-trigger"
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
  DialogClose: ({ children, render }) => {
    const onClick = render?.props?.onClick;
    return (
      <button
        onClick={(e) => {
          if (onClick) onClick(e);
          if (dialogOnOpenChange) dialogOnOpenChange(false);
        }}
      >
        {children}
      </button>
    );
  },
}));

jest.mock("lucide-react", () => ({
  Trash2: () => <span>TrashIcon</span>,
}));

const mockDeleteAction = jest.fn().mockResolvedValue(undefined);
jest.mock("@/app/dashboard/actions", () => ({
  deleteWorkoutAction: (...args) => mockDeleteAction(...args),
}));

import { useRouter } from "next/navigation";
import DeleteWorkoutDialog from "@/app/dashboard/delete-workout-dialog";

describe("DeleteWorkoutDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dialogOnOpenChange = undefined;
    useRouter.mockReturnValue({ push: jest.fn(), refresh: mockRefresh });
  });

  it("renders the trash icon trigger", () => {
    render(<DeleteWorkoutDialog workoutId="w1" workoutName="Leg Day" />);
    expect(screen.getByText("TrashIcon")).toBeInTheDocument();
  });

  it("shows confirmation dialog with workout name", () => {
    render(<DeleteWorkoutDialog workoutId="w1" workoutName="Leg Day" />);

    act(() => { dialogOnOpenChange(true); });

    expect(screen.getByText("Delete Workout?")).toBeInTheDocument();
    expect(screen.getByText("Leg Day")).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it("calls deleteWorkoutAction and refreshes on confirm", async () => {
    const user = userEvent.setup();
    render(<DeleteWorkoutDialog workoutId="w1" workoutName="Leg Day" />);

    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith({ workoutId: "w1" });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("does not delete when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteWorkoutDialog workoutId="w1" workoutName="Leg Day" />);

    await user.click(screen.getByText("Cancel"));

    expect(mockDeleteAction).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("disables Delete button while pending", async () => {
    let resolveAction;
    mockDeleteAction.mockImplementation(
      () => new Promise((resolve) => { resolveAction = resolve; })
    );

    const user = userEvent.setup();
    render(<DeleteWorkoutDialog workoutId="w1" workoutName="Leg Day" />);

    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
    expect(screen.getByText("Deleting...")).toBeDisabled();

    resolveAction(undefined);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
