import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VenueMembership = {
  venue_id: string;
  role: "owner" | "dj";
  venues: { id: string; name: string; slug: string };
};

/** Returns the signed-in user, or sends them to the login page. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

/** Sends anyone who is not platform staff to a 404 rather than a hint. */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  // notFound, not a message: someone poking at /platform learns nothing
  // about whether the page exists.
  if (!data?.is_platform_admin) notFound();
  return user;
}

/** The venues this user works at. Empty for a patron. */
export async function getMemberships(): Promise<VenueMembership[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("venue_id, role, venues(id, name, slug)")
    .order("venue_id");
  return (data ?? []) as unknown as VenueMembership[];
}

/**
 * The membership for one venue slug, or null if this user does not work there.
 * Row level security would hide the data anyway; this gives a clean 404
 * instead of an empty screen.
 */
export async function getMembershipBySlug(
  slug: string,
): Promise<VenueMembership | null> {
  const memberships = await getMemberships();
  return memberships.find((m) => m.venues?.slug === slug) ?? null;
}
