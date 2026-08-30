import Link from "next/link";
import { startDemo } from "./demo/actions";

export const metadata = {
  title: "Karaoke OS",
  description: "The song list for your karaoke night.",
};

// Deliberately not a list of venues. That would publish the customer list,
// and a guest arrives by the QR code on their table, never through here.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  const demoFailed = search.demo === "unavailable";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20">
      <h1 className="text-4xl font-bold tracking-tight">Karaoke OS</h1>
      <p className="mt-4 text-lg text-ink-soft">
        The song list for your karaoke night. Guests scan the code on the table
        and see everything the bar can play.
      </p>

      <div className="mt-10 rounded-xl border border-line p-5">
        <h2 className="font-semibold">Looking for a song list?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Scan the code on your table. There is nothing to install and no
          account to make.
        </p>

        {/*
         * One named venue, not a directory. Telling a visitor with no table
         * in front of them to go and scan one is a dead end, and this page is
         * where anyone arriving from a link lands. The Anchor is seeded demo
         * data, so pointing at it publishes nothing a customer owns.
         */}
        <Link
          href="/v/the-anchor"
          className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-lg border border-line
                     px-4 text-sm font-medium text-ink hover:border-line-strong
                     hover:bg-surface-2"
        >
          See an example list
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <p className="mt-2 text-xs text-ink-faint">
          The Anchor is a demonstration venue.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-line p-5">
        <h2 className="font-semibold">Run a venue?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your list, and open karaoke when the night starts.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium
 text-white hover:bg-accent-hover"
        >
          Venue sign in
        </Link>

        {/*
         * A form, not a link. This builds a venue and copies 55 songs into
         * it, and a GET that does that fires on its own the first time
         * something prefetches the page.
         */}
        <form action={startDemo} className="mt-4 border-t border-line pt-4">
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line
                       px-4 text-sm font-medium text-ink hover:border-line-strong
                       hover:bg-surface-2"
          >
            Try the backoffice
            <span aria-hidden="true">&rarr;</span>
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            No account. You get your own copy of a venue, wiped tonight.
          </p>
          {demoFailed && (
            <p role="alert" className="mt-2 text-xs text-danger">
              The demo could not start just now. Please try again shortly.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
