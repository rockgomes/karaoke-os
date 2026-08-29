"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type AuthState = { error: string | null; notice?: string | null };

/**
 * One action for both sign in and sign up, with the mode carried in the form.
 *
 * Swapping the function passed to useActionState does not work: the hook keeps
 * the action it was first given, so the form went on calling sign up after the
 * button had switched to "Sign in".
 */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode") === "signup" ? "signup" : "signin";
  // Validated, not trusted: this value came from a query string.
  const next = safeNext(String(formData.get("next") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();

  if (mode === "signup") {
    if (password.length < 8) {
      return { error: "Use a password of at least 8 characters." };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // With email confirmation on there is no session yet. Supabase returns
    // this same shape for an address that already exists, on purpose, so
    // that a stranger cannot test which emails are registered.
    if (!data.session) {
      return { error: null, notice: "Check your email to confirm the account." };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Do not say which of the two was wrong, for the same reason.
    if (error) return { error: "That email and password do not match." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
