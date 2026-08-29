import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

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
