import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberships } from "@/lib/auth";

export const metadata = { title: "Your venues — Karaoke OS" };

export default async function AdminHome() {
  const memberships = await getMemberships();

  // One venue is the common case. Do not make them click through a list of one.
  if (memberships.length === 1) {
    redirect(`/admin/${memberships[0].venues.slug}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Your venues</h1>

      {memberships.length === 0 ? (
        <p className="mt-4 text-neutral-500">
          You do not manage a venue yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
          {memberships.map((m) => (
            <li key={m.venue_id} className="py-3">
              <Link
                href={`/admin/${m.venues.slug}`}
                className="font-medium underline-offset-4 hover:underline
                           focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {m.venues.name}
              </Link>
              <span className="ml-2 text-sm text-neutral-500">{m.role}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/new"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-4 py-2.5 font-medium
                   text-white hover:bg-blue-700 focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Add a venue
      </Link>
    </main>
  );
}
