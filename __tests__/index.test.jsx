import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@clerk/nextjs", () => ({
  SignUpButton: ({ children }) => children,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("../src/lib/auth", () => ({
  getAuthenticatedUser: jest.fn().mockRejectedValue(new Error("Not authenticated")),
}));

jest.mock("../src/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("../src/components/ui/card", () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock("lucide-react", () => ({
  Dumbbell: () => <span>Dumbbell</span>,
  ListChecks: () => <span>ListChecks</span>,
  CalendarSearch: () => <span>CalendarSearch</span>,
}));

import Home from "../src/app/page";

describe("Home", () => {
  it("renders the home page", async () => {
    const HomeComponent = await Home();
    render(HomeComponent);

    expect(
      screen.getByText("Your Personal Workout Diary")
    ).toBeInTheDocument();
  });

  it("renders feature cards", async () => {
    const HomeComponent = await Home();
    render(HomeComponent);

    expect(screen.getByText("Track Workouts")).toBeInTheDocument();
    expect(screen.getByText("Monitor Sets & Reps")).toBeInTheDocument();
    expect(screen.getByText("Review Progress")).toBeInTheDocument();
  });
});
