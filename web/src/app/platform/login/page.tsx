import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth";
import LoginForm from "@/app/login/login-form";

export const metadata = { title: "Operator sign in — Karaoke OS" };

/**
 * The operator's own door.
 *
 * Running Karaoke OS and running a bar are different jobs done by different
 * people, so they get different entrances and different accounts. Nothing on
 * a venue screen links here, and nothing here links to a venue.
 *
 * No sign-up: an operator account is granted, not claimed.
 */
export default async function PlatformLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already an operator? Straight through. Signed in as somebody else? Stay
  // here, so a venue account can sign out and in as the right one.
  if (user && (await isPlatformAdmin(user.id))) redirect("/platform");

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
        Karaoke OS
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        Operator sign in
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        For the people who run Karaoke OS. Venue staff sign in on their own
        venue&rsquo;s page.
      </p>

      <LoginForm next="/platform" allowSignUp={false} />

      {user && (
        <p className="mt-6 text-center text-xs text-ink-faint">
          Signed in as {user.email}, which is not an operator account.
        </p>
      )}
    </main>
  );
}
