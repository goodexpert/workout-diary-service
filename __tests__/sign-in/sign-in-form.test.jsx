import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/link", () => {
  const MockLink = ({ children, href }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: jest.fn().mockReturnValue({
    signIn: {
      create: jest.fn(),
      authenticateWithRedirect: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  }),
}));

jest.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: jest.fn().mockReturnValue(false),
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

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("@/components/icons", () => ({
  GoogleIcon: (props) => <span data-testid="google-icon" {...props} />,
  AppleIcon: (props) => <span data-testid="apple-icon" {...props} />,
}));

import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { SignInForm } from "@/app/sign-in/[[...sign-in]]/sign-in-form";

describe("SignInForm", () => {
  let mockCreate;
  let mockSetActive;
  let mockAuthenticateWithRedirect;
  let mockPush;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    mockSetActive = jest.fn();
    mockAuthenticateWithRedirect = jest.fn();
    mockPush = jest.fn();

    useRouter.mockReturnValue({ push: mockPush });
    useSignIn.mockReturnValue({
      signIn: {
        create: mockCreate,
        authenticateWithRedirect: mockAuthenticateWithRedirect,
      },
      setActive: mockSetActive,
      isLoaded: true,
    });
    isClerkAPIResponseError.mockReturnValue(false);
  });

  it("renders the sign-in heading", () => {
    render(<SignInForm />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders OAuth buttons with icons", () => {
    render(<SignInForm />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    expect(screen.getByTestId("google-icon")).toBeInTheDocument();
    expect(screen.getByTestId("apple-icon")).toBeInTheDocument();
  });

  it("renders link to sign-up page", () => {
    render(<SignInForm />);
    const link = screen.getByText("Sign up");
    expect(link.closest("a")).toHaveAttribute("href", "/sign-up");
  });

  it("renders or separator", () => {
    render(<SignInForm />);
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("submits email/password and redirects on success", async () => {
    mockCreate.mockResolvedValue({ status: "complete", createdSessionId: "sess_1" });
    mockSetActive.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mockCreate).toHaveBeenCalledWith({
      strategy: "password",
      identifier: "john@example.com",
      password: "password123",
    });
    expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_1" });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error message on failed sign-in", async () => {
    mockCreate.mockRejectedValue(new Error("Bad credentials"));

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("shows Clerk API error message", async () => {
    const clerkError = {
      errors: [{ longMessage: "Invalid password" }],
    };
    mockCreate.mockRejectedValue(clerkError);
    isClerkAPIResponseError.mockReturnValue(true);

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid password")).toBeInTheDocument();
  });

  it("calls authenticateWithRedirect for Google OAuth", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.click(screen.getByText("Continue with Google"));

    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectUrl: "/sign-in/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  });

  it("calls authenticateWithRedirect for Apple OAuth", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.click(screen.getByText("Continue with Apple"));

    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: "oauth_apple",
      redirectUrl: "/sign-in/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  });

  it("disables buttons when not loaded", () => {
    useSignIn.mockReturnValue({
      signIn: { create: mockCreate, authenticateWithRedirect: mockAuthenticateWithRedirect },
      setActive: mockSetActive,
      isLoaded: false,
    });

    render(<SignInForm />);

    expect(screen.getByText("Continue with Google")).toBeDisabled();
    expect(screen.getByText("Continue with Apple")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDisabled();
  });

  it("shows loading state during submission", async () => {
    mockCreate.mockReturnValue(new Promise(() => {})); // never resolves

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });
});
