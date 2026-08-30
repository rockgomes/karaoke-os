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
  /** Only ever a fact or a link — never a decorative trend. */
  detail?: React.ReactNode;
};

export default function Stats({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          {stat.detail && (
            <div className="mt-2 text-xs text-ink-soft">{stat.detail}</div>
          )}
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
