import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

jest.mock("next-themes", () => ({
  useTheme: jest.fn().mockReturnValue({ theme: "system", setTheme: jest.fn() }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn().mockReturnValue({
    user: {
      fullName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      imageUrl: "https://example.com/avatar.jpg",
      primaryEmailAddress: { emailAddress: "john@example.com" },
      passwordEnabled: true,
      externalAccounts: [
        {
          id: "ea_1",
          provider: "google",
          emailAddress: "john@gmail.com",
          verification: { status: "verified" },
          destroy: jest.fn(),
        },
      ],
      update: jest.fn(),
      setProfileImage: jest.fn(),
      updatePassword: jest.fn(),
      createExternalAccount: jest.fn(),
    },
  }),
}));

jest.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: jest.fn().mockReturnValue(false),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("lucide-react", () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  Sun: () => <span>Sun</span>,
  Moon: () => <span>Moon</span>,
  Monitor: () => <span>Monitor</span>,
  Pencil: () => <span>Pencil</span>,
  Camera: () => <span>Camera</span>,
  Trash2: () => <span>Trash2</span>,
}));

jest.mock("@/components/icons", () => ({
  GoogleIcon: (props) => <span data-testid="google-icon" {...props}>GoogleIcon</span>,
  AppleIcon: (props) => <span data-testid="apple-icon" {...props}>AppleIcon</span>,
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

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }) => <div {...props}>{children}</div>,
  AvatarImage: ({ alt, ...props }) => <img alt={alt} {...props} />,
  AvatarFallback: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange: _onValueChange }) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectGroup: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
  SelectLabel: ({ children }) => <span>{children}</span>,
  SelectTrigger: ({ children }) => <button>{children}</button>,
  SelectValue: () => <span>SelectValue</span>,
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("@/app/dashboard/settings/actions", () => ({
  updateLocationSettingsAction: jest.fn().mockResolvedValue([{}]),
}));

import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import SettingsClient from "@/app/dashboard/settings/settings-client";

const defaultUser = {
  fullName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  imageUrl: "https://example.com/avatar.jpg",
  primaryEmailAddress: { emailAddress: "john@example.com" },
  passwordEnabled: true,
  externalAccounts: [
    {
      id: "ea_1",
      provider: "google",
      emailAddress: "john@gmail.com",
      verification: { status: "verified" },
      destroy: jest.fn(),
    },
  ],
  update: jest.fn(),
  setProfileImage: jest.fn(),
  updatePassword: jest.fn(),
  createExternalAccount: jest.fn(),
};

describe("SettingsClient", () => {
  const defaultSettings = {
    country: null,
    city: null,
    timezone: null,
  };

  beforeEach(() => {
    useUser.mockReturnValue({ user: defaultUser });
  });

  it("renders the settings heading", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders the back link to dashboard", () => {
    render(<SettingsClient settings={defaultSettings} />);
    const backLink = screen.getByText("ArrowLeft").closest("a");
    expect(backLink).toHaveAttribute("href", "/dashboard");
  });

  it("renders user avatar with image", () => {
    render(<SettingsClient settings={defaultSettings} />);
    const avatar = screen.getByAltText("John Doe");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders user name and email", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders avatar fallback initials", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders Profile section title", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders Connected Accounts section with provider", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Connected Accounts")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("john@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders provider icons in connected accounts and connect buttons", () => {
    render(<SettingsClient settings={defaultSettings} />);
    const googleIcons = screen.getAllByTestId("google-icon");
    const appleIcons = screen.getAllByTestId("apple-icon");
    // One in connected account row + one in Connect Google button
    expect(googleIcons).toHaveLength(2);
    // One in Connect Apple button
    expect(appleIcons).toHaveLength(1);
  });

  it("shows empty state when no external accounts", () => {
    useUser.mockReturnValue({
      user: {
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        imageUrl: "https://example.com/avatar.jpg",
        primaryEmailAddress: { emailAddress: "jane@example.com" },
        passwordEnabled: false,
        externalAccounts: [],
        update: jest.fn(),
        setProfileImage: jest.fn(),
        updatePassword: jest.fn(),
        createExternalAccount: jest.fn(),
      },
    });

    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("No connected accounts")).toBeInTheDocument();
  });

  it("renders Change Password section when password is enabled", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Change Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("renders Set Password section when password is not enabled", () => {
    useUser.mockReturnValue({
      user: {
        ...defaultUser,
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        primaryEmailAddress: { emailAddress: "jane@example.com" },
        passwordEnabled: false,
        externalAccounts: [],
      },
    });

    render(<SettingsClient settings={defaultSettings} />);
    const headings = screen.getAllByText("Set Password");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Appearance section with theme buttons", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("calls setTheme when theme button is clicked", async () => {
    const setTheme = jest.fn();
    useTheme.mockReturnValue({ theme: "system", setTheme });

    const user = userEvent.setup();
    render(<SettingsClient settings={defaultSettings} />);

    await user.click(screen.getByText("Dark"));
    expect(setTheme).toHaveBeenCalledWith("dark");

    await user.click(screen.getByText("Light"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("renders Location & Timezone section", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Location & Timezone")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByText("Timezone")).toBeInTheDocument();
  });

  it("renders saved settings values", () => {
    const settings = {
      country: "New Zealand",
      city: "Auckland",
      timezone: "Pacific/Auckland",
    };

    render(<SettingsClient settings={settings} />);

    expect(screen.getByLabelText("Country")).toHaveValue("New Zealand");
    expect(screen.getByLabelText("City")).toHaveValue("Auckland");
  });

  it("renders Save button", () => {
    render(<SettingsClient settings={defaultSettings} />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("calls updateLocationSettingsAction when Save is clicked", async () => {
    const { updateLocationSettingsAction } = jest.requireMock("@/app/dashboard/settings/actions");
    const user = userEvent.setup();
    render(<SettingsClient settings={defaultSettings} />);

    const countryInput = screen.getByLabelText("Country");
    await user.clear(countryInput);
    await user.type(countryInput, "New Zealand");

    await user.click(screen.getByText("Save"));

    expect(updateLocationSettingsAction).toHaveBeenCalled();
  });
});
