import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/link", () => {
  return ({ children, href }) => <a href={href}>{children}</a>;
});

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn().mockReturnValue({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  useClerk: jest.fn().mockReturnValue({
    signOut: jest.fn(),
  }),
}));

jest.mock("lucide-react", () => ({
  LayoutDashboard: () => <span>LayoutDashboard</span>,
  Settings: () => <span>Settings</span>,
  LogOut: () => <span>LogOut</span>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }) => <div {...props}>{children}</div>,
  AvatarImage: ({ alt, ...props }) => <img alt={alt} {...props} />,
  AvatarFallback: ({ children, ...props }) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }) => (
    <button {...props}>{children}</button>
  ),
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }) => (
    <div role="menuitem" onClick={onClick} {...props}>
      {children}
    </div>
  ),
}));

import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { HeaderAuth } from "@/components/header-auth";

describe("HeaderAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue({
      user: null,
      isLoaded: true,
      isSignedIn: false,
    });
    useClerk.mockReturnValue({ signOut: jest.fn() });
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  it("renders nothing when not loaded", () => {
    useUser.mockReturnValue({
      user: null,
      isLoaded: false,
      isSignedIn: false,
    });

    const { container } = render(<HeaderAuth />);
    expect(container.innerHTML).toBe("");
  });

  it("renders Sign In and Sign Up links when signed out", () => {
    render(<HeaderAuth />);

    const signInLink = screen.getByText("Sign In").closest("a");
    expect(signInLink).toHaveAttribute("href", "/sign-in");

    const signUpLink = screen.getByText("Sign Up").closest("a");
    expect(signUpLink).toHaveAttribute("href", "/sign-up");
  });

  it("renders avatar with user initials when signed in", () => {
    useUser.mockReturnValue({
      user: {
        fullName: "John Doe",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    render(<HeaderAuth />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders avatar image when signed in", () => {
    useUser.mockReturnValue({
      user: {
        fullName: "John Doe",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    render(<HeaderAuth />);
    const img = screen.getByAltText("John Doe");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders dropdown menu items when signed in", () => {
    useUser.mockReturnValue({
      user: {
        fullName: "John Doe",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    render(<HeaderAuth />);

    expect(screen.getByRole("menuitem", { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Settings/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Sign Out/ })).toBeInTheDocument();
  });

  it("navigates to dashboard when Dashboard menu item is clicked", async () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    useUser.mockReturnValue({
      user: {
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    const user = userEvent.setup();
    render(<HeaderAuth />);

    await user.click(screen.getByText("Dashboard"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("navigates to settings when Settings menu item is clicked", async () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    useUser.mockReturnValue({
      user: {
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    const user = userEvent.setup();
    render(<HeaderAuth />);

    await user.click(screen.getByRole("menuitem", { name: /Settings/ }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/settings");
  });

  it("calls signOut when Sign Out menu item is clicked", async () => {
    const mockSignOut = jest.fn();
    useUser.mockReturnValue({
      user: {
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });
    useClerk.mockReturnValue({ signOut: mockSignOut });

    const user = userEvent.setup();
    render(<HeaderAuth />);

    await user.click(screen.getByText("Sign Out"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("shows ? fallback when no name is available", () => {
    useUser.mockReturnValue({
      user: {
        fullName: null,
        firstName: null,
        lastName: null,
        imageUrl: "https://example.com/avatar.jpg",
      },
      isLoaded: true,
      isSignedIn: true,
    });

    render(<HeaderAuth />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
