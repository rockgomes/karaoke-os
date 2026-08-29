"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Search lives in the URL, so a filtered view can be bookmarked and the back
 * button behaves. Typing is debounced because every change is a database query.
 */
export default function SongSearch({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = params.get("q") ?? "";
  const [value, setValue] = useState(current);

  useEffect(() => {
    // Compare against the URL rather than guarding the first render with a
    // ref. A ref guard fires anyway when React re-invokes effects, and this
    // effect clears `page` — which silently reset paging to the first page.
    if (value.trim() === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page"); // a different search starts at the beginning
      startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
    }, 250);

    return () => clearTimeout(timer);
  }, [value, current, params, pathname, router]);

  return (
    <div className="relative min-w-56 flex-1">
      <label htmlFor="song-search" className="sr-only">
        Search this venue&rsquo;s songs
      </label>
      <input
        id="song-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search ${total} songs by title or artist`}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                   outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                   dark:border-neutral-700 dark:bg-neutral-900"
      />
      {pending && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500"
          role="status"
        >
          searching
        </span>
      )}
    </div>
  );
}
