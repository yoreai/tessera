"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../utils/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gray-700 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-xl
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        ${
          theme === "dark"
            ? "bg-slate-700 text-amber-300 hover:bg-slate-600 shadow-lg border border-slate-600"
            : "bg-white text-slate-600 hover:bg-gray-50 shadow-md border border-gray-200"
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${theme === "dark" ? "focus:ring-amber-400" : "focus:ring-gray-300"}
      `}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`
            absolute w-4 h-4 transition-all duration-300 ease-in-out
            ${
              theme === "light"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 rotate-90 scale-0"
            }
          `}
        />

        {/* Moon Icon */}
        <Moon
          className={`
            absolute w-4 h-4 transition-all duration-300 ease-in-out
            ${
              theme === "dark"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-0"
            }
          `}
        />
      </div>
    </button>
  );
}

