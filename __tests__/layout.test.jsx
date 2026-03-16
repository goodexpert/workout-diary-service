import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }) => <div>{children}</div>,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  Show: ({ children, when }) => <div data-testid={`show-${when}`}>{children}</div>,
  UserButton: () => <div>UserButton</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button>ThemeToggle</button>,
}));

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

  it("renders sign in and sign up buttons for signed-out state", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("renders theme toggle", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByText("ThemeToggle")).toBeInTheDocument();
  });

  it("renders UserButton for signed-in state", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(screen.getByText("UserButton")).toBeInTheDocument();
  });
});
