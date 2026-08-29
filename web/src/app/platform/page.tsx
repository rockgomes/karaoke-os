import Link from "next/link";
import AppFrame from "@/components/app-frame";
import { createClient } from "@/lib/supabase/server";
import { getMemberships, requirePlatformAdmin } from "@/lib/auth";
import { accountNav } from "@/lib/nav";
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

  const memberships = await getMemberships();

  return (
    <AppFrame
      title="Karaoke OS"
      subtitle="Platform"
      email={user.email ?? ""}
      groups={accountNav({
        venues: memberships.map((m) => m.venues),
        isPlatformAdmin: true,
      })}
    >
        <h1 className="font-display text-3xl font-semibold tracking-tight">All venues</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every bar signed up to Karaoke OS.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
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
              className="rounded-lg border border-line p-3"
            >
              <dt className="text-xs text-ink-soft">{stat.label}</dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
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
                    className="border-b border-line last:border-0"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{venue.name}</span>
                      <Link
                        href={`/v/${venue.slug}`}
                        className="block font-mono text-xs text-ink-soft underline-offset-4
 hover:underline"
                      >
                        /v/{venue.slug}
                      </Link>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-ink-soft sm:table-cell dark:text-ink-faint">
                      {venue.owner_email ?? (
                        <span className="text-ink-faint">no owner</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-ink-soft dark:text-ink-faint">
                      {venue.song_count}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-ink-soft md:table-cell dark:text-ink-faint">
                      {dateFormat.format(new Date(venue.created_at))}
                    </td>
                    <td className="py-2.5 pr-3">
                      {suspended ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium
 text-red-800 dark:bg-red-950 dark:text-red-300">
                          Suspended
                        </span>
                      ) : venue.karaoke_open ? (
                        <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium
 text-ok  ">
                          Karaoke on
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">Closed</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={setVenueSuspended}>
                        <input type="hidden" name="venue_id" value={venue.id} />
                        <input type="hidden" name="slug" value={venue.slug} />
                        <input type="hidden" name="suspend" value={String(!suspended)} />
                        <button
                          type="submit"
                          className={`rounded-md px-2 py-1 text-sm underline-offset-4 hover:underline ${
                                        suspended
                                          ? "text-ok "
                                          : "text-danger dark:text-red-400"
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
          <p className="py-10 text-center text-ink-soft">No venues yet.</p>
        )}

        <p className="mt-8 max-w-prose text-xs text-ink-soft">
          Suspending hides a venue from guests. Its own staff keep seeing it, so
          they can sort out whatever caused it.
        </p>
    </AppFrame>
  );
}
