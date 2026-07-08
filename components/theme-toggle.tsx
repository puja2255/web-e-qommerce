"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useGoldenStore } from "@/lib/store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useGoldenStore();

  return (
    <button className="button-icon" type="button" onClick={toggleTheme} aria-label="Ganti tema" title="Ganti tema">
      {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </button>
  );
}
