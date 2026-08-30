import { notFound } from "next/navigation";
import AppFrame from "@/components/app-frame";
import {
  getMemberships,
  getMembershipBySlug,
  isPlatformAdmin,
  requireUser,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toPlatform, venueNav } from "@/lib/nav";
import SessionToggle from "./session-toggle";

export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  const membership = await getMembershipBySlug(slug);
  if (!membership) notFound();

  const supabase = await createClient();
  const [memberships, platform, { data: openSession }] = await Promise.all([
    getMemberships(),
    isPlatformAdmin(user.id),
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
      email={user.email ?? ""}
      groups={venueNav(slug, {
        venues: memberships.map((m) => m.venues),
        isPlatformAdmin: platform,
      })}
      switchTo={toPlatform(platform)}
      sessionControl={
        <SessionToggle slug={slug} openSessionId={openSession?.id ?? null} />
      }
    >
      {children}
    </AppFrame>
  );
}
