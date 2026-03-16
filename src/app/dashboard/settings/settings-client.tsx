"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser, useClerk } from "@clerk/nextjs";
import { ArrowLeft, Sun, Moon, Monitor, ExternalLink } from "lucide-react";
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

export default function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const clerk = useClerk();
  const { theme = "system", setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [country, setCountry] = useState(settings.country ?? "");
  const [city, setCity] = useState(settings.city ?? "");
  const [timezone, setTimezone] = useState(
    settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Profile"} />
                <AvatarFallback className="text-lg">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-medium">
                  {user?.fullName ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress ?? "—"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => clerk.openUserProfile()}
            >
              Manage Account
              <ExternalLink className="ml-2 size-4" />
            </Button>
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
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {formatProvider(account.provider)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.emailAddress ?? "—"}
                      </p>
                    </div>
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No connected accounts
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => clerk.openUserProfile()}
            >
              Manage
              <ExternalLink className="ml-2 size-4" />
            </Button>
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
