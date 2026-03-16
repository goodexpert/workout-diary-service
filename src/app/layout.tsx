import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsInitializer } from "@/components/settings-initializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workout Diary",
  description:
    "Track your workouts, log exercises and sets, and review your fitness progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <header className="flex items-center justify-between px-6 py-4">
              <h1 className="text-xl font-bold">Workout Diary</h1>
              <div className="flex items-center gap-4">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button variant="outline">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button>Sign Up</Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                  <SettingsInitializer />
                </Show>
              </div>
            </header>
            {children}
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
