import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { setVenueSuspended } from "./actions";

export const metadata = { title: "All venues — Karaoke OS" };

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  suspended_at: string | null;
  owner_email: string | null;
  staff_count: number;
  song_count: number;
  karaoke_open: boolean;
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function PlatformPage() {
  const user = await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("platform_venues");
  const venues = (data ?? []) as unknown as VenueRow[];

  const live = venues.filter((v) => !v.suspended_at).length;
  const songs = venues.reduce((sum, v) => sum + Number(v.song_count), 0);
  const openNow = venues.filter((v) => v.karaoke_open && !v.suspended_at).length;

  return (
    <div className="min-h-full">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 py-3">
          <span className="font-semibold">Karaoke OS</span>
          <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
            Platform
          </span>
          <Link
            href="/admin"
            className="text-sm text-neutral-500 underline-offset-4 hover:underline
                       focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Your venues
          </Link>
          <span className="ml-auto truncate text-sm text-neutral-500">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm text-neutral-500 underline-offset-4
                         hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">All venues</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every bar signed up to Karaoke OS.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            Could not load the venues: {error.message}
          </p>
        )}

        {/* Real counts, read from the database. Nothing here is decorative. */}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Venues", value: venues.length },
            { label: "Active", value: live },
            { label: "Karaoke on now", value: openNow },
            { label: "Songs in total", value: songs },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <dt className="text-xs text-neutral-500">{stat.label}</dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
                <th scope="col" className="py-2 pr-3 font-medium">Venue</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">Owner</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Songs</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">Joined</th>
                <th scope="col" className="py-2 pr-3 font-medium">State</th>
                <th scope="col" className="py-2 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => {
                const suspended = Boolean(venue.suspended_at);
                return (
                  <tr
                    key={venue.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{venue.name}</span>
                      <Link
                        href={`/v/${venue.slug}`}
                        className="block font-mono text-xs text-neutral-500 underline-offset-4
                                   hover:underline focus-visible:outline-2
                                   focus-visible:outline-blue-600"
                      >
                        /v/{venue.slug}
                      </Link>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-neutral-600 sm:table-cell dark:text-neutral-400">
                      {venue.owner_email ?? (
                        <span className="text-neutral-400">no owner</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                      {venue.song_count}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-neutral-600 md:table-cell dark:text-neutral-400">
                      {dateFormat.format(new Date(venue.created_at))}
                    </td>
                    <td className="py-2.5 pr-3">
                      {suspended ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium
                                         text-red-800 dark:bg-red-950 dark:text-red-300">
                          Suspended
                        </span>
                      ) : venue.karaoke_open ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium
                                         text-green-800 dark:bg-green-950 dark:text-green-300">
                          Karaoke on
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">Closed</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={setVenueSuspended}>
                        <input type="hidden" name="venue_id" value={venue.id} />
                        <input type="hidden" name="slug" value={venue.slug} />
                        <input type="hidden" name="suspend" value={String(!suspended)} />
                        <button
                          type="submit"
                          className={`rounded-md px-2 py-1 text-sm underline-offset-4 hover:underline
                                      focus-visible:outline-2 ${
                                        suspended
                                          ? "text-green-700 focus-visible:outline-green-700 dark:text-green-400"
                                          : "text-red-600 focus-visible:outline-red-600 dark:text-red-400"
                                      }`}
                        >
                          {suspended ? "Restore" : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {venues.length === 0 && !error && (
          <p className="py-10 text-center text-neutral-500">No venues yet.</p>
        )}

        <p className="mt-8 max-w-prose text-xs text-neutral-500">
          Suspending hides a venue from guests. Its own staff keep seeing it, so
          they can sort out whatever caused it.
        </p>
      </main>
    </div>
  );
}
