import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in — Karaoke OS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  const next = safeNext(search.next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  // A guest arrives here from a song list, wanting to keep favourites. Staff
  // arrive to run a venue. The page says whichever is true.
  const fromVenue = next.startsWith("/v/");

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {fromVenue ? "Save your songs" : "Venue sign in"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {fromVenue
          ? "An account only keeps your favourites. You never need one to browse the list."
          : "For bar staff. Guests do not need an account."}
      </p>

      <LoginForm next={next} />

      {fromVenue && (
        <Link
          href={next}
          className="mt-6 block text-center text-sm text-ink-soft underline-offset-4 hover:underline"
        >
          ← Back to the songs
        </Link>
      )}
    </main>
  );
}
