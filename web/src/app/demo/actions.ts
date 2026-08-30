"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Hands this visitor their own copy of the demo venue and opens it.
 *
 * A POST, not a link: it creates a venue and 55 songs, and a GET that does
 * that goes off on its own the first time something prefetches it.
 *
 * The clone itself happens in start_demo(), one transaction in the database.
 * The visitor never holds the rights to build a venue — this only asks.
 */
export async function startDemo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Staff already have a venue. Dropping them into a sandbox that looks
  // almost the same is a good way to lose track of which one is real.
  if (user && !user.is_anonymous) redirect("/admin");

  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) redirect("/?demo=unavailable");
  }

  const { data: slug, error } = await supabase.rpc("start_demo");
  if (error || !slug) redirect("/?demo=unavailable");

  redirect(`/admin/${slug}`);
}
