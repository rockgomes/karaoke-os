"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type NewVenueState = { error: string | null };

export async function createVenue(
  _prev: NewVenueState,
  formData: FormData,
): Promise<NewVenueState> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);

  if (!name) return { error: "Give the venue a name." };
  if (!slug) return { error: "That name cannot be turned into a web address." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_venue", {
    venue_name: name,
    venue_slug: slug,
  });

  if (error) {
    // 23505 is a unique violation, which here always means the slug is taken.
    if (error.code === "23505") {
      return { error: `The address "${slug}" is already taken. Try another.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  redirect(`/admin/${slug}`);
}
