import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
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
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
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

        <h1 className="font-display text-3xl font-semibold tracking-tight">Code for the tables</h1>
        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Guests scan this and see your song list. No app, no account. Print the
          card below and put one on each table.
        </p>
      </div>

      {/*
        The card is what gets printed. Everything else is hidden on paper.
        Its colours are literal rather than themed: this is a preview of a
        piece of paper, so it must stay black on white in either theme.
      */}
      <section
        id="table-card"
        className="mx-auto mt-8 max-w-sm rounded-2xl border border-line bg-white p-8
                   text-center text-neutral-900"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Karaoke tonight
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          {membership.venues.name}
        </h2>

        <div
          className="mx-auto mt-6 w-56 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="mt-6 text-base font-medium">Scan to see the song list</p>
        <p className="mt-1 break-all font-mono text-xs text-neutral-500">{url}</p>
      </section>

      <div className="no-print">
        <ShareActions url={url} slug={slug} />
      </div>

      <style>{`
        @media print {
          #table-card { border: none; max-width: none; margin: 0 auto; padding: 0; }
        }
      `}</style>
    </>
  );
}
