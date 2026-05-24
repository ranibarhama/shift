"use client";

import { useEffect, useState } from "react";
import type { Theme } from "./theme";

export function useTheme(initial: Theme = "dark"): Theme {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const html = document.documentElement;
    const apply = () => setTheme(html.classList.contains("dark") ? "dark" : "light");
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export const CANVAS_PALETTE = {
  dark: { gridDot: "#2a3358", maskColor: "rgba(11,16,32,0.7)" },
  light: { gridDot: "#d6dbe7", maskColor: "rgba(15,21,42,0.18)" },
} as const;
