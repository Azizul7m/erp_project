"use client";

import { Icon } from "@iconify/react";
import { useTheme, type ColorScheme } from "./ThemeProvider";
import { useState } from "react";

export function ThemeToggle() {
  const { scheme, mode, setScheme, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const schemes: { id: ColorScheme; label: string; icon: string }[] = [
    { id: "default", label: "Orbit", icon: "solar:cloudy-moon-bold-duotone" },
    { id: "onedark", label: "One Dark", icon: "solar:code-bold-duotone" },
    { id: "gruvbox", label: "Gruvbox", icon: "solar:leaf-bold-duotone" },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] p-1.5 shadow-sm">
        <button
          onClick={toggleMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-app)] text-[var(--text-muted)] transition hover:text-[var(--text-main)]"
          title="Toggle Dark Mode"
        >
          <Icon icon={mode === "light" ? "solar:sun-2-bold-duotone" : "solar:moon-bold-duotone"} className="h-5 w-5" />
        </button>
        <div className="h-4 w-px bg-[var(--border-main)]" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-app)]"
        >
          <Icon icon="solar:pallete-2-bold-duotone" className="h-5 w-5 text-[var(--primary)]" />
          <span className="hidden sm:inline">Theme</span>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-[24px] border border-[var(--border-main)] bg-[var(--bg-card)] p-2 shadow-xl backdrop-blur-md">
            <div className="space-y-1">
              {schemes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScheme(s.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    scheme === s.id
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <Icon icon={s.icon} className="h-5 w-5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
