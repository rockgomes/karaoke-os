import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
import PageHeader, { Panel } from "@/components/page-header";
import ShareActions from "./share-actions";

export const metadata = { title: "QR code — Karaoke OS" };

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();

  const membership = await getMembershipBySlug(slug);
  if (!membership) notFound();

  // Build the address from the request, so the printed code points at
  // whatever host this is actually served from.
  const head = await headers();
  const host = head.get("host") ?? "localhost:3000";
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = `${protocol}://${host}/v/${slug}`;

  // Generated here, not fetched from a QR image service. A code on every
  // table should not depend on someone else's server still being up.
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Code for the tables"
          description="Guests scan this and see your song list. No app, no account. Print one for each table."
        />
      </div>

      {/*
       * The card is the product here, so it gets the room. It sits on its own
       * stage rather than floating on the page background, and the things you
       * do with it stand beside it instead of underneath as a row of ghosts.
       */}
      <div
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start
                   print:mt-0 print:block"
      >
        {/* The stage is screen-only dressing; on paper it collapses to
            nothing and leaves the card by itself. */}
        <div
          className="flex items-center justify-center rounded-xl border border-line
                     bg-surface-2 p-6 sm:p-10 print:block print:border-0
                     print:bg-transparent print:p-0"
        >
          <TableCard name={membership.venues.name} svg={svg} url={url} />
        </div>

        <Panel className="no-print">
          <h2 className="font-display text-lg font-semibold">
            Put it on the tables
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Print the card, or take the image to whoever does your signage.
          </p>

          <ShareActions url={url} slug={slug} />

          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
              The link behind it
            </p>
            <p className="mt-1 break-all font-mono text-xs text-ink-soft">{url}</p>
          </div>
        </Panel>
      </div>


      <style>{`
        @media print {
          #table-card { border: none; max-width: none; margin: 0 auto; padding: 0; }
        }
      `}</style>
    </>
  );
}

/**
 * What gets printed and stuck on a table.
 *
 * Its colours are literal rather than themed. This is a preview of a piece of
 * paper, so it stays black on white whichever theme the screen is in.
 */
function TableCard({
  name,
  svg,
  url,
}: {
  name: string;
  svg: string;
  url: string;
}) {
  return (
    <section
      id="table-card"
      className="w-full max-w-sm rounded-2xl border border-line bg-white p-8
                 text-center text-neutral-900"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Karaoke tonight
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
        {name}
      </h2>

      <div
        className="mx-auto mt-6 w-56 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p className="mt-6 text-base font-medium">Scan to see the song list</p>
      <p className="mt-1 break-all font-mono text-xs text-neutral-500">{url}</p>
    </section>
  );
}
