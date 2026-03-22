"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Pencil,
  Camera,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon, AppleIcon } from "@/components/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateLocationSettingsAction } from "./actions";

interface SettingsClientProps {
  settings: {
    country: string | null;
    city: string | null;
    timezone: string | null;
  };
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function formatProvider(provider: string) {
  const names: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    github: "GitHub",
    facebook: "Facebook",
    microsoft: "Microsoft",
    discord: "Discord",
    twitter: "Twitter",
    linkedin: "LinkedIn",
  };
  return names[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  switch (provider) {
    case "google":
      return <GoogleIcon className={className} />;
    case "apple":
      return <AppleIcon className={className} />;
    default:
      return null;
  }
}

export default function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dashboardPath = dateParam ? `/dashboard?date=${dateParam}` : "/dashboard";
  const { user } = useUser();
  const { theme = "system", setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  // Location settings
  const [country, setCountry] = useState(settings.country ?? "");
  const [city, setCity] = useState(settings.city ?? "");
  const [timezone, setTimezone] = useState(
    settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password management
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Connected accounts
  const [isConnecting, setIsConnecting] = useState(false);

  const timezonesByRegion = useMemo(() => {
    const zones = Intl.supportedValuesOf("timeZone");
    const grouped: Record<string, string[]> = {};
    for (const tz of zones) {
      const region = tz.split("/")[0];
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(tz);
    }
    return grouped;
  }, []);

  function handleSaveLocation() {
    startTransition(async () => {
      await updateLocationSettingsAction({
        country: country || undefined,
        city: city || undefined,
        timezone,
      });
      router.refresh();
    });
  }

  async function handleSaveProfile() {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await user.update({ firstName, lastName });
      setIsEditingProfile(false);
      toast.success("Profile updated.");
      router.refresh();
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(err.errors[0]?.longMessage ?? "Failed to update profile.");
      } else {
        toast.error("Failed to update profile.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleCancelEdit() {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setIsEditingProfile(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      await user.setProfileImage({ file });
      toast.success("Avatar updated.");
      router.refresh();
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(err.errors[0]?.longMessage ?? "Failed to upload avatar.");
      } else {
        toast.error("Failed to upload avatar.");
      }
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      if (user.passwordEnabled) {
        await user.updatePassword({ currentPassword, newPassword });
      } else {
        await user.updatePassword({ newPassword });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        user.passwordEnabled ? "Password updated." : "Password set."
      );
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(err.errors[0]?.longMessage ?? "Failed to update password.");
      } else {
        toast.error("Failed to update password.");
      }
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleConnectAccount(
    strategy: "oauth_google" | "oauth_apple"
  ) {
    if (!user) return;
    setIsConnecting(true);
    try {
      await user.createExternalAccount({
        strategy,
        redirectUrl: "/dashboard/settings",
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(
          err.errors[0]?.longMessage ?? "Failed to connect account."
        );
      } else {
        toast.error("Failed to connect account.");
      }
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnectAccount(accountId: string) {
    if (!user) return;
    const account = user.externalAccounts.find((a) => a.id === accountId);
    if (!account) return;
    try {
      await account.destroy();
      toast.success("Account disconnected.");
      router.refresh();
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(
          err.errors[0]?.longMessage ?? "Failed to disconnect account."
        );
      } else {
        toast.error("Failed to disconnect account.");
      }
    }
  }

  const totalAuthMethods =
    (user?.externalAccounts?.length ?? 0) + (user?.passwordEnabled ? 1 : 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={dashboardPath}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {!isEditingProfile && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditingProfile(true)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="size-16">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName ?? "Profile"}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              {isEditingProfile ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-lg font-medium">
                    {user?.fullName ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress ?? "—"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.passwordEnabled ? "Change Password" : "Set Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {user?.passwordEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword
                  ? "Saving..."
                  : user?.passwordEnabled
                    ? "Update Password"
                    : "Set Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.externalAccounts && user.externalAccounts.length > 0 ? (
              <div className="space-y-3">
                {user.externalAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <ProviderIcon provider={account.provider} className="size-5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {formatProvider(account.provider)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.emailAddress ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          account.verification?.status === "verified"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {account.verification?.status === "verified"
                          ? "Connected"
                          : "Pending"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDisconnectAccount(account.id)}
                        disabled={totalAuthMethods <= 1}
                        title={
                          totalAuthMethods <= 1
                            ? "Cannot remove the only sign-in method"
                            : "Disconnect account"
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No connected accounts
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnectAccount("oauth_google")}
                disabled={isConnecting}
              >
                <GoogleIcon className="size-4" />
                Connect Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnectAccount("oauth_apple")}
                disabled={isConnecting}
              >
                <AppleIcon className="size-4" />
                Connect Apple
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="mr-2 size-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="mr-2 size-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="mr-2 size-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Location & Timezone */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Timezone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. New Zealand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Auckland"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={(value) => { if (value) setTimezone(value); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timezonesByRegion).map(([region, zones]) => (
                    <SelectGroup key={region}>
                      <SelectLabel>{region}</SelectLabel>
                      {zones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveLocation}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
