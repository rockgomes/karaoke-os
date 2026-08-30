import Link from "next/link";
import { redirect } from "next/navigation";
import AppFrame from "@/components/app-frame";
import { getMemberships, requireUser } from "@/lib/auth";
import { accountNav } from "@/lib/nav";

export const metadata = { title: "Your venues — Karaoke OS" };

export default async function AdminHome() {
  const user = await requireUser();
  const memberships = await getMemberships();

  // One venue is the common case. Do not make them click through a list of one.
  if (memberships.length === 1) {
    redirect(`/admin/${memberships[0].venues.slug}`);
  }


  return (
    <AppFrame
      title="Karaoke OS"
      subtitle="Your venues"
      email={user.email ?? ""}
      groups={accountNav({ venues: memberships.map((m) => m.venues) })}
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Your venues
      </h1>

      {memberships.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-12 text-center">
          <p className="text-ink-soft">You do not manage a venue yet.</p>
          <Link
            href="/admin/new"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium
 text-accent-ink hover:bg-accent-hover"
          >
            Add your first venue
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m) => (
              <li key={m.venue_id}>
                <Link
                  href={`/admin/${m.venues.slug}`}
                  className="block rounded-xl border border-line bg-surface p-4
 transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <p className="font-display text-lg font-semibold text-ink">
                    {m.venues.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-ink-faint">
                    /v/{m.venues.slug}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.08em] text-ink-faint">
                    {m.role}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/admin/new"
            className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium
 text-accent-ink hover:bg-accent-hover"
          >
            Add a venue
          </Link>
        </>
      )}
    </AppFrame>
  );
}
