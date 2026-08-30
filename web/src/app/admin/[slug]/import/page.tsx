import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembershipBySlug, requireUser } from "@/lib/auth";
import ImportForm from "./import-form";

export const metadata = { title: "Import songs — Karaoke OS" };

export default async function ImportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();

  const membership = await getMembershipBySlug(slug);
  if (!membership) notFound();

  const supabase = await createClient();
  const { data: libraries } = await supabase
    .from("libraries")
    .select("id, name")
    .eq("venue_id", membership.venue_id)
    .order("created_at");

  const library = libraries?.[0] ?? null;

  return (
    <>

      <h1 className="font-display text-3xl font-semibold tracking-tight">Import songs</h1>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">
        Choose a CSV file or paste the rows. With a header row the columns
        can be in any order and are matched by name — <strong>title</strong>,
        <strong> artist</strong>, <strong> genre</strong>,
        <strong> length</strong>, <strong> year</strong>,
        <strong> album</strong>, and the usual alternatives such as
        <strong> song</strong> or <strong> performer</strong>. Without a
        header they are read in that order. Only a title and an artist are
        needed.
      </p>

      {library ? (
        <ImportForm slug={slug} libraryId={library.id} />
      ) : (
        <p className="mt-6 text-ink-soft">This venue has no song list.</p>
      )}
    </>
  );
}
