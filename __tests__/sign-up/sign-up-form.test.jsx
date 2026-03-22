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
  useSignUp: jest.fn().mockReturnValue({
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
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
import { useSignUp } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { SignUpForm } from "@/app/sign-up/[[...sign-up]]/sign-up-form";

describe("SignUpForm", () => {
  let mockCreate;
  let mockSetActive;
  let mockPrepareEmailAddressVerification;
  let mockAttemptEmailAddressVerification;
  let mockAuthenticateWithRedirect;
  let mockPush;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    mockSetActive = jest.fn();
    mockPrepareEmailAddressVerification = jest.fn();
    mockAttemptEmailAddressVerification = jest.fn();
    mockAuthenticateWithRedirect = jest.fn();
    mockPush = jest.fn();

    useRouter.mockReturnValue({ push: mockPush });
    useSignUp.mockReturnValue({
      signUp: {
        create: mockCreate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        authenticateWithRedirect: mockAuthenticateWithRedirect,
      },
      setActive: mockSetActive,
      isLoaded: true,
    });
    isClerkAPIResponseError.mockReturnValue(false);
  });

  it("renders the sign-up heading", () => {
    render(<SignUpForm />);
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("renders first name, last name, email, and password fields", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders OAuth buttons with icons", () => {
    render(<SignUpForm />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    expect(screen.getByTestId("google-icon")).toBeInTheDocument();
    expect(screen.getByTestId("apple-icon")).toBeInTheDocument();
  });

  it("renders link to sign-in page", () => {
    render(<SignUpForm />);
    const link = screen.getByText("Sign in");
    expect(link.closest("a")).toHaveAttribute("href", "/sign-in");
  });

  it("renders or separator", () => {
    render(<SignUpForm />);
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("submits registration and shows verification form", async () => {
    mockCreate.mockResolvedValue(undefined);
    mockPrepareEmailAddressVerification.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(mockCreate).toHaveBeenCalledWith({
      emailAddress: "john@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    });
    expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
      strategy: "email_code",
    });

    // Verification form should now be visible
    expect(await screen.findByText("Verify Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
  });

  it("shows loading state during registration submission", async () => {
    mockCreate.mockReturnValue(new Promise(() => {})); // never resolves

    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByText("Creating account...")).toBeInTheDocument();
  });

  it("shows error on failed registration", async () => {
    mockCreate.mockRejectedValue(new Error("Something went wrong"));

    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("shows Clerk API error on failed registration", async () => {
    const clerkError = { errors: [{ longMessage: "Email already taken" }] };
    mockCreate.mockRejectedValue(clerkError);
    isClerkAPIResponseError.mockReturnValue(true);

    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Email already taken")).toBeInTheDocument();
  });

  it("verifies email code and redirects on success", async () => {
    mockCreate.mockResolvedValue(undefined);
    mockPrepareEmailAddressVerification.mockResolvedValue(undefined);
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_1",
    });
    mockSetActive.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<SignUpForm />);

    // Phase 1: Registration
    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    // Phase 2: Verification
    await screen.findByText("Verify Email");
    await user.type(screen.getByLabelText("Verification Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(mockAttemptEmailAddressVerification).toHaveBeenCalledWith({
      code: "123456",
    });
    expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_1" });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on failed verification", async () => {
    mockCreate.mockResolvedValue(undefined);
    mockPrepareEmailAddressVerification.mockResolvedValue(undefined);
    mockAttemptEmailAddressVerification.mockRejectedValue(new Error("Bad code"));

    const user = userEvent.setup();
    render(<SignUpForm />);

    // Phase 1: Registration
    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    // Phase 2: Verification with error
    await screen.findByText("Verify Email");
    await user.type(screen.getByLabelText("Verification Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("shows verification message with email address", async () => {
    mockCreate.mockResolvedValue(undefined);
    mockPrepareEmailAddressVerification.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText(/We sent a verification code to john@example.com/)
    ).toBeInTheDocument();
  });

  it("calls authenticateWithRedirect for Google OAuth", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.click(screen.getByText("Continue with Google"));

    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectUrl: "/sign-up/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  });

  it("calls authenticateWithRedirect for Apple OAuth", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.click(screen.getByText("Continue with Apple"));

    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: "oauth_apple",
      redirectUrl: "/sign-up/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  });

  it("disables buttons when not loaded", () => {
    useSignUp.mockReturnValue({
      signUp: {
        create: mockCreate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        authenticateWithRedirect: mockAuthenticateWithRedirect,
      },
      setActive: mockSetActive,
      isLoaded: false,
    });

    render(<SignUpForm />);

    expect(screen.getByText("Continue with Google")).toBeDisabled();
    expect(screen.getByText("Continue with Apple")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDisabled();
  });
});
