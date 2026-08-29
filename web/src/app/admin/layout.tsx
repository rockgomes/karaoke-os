import Link from "next/link";
import { getMemberships, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const memberships = await getMemberships();

  // Only platform staff get the link, and only they can open the page.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-full">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3">
          <Link
            href="/admin"
            className="font-semibold underline-offset-4 hover:underline
                       focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Karaoke OS
          </Link>
          {/* "Add a venue" lives here because /admin skips the venue list
              when you own exactly one, which otherwise left the button with
              nowhere to be reached from. */}
          <Link
            href="/admin/new"
            className="text-sm text-neutral-500 underline-offset-4 hover:underline
                       focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Add a venue
          </Link>

          {memberships.length > 1 && (
            <Link
              href="/admin"
              className="text-sm text-neutral-500 underline-offset-4 hover:underline
                         focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Your venues
            </Link>
          )}

          {profile?.is_platform_admin && (
            <Link
              href="/platform"
              className="text-sm text-neutral-500 underline-offset-4 hover:underline
                         focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              All venues
            </Link>
          )}

          <span className="ml-auto truncate text-sm text-neutral-500">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm text-neutral-500 underline-offset-4
                         hover:underline focus-visible:outline-2
                         focus-visible:outline-blue-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
