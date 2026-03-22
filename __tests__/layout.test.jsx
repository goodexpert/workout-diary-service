import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }) => <div>{children}</div>,
  useUser: jest.fn().mockReturnValue({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  useClerk: jest.fn().mockReturnValue({
    signOut: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/settings-initializer", () => ({
  SettingsInitializer: () => null,
}));

jest.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }) => <div {...props}>{children}</div>,
  AvatarImage: ({ alt, ...props }) => <img alt={alt} {...props} />,
  AvatarFallback: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock("lucide-react", () => ({
  LayoutDashboard: () => <span>LayoutDashboard</span>,
  Settings: () => <span>Settings</span>,
  LogOut: () => <span>LogOut</span>,
}));

import { useUser } from "@clerk/nextjs";
import RootLayout from "@/app/layout";

// Suppress the expected DOM nesting warning (<html> inside <div>).
// Next.js handles <html>/<body> rendering specially at runtime;
// in tests the layout is rendered into a plain <div> container.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("cannot be a child of")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe("RootLayout", () => {
  it("renders the app title", () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    expect(screen.getByText("Workout Diary")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <RootLayout>
        <div>My Page Content</div>
      </RootLayout>
    );

    expect(screen.getByText("My Page Content")).toBeInTheDocument();
  });

  it("renders sign in and sign up links for signed-out state", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("renders user avatar for signed-in state", () => {
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

    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});
