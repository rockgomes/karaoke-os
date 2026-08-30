import Link from "next/link";

/**
 * Every number here is counted in the database on this request.
 *
 * The panel this replaces carried "Pending Requests 12", "QR Scans Today 143"
 * and "+16% vs yesterday" as hard-coded strings that never moved. A number no
 * one can trust is worse than no number, so a card only exists here if there
 * is something real behind it.
 */
export type Stat = {
  label: string;
  value: string | number;
  /** Only ever a fact, a link, or a control — never a decorative trend. */
  detail?: React.ReactNode;
};

export default function Stats({ stats }: { stats: Stat[] }) {
  return (
    /*
     * A phone gets one scrolling strip; anything wider gets the grid. Four
     * stacked cards pushed the first song more than a screen down the page,
     * on a screen whose job is the song list.
     */
    <dl
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid
                 sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0
                 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex w-40 shrink-0 flex-col rounded-lg border border-line
                     bg-surface p-3 sm:w-auto sm:rounded-xl sm:p-4"
        >
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
            {stat.label}
          </dt>
          {/*
           * 20px against the 30px page title is a 1.5x step. At 30px the
           * numbers tied with the heading, so five things competed to be the
           * first thing you saw.
           */}
          <dd className="mt-1.5 font-display text-xl font-semibold leading-none tabular-nums text-ink">
            {stat.value}
          </dd>
          {/* Always rendered, so cards in a row end up the same height. */}
          <div className="mt-2 min-h-5 text-xs text-ink-soft">{stat.detail}</div>
        </div>
      ))}
    </dl>
  );
}

/** A stat detail that links somewhere useful. */
export function StatLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-my-2 inline-flex min-h-11 items-center text-accent
                 underline-offset-4 hover:underline"
      scroll={false}
    >
      {children}
    </Link>
  );
}
