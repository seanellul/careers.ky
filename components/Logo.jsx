"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function Logo({ className = "w-full h-full object-contain" }) {
  const { theme } = useTheme();
  return (
    <img
      src={theme === "dark" ? "/images/logo-careers.png" : "/images/logo-careers-black.png"}
      alt="careers.ky logo"
      className={className}
    />
  );
}
