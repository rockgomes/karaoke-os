import AppFrame from "@/components/app-frame";
import { getMemberships, isPlatformAdmin, requireUser } from "@/lib/auth";
import { accountNav, toPlatform } from "@/lib/nav";
import NewVenueForm from "./new-venue-form";

export const metadata = { title: "Add a venue — Karaoke OS" };

export default async function NewVenuePage() {
  const user = await requireUser();
  const [memberships, platform] = await Promise.all([
    getMemberships(),
    isPlatformAdmin(user.id),
  ]);

  return (
    <AppFrame
      title="Karaoke OS"
      subtitle="Add a venue"
      email={user.email ?? ""}
      switchTo={toPlatform(platform)}
      groups={accountNav({
        venues: memberships.map((m) => m.venues),
        isPlatformAdmin: platform,
      })}
    >
      <div className="max-w-lg">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Add a venue
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          You become its owner. A song list is created with it.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <NewVenueForm />
        </div>
      </div>
    </AppFrame>
  );
}
