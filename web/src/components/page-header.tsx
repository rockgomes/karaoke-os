/**
 * The top of every signed-in page.
 *
 * Without one, a page was a heading, a paragraph, then content sitting loose
 * on the background — which is what made Import and the QR code look
 * unfinished next to the songs table, whose content happens to live in a
 * card. Title on the left, this page's actions on the right, content below
 * on a surface.
 */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  /** A node rather than a string, so a page can hide it on a phone. */
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-prose">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** A block of content on its own surface. */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </section>
  );
}
