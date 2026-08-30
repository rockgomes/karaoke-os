import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VenueMembership = {
  venue_id: string;
  role: "owner" | "dj";
  venues: {
    id: string;
    name: string;
    slug: string;
    /** A throwaway clone one visitor was handed. Not a customer. */
    is_demo: boolean;
    expires_at: string | null;
  };
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

/** Whether this user is platform staff. Used to decide what the rail shows. */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_platform_admin);
}

/** Sends anyone who is not platform staff to a 404 rather than a hint. */
export async function requirePlatformAdmin() {
  const user = await requireUser();

  // notFound, not a message: someone poking at /platform learns nothing
  // about whether the page exists.
  if (!(await isPlatformAdmin(user.id))) notFound();
  return user;
}

/**
 * The venues this user works at. Empty for a patron, and empty for an
 * operator who staffs nowhere.
 *
 * The user filter is not redundant. Row level security says who *may* read a
 * membership row, and it lets platform staff read all of them — which is
 * reasonable for a support view. Leaving the query unfiltered made the app
 * treat everything readable as "mine", so an operator with no memberships at
 * all was handed every venue in the database and walked straight into
 * /admin/[slug]. Readable is not the same as mine, and the query should say
 * which one it means.
 */
export async function getMemberships(): Promise<VenueMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("memberships")
    .select("venue_id, role, venues(id, name, slug, is_demo, expires_at)")
    .eq("user_id", user.id)
    .order("venue_id");
  return (data ?? []) as unknown as VenueMembership[];
}

/**
 * The membership for one venue slug, or null if this user does not work there.
 * This is the gate on /admin/[slug], so it has to mean "works here" rather
 * than "may read".
 */
export async function getMembershipBySlug(
  slug: string,
): Promise<VenueMembership | null> {
  const memberships = await getMemberships();
  return memberships.find((m) => m.venues?.slug === slug) ?? null;
}
