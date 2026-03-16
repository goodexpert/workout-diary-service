"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { initializeSettingsAction } from "@/app/dashboard/settings/actions";

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
    });
  });
}

async function queryGeolocationPermission(): Promise<"granted" | "prompt" | "denied"> {
  if (!("geolocation" in navigator)) return "denied";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "prompt";
  }
}

async function fetchLocationFromCoords(latitude: number, longitude: number) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    country: data.countryName ?? "",
    city: data.city ?? "",
  };
}

async function detectAndSaveSettings(withGeolocation: boolean) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let country = "";
  let city = timezone.split("/").pop()?.replace(/_/g, " ") ?? "";

  if (withGeolocation) {
    const position = await getCurrentPosition();
    const location = await fetchLocationFromCoords(
      position.coords.latitude,
      position.coords.longitude
    );
    if (location) {
      if (location.country) country = location.country;
      if (location.city) city = location.city;
    }
  }

  await initializeSettingsAction({ timezone, country, city });
}

function requestLocationPermission() {
  toast("Allow location access to auto-detect your country and city.", {
    duration: Infinity,
    action: {
      label: "Allow",
      onClick: async () => {
        try {
          await detectAndSaveSettings(true);
          toast.success("Location detected successfully.");
        } catch {
          toast.warning(
            "Location access was denied. You can enable it in your browser's site settings."
          );
          await detectAndSaveSettings(false);
        }
      },
    },
    cancel: {
      label: "Skip",
      onClick: async () => {
        await detectAndSaveSettings(false);
      },
    },
  });
}

export function SettingsInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    queryGeolocationPermission().then(async (state) => {
      if (state === "granted") {
        try {
          await detectAndSaveSettings(true);
        } catch {
          await detectAndSaveSettings(false);
        }
      } else if (state === "denied") {
        await detectAndSaveSettings(false);
        toast.warning(
          "Location access is blocked. To auto-detect your country and city, enable location in your browser's site settings."
        );
      } else {
        requestLocationPermission();
      }
    });
  }, []);

  return null;
}
