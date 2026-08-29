import { requireUser } from "@/lib/auth";

/**
 * Auth only. The chrome lives in the layouts and pages below this one, so a
 * venue screen and the venue list do not each end up with a header of their
 * own stacked on top of a shared one.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <>{children}</>;
}
