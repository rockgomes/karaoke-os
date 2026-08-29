"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth";

/**
 * Suspending hides a venue from guests. Its own staff keep seeing it, so
 * whatever caused the suspension can be sorted out.
 *
 * The database decides who may do this — set_venue_suspended refuses anyone
 * who is not platform staff. The check here only gives a clearer failure.
 */
export async function setVenueSuspended(formData: FormData) {
  await requirePlatformAdmin();

  const venueId = String(formData.get("venue_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const suspend = formData.get("suspend") === "true";
  if (!venueId) return;

  const supabase = await createClient();
  await supabase.rpc("set_venue_suspended", {
    target_venue: venueId,
    suspended: suspend,
  });

  revalidatePath("/platform");
  if (slug) revalidatePath(`/v/${slug}`);
}
