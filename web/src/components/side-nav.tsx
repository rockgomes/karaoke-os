"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import ThemeToggle from "./theme-toggle";

export type IconName =
  | "songs"
  | "import"
  | "qr"
  | "guest"
  | "venues"
  | "add"
  | "platform";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Leaves the admin area — opens in a new tab and never shows as active. */
  external?: boolean;
};

export type NavGroup = { label?: string; items: NavItem[] };

/* Stroked at 1.5 so they sit at the same weight as the label beside them. */
const PATHS: Record<IconName, React.ReactNode> = {
  songs: (
    <>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  import: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h6" />
    </>
  ),
  guest: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  venues: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  add: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  platform: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </>
  ),
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
    >
      {PATHS[name]}
    </svg>
  );
}

function NavLink({ item, current }: { item: NavItem; current: string }) {
  // Exact match only. A prefix match would light up "Songs" while the person
  // is on the import page, which is the sort of thing that makes a menu lie.
  const active = !item.external && current === item.href;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-rail-2 font-medium text-rail-ink"
          : "text-rail-ink-soft hover:bg-rail-2 hover:text-rail-ink"
      }`}
    >
      <span className={active ? "text-accent" : ""}>
        <Icon name={item.icon} />
      </span>
      <span className="truncate">{item.label}</span>
      {item.external && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
          className="ml-auto h-3.5 w-3.5 opacity-60"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      )}
    </Link>
  );
}

export default function SideNav({
  title,
  subtitle,
  live,
  groups,
  email,
  sessionControl,
}: {
  /** The venue name, or "Karaoke OS" outside a venue. */
  title: string;
  subtitle?: string;
  /** Karaoke is running right now. Drives the lamp. */
  live?: boolean;
  groups: NavGroup[];
  email: string;
  /**
   * The open/close karaoke button. It lives beside the lamp because the state
   * and the switch for it belong in one place, not on two different screens.
   */
  sessionControl?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group, i) => (
        <div key={group.label ?? i} className="flex flex-col gap-0.5">
          {group.label && (
            <h2 className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-rail-ink-soft">
              {group.label}
            </h2>
          )}
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} current={pathname} />
          ))}
        </div>
      ))}
    </nav>
  );

  const identity = (
    <div className="border-t border-rail-line px-3 py-3">
      <div className="px-3 pb-2">
        <ThemeToggle tone="rail" />
      </div>
      <p className="truncate px-3 text-xs text-rail-ink-soft" title={email}>
        {email}
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-sm text-rail-ink-soft
 transition-colors hover:bg-rail-2 hover:text-rail-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  const heading = (compact = false) => (
    <div
      className={`flex items-start gap-2.5 ${
        compact ? "px-4 py-3" : "px-6 pb-4 pt-5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${
          live ? "lamp-live" : "bg-rail-line"
        }`}
      />
      <div className="min-w-0">
        <p className="truncate font-display text-[17px] font-semibold leading-tight text-rail-ink">
          {title}
        </p>
        <p className="truncate text-xs text-rail-ink-soft" aria-live="polite">
          {subtitle ?? (live ? "Karaoke is on" : "Karaoke is off")}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail. Sticky and its own height, so signing out does not
          mean scrolling to the bottom of a thousand-song list. */}
      <div
        className="hidden w-[248px] shrink-0 flex-col border-r border-rail-line bg-rail
                   lg:sticky lg:top-0 lg:flex lg:h-screen"
      >
        {heading()}
        {sessionControl && <div className="px-4 pb-4">{sessionControl}</div>}
        {nav}
        {identity}
      </div>

      {/* Mobile bar. Same links, one disclosure, no second menu anywhere. */}
      <div className="border-b border-rail-line bg-rail lg:hidden">
        <div className="flex items-center gap-2 pr-3">
          <div className="min-w-0 flex-1">{heading(true)}</div>
          {/* The karaoke switch stays out of the disclosure — it is the one
              control someone may need in a hurry — but it sits on this row
              rather than taking a full-width one of its own. */}
          {sessionControl && (
            <div className="w-[8.75rem] shrink-0">{sessionControl}</div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="venue-menu"
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm
                       text-rail-ink-soft transition-colors hover:bg-rail-2
                       hover:text-rail-ink"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        {open && (
          <div id="venue-menu" className="border-t border-rail-line">
            {nav}
            {identity}
          </div>
        )}
      </div>
    </>
  );
}
