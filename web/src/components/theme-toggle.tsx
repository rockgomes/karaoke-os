"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "system" | "dark";

export const THEME_STORAGE_KEY = "karaoke-os-theme";

/**
 * Runs before the page paints, so a returning visitor never sees a flash of
 * the wrong theme. It only ever stamps an explicit choice: with no stored
 * choice the attribute stays off and the CSS follows the operating system.
 *
 * Kept deliberately tiny and wrapped in try/catch — a private window, or a
 * browser set to block site data, throws on the very first read.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

/*
 * The theme lives on the <html> element, which is outside React. Reading it
 * with useSyncExternalStore rather than an effect means the control is right
 * on the first client render, stays right when another tab changes it, and
 * never sets state during an effect.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changing the choice should move this one too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "dark" || value === "light" ? value : "system";
}

/** The server cannot know the choice; it renders the unstamped default. */
function getServerSnapshot(): Theme {
  return "system";
}

function commit(next: Theme) {
  const root = document.documentElement;

  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);

  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage refused. The choice still applies for this page view.
  }

  for (const listener of listeners) listener();
}

/**
 * Swapping every colour on the page in one frame reads as a flash, which is
 * unpleasant on a screen someone is looking at in a dark room.
 *
 * A view transition cross-fades the whole composition — album art and text
 * included — which a CSS transition cannot do. Where it is unsupported, a
 * class on <html> fades the colours instead; that covers backgrounds, text
 * and borders, which is most of what changes. Either way it is skipped when
 * the visitor asks for reduced motion, where an instant swap is the correct
 * behaviour rather than a lesser one.
 */
function applyTheme(next: Theme) {
  const root = document.documentElement;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit(next);
    return;
  }

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(() => commit(next));
    return;
  }

  root.classList.add("theme-fade");
  commit(next);
  window.setTimeout(() => root.classList.remove("theme-fade"), 320);
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  {
    value: "system",
    label: "Match the system",
    icon: (
      <>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  },
];

export default function ThemeToggle({
  tone = "surface",
}: {
  /** The rail is dark in both themes, so it needs its own colours. */
  tone?: "surface" | "rail";
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const rail = tone === "rail";

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`inline-flex rounded-lg border p-0.5 ${
        rail ? "border-rail-line bg-rail-2" : "border-line bg-surface-2"
      }`}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => applyTheme(option.value)}
            aria-pressed={active}
            title={option.label}
            className={`rounded-md px-2 py-1.5 transition-colors ${
              active
                ? rail
                  ? "bg-rail text-rail-ink"
                  : "bg-surface text-ink shadow-sm"
                : rail
                  ? "text-rail-ink-soft hover:text-rail-ink"
                  : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4 w-4"
            >
              {option.icon}
            </svg>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
