import { notFound, redirect } from "next/navigation";
import AppFrame from "@/components/app-frame";
import { getMemberships, getMembershipBySlug } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { venueNav } from "@/lib/nav";
import SessionToggle from "./session-toggle";
import DemoBanner from "@/components/demo-banner";

export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  /*
   * A swept demo leaves live bookmarks and shared links behind it.
   *
   * The default answers are both wrong for whoever follows one. The staff
   * sign-in form tells the one person we know is not staff that they need an
   * account, and a bare 404 does not explain itself either. Send them back to
   * the front door, which can offer them a fresh one.
   *
   * Only demo- slugs take this path, and create_venue reserves that prefix,
   * so no real venue can ever be sitting on one.
   */
  const swept = slug.startsWith("demo-") ? "/?demo=expired" : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(swept ?? "/login");

  const membership = await getMembershipBySlug(slug);
  if (!membership) {
    if (swept) redirect(swept);
    notFound();
  }

  const [memberships, { data: openSession }] = await Promise.all([
    getMemberships(),
    supabase
      .from("sessions")
      .select("id")
      .eq("venue_id", membership.venue_id)
      .is("closed_at", null)
      .maybeSingle(),
  ]);

  return (
    <AppFrame
      title={membership.venues.name}
      live={Boolean(openSession)}
      // An anonymous visitor has no address to show, and an empty line
      // under the nav looks like something failed to load.
      email={user.email ?? "Demo visitor"}
      groups={venueNav(slug, {
        venues: memberships.map((m) => m.venues),
        isDemo: membership.venues.is_demo,
      })}
      sessionControl={
        <SessionToggle slug={slug} openSessionId={openSession?.id ?? null} />
      }
    >
      {membership.venues.is_demo && <DemoBanner slug={slug} />}
      {children}
    </AppFrame>
  );
}
