"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SegmentedControl } from "./ui";

const MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("themechange", handler);
  mq.addEventListener("change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("themechange", handler);
    mq.removeEventListener("change", handler);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem("theme") || "system";
  } catch {
    return "system";
  }
}

function getServerSnapshot() {
  return "system";
}

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode]);

  const setMode = (next) => {
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("themechange"));
  };

  return <SegmentedControl options={MODES} value={mode} onChange={setMode} ariaLabel="Color theme" />;
}
