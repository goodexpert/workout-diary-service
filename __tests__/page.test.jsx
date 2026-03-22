import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/card", () => ({
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

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Home from "@/app/page";

describe("Home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthenticatedUser.mockRejectedValue(new Error("Not authenticated"));
  });

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

  it("redirects to dashboard when authenticated", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "user-1" });

    await Home();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
