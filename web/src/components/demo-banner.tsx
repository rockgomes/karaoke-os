import Link from "next/link";

/**
 * Sits above a demo venue's pages.
 *
 * Two jobs: say that everything here is safe to break, and say when it goes.
 * A sandbox nobody dares touch demonstrates nothing, and one that quietly
 * disappears feels like a bug rather than a decision.
 *
 * "Tonight" rather than a timestamp: the exact hour is not the point, and a
 * formatted date rendered on two machines is a hydration mismatch waiting to
 * happen.
 */
export default function DemoBanner({ slug }: { slug: string }) {
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-accent/35 bg-accent/[0.07] px-4 py-3"
    >
      <p className="text-sm font-medium text-ink">
        This venue is yours. Break anything.
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        A private copy, made when you arrived. Add songs, import a list, print
        a code for the tables. It is deleted tonight, and nobody else can see
        it.
      </p>
      <Link
        href={`/v/${slug}`}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium
                   text-accent underline-offset-4 hover:underline"
      >
        See what your guests would see
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
