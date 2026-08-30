import Link from "next/link";
import AppFrame from "@/components/app-frame";
import { createClient } from "@/lib/supabase/server";
import { getMemberships, requirePlatformAdmin } from "@/lib/auth";
import { platformNav } from "@/lib/nav";
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

  const [{ data, error }, memberships] = await Promise.all([
    supabase.rpc("platform_venues"),
    getMemberships(),
  ]);

  const venues = (data ?? []) as unknown as VenueRow[];

  /*
   * Which venues this person actually works at.
   *
   * Running the platform is not the same as being staff somewhere, so the
   * admin link only appears for venues where they are. Reaching into a
   * customer's song list because you happen to run the service is a support
   * action, and it should look like one — visible and recorded — rather than
   * happening quietly because of who is signed in.
   */
  const staffed = new Set(memberships.map((m) => m.venues.slug));

  const live = venues.filter((v) => !v.suspended_at).length;
  const songs = venues.reduce((sum, v) => sum + Number(v.song_count), 0);
  const openNow = venues.filter((v) => v.karaoke_open && !v.suspended_at).length;
  const ownerless = venues.filter((v) => v.staff_count === 0).length;

  const stats = [
    { label: "Venues", value: venues.length },
    { label: "Active", value: live },
    { label: "Karaoke on now", value: openNow },
    { label: "Songs in total", value: songs.toLocaleString() },
  ];

  return (
    <AppFrame
      title="Karaoke OS"
      subtitle="Platform"
      email={user.email ?? ""}
      groups={platformNav()}
      signOutTo="/platform/login"
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        All venues
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Every bar signed up to Karaoke OS.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          Could not load the venues: {error.message}
        </p>
      )}

      {/* Real counts, read from the database. Nothing here is decorative. */}
      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
              {stat.label}
            </dt>
            <dd className="mt-1.5 font-display text-3xl font-semibold leading-none tabular-nums text-ink">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {ownerless > 0 && (
        <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          {ownerless === 1 ? "One venue has" : `${ownerless} venues have`} no
          staff at all, so nobody can manage{" "}
          {ownerless === 1 ? "it" : "them"}.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th
                  scope="col"
                  className="py-2.5 pl-4 pr-4 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint"
                >
                  Venue
                </th>
                <th
                  scope="col"
                  className="hidden py-2.5 pr-4 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint sm:table-cell"
                >
                  Owner
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-right text-xs font-medium uppercase tracking-[0.08em] text-ink-faint"
                >
                  Songs
                </th>
                <th
                  scope="col"
                  className="hidden py-2.5 pr-4 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint md:table-cell"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint"
                >
                  State
                </th>
                <th scope="col" className="py-2.5 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {venues.map((venue) => {
                const suspended = Boolean(venue.suspended_at);
                const canOpen = staffed.has(venue.slug);

                return (
                  <tr
                    key={venue.id}
                    className="border-b border-line last:border-0 hover:bg-surface-2"
                  >
                    <td className="py-2.5 pl-4 pr-4">
                      <span className="font-medium text-ink">{venue.name}</span>
                      <Link
                        href={`/v/${venue.slug}`}
                        className="block font-mono text-xs text-ink-faint underline-offset-4 hover:underline"
                      >
                        /v/{venue.slug}
                      </Link>
                    </td>

                    <td className="hidden py-2.5 pr-4 text-ink-soft sm:table-cell">
                      {venue.owner_email ?? (
                        <span className="text-ink-faint">no owner</span>
                      )}
                    </td>

                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink-soft">
                      {venue.song_count}
                    </td>

                    <td className="hidden py-2.5 pr-4 tabular-nums text-ink-soft md:table-cell">
                      {dateFormat.format(new Date(venue.created_at))}
                    </td>

                    <td className="py-2.5 pr-4">
                      {suspended ? (
                        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                          Suspended
                        </span>
                      ) : venue.karaoke_open ? (
                        <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">
                          Karaoke on
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">Closed</span>
                      )}
                    </td>

                    <td className="py-2.5 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {canOpen ? (
                          <Link
                            href={`/admin/${venue.slug}`}
                            className="inline-flex h-11 items-center rounded-md px-3 text-sm
                                       text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                          >
                            Open
                          </Link>
                        ) : (
                          <span
                            className="inline-flex h-11 items-center px-3 text-sm text-ink-faint"
                            title="You do not work at this venue"
                          >
                            Not staff
                          </span>
                        )}

                        <form action={setVenueSuspended}>
                          <input type="hidden" name="venue_id" value={venue.id} />
                          <input type="hidden" name="slug" value={venue.slug} />
                          <input
                            type="hidden"
                            name="suspend"
                            value={String(!suspended)}
                          />
                          <button
                            type="submit"
                            className={`inline-flex h-11 items-center rounded-md px-3 text-sm
                                        underline-offset-4 hover:underline ${
                                          suspended ? "text-ok" : "text-danger"
                                        }`}
                          >
                            {suspended ? "Restore" : "Suspend"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {venues.length === 0 && !error && (
          <p className="px-4 py-16 text-center text-ink-soft">No venues yet.</p>
        )}
      </div>

      <p className="mt-6 max-w-prose text-xs text-ink-faint">
        Suspending hides a venue from guests. Its own staff keep seeing it, so
        they can sort out whatever caused it. <strong>Open</strong> appears only
        for venues you work at — running the platform does not make you staff.
      </p>
    </AppFrame>
  );
}
