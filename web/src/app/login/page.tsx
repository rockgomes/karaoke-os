import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in — Karaoke OS" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Venue sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">
        For bar staff. Guests do not need an account.
      </p>
      <LoginForm />
    </main>
  );
}
