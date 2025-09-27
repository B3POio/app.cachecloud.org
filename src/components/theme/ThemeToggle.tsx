// src/components/theme/ThemeToggle.tsx
"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { toggle } = useTheme();
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 p-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
