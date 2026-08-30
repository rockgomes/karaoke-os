import AppFrame from "@/components/app-frame";
import { getMemberships, requireUser } from "@/lib/auth";
import { accountNav } from "@/lib/nav";
import PageHeader, { Panel } from "@/components/page-header";
import NewVenueForm from "./new-venue-form";

export const metadata = { title: "Add a venue — Karaoke OS" };

export default async function NewVenuePage() {
  const user = await requireUser();
  const memberships = await getMemberships();

  return (
    <AppFrame
      title="Karaoke OS"
      subtitle="Add a venue"
      email={user.email ?? ""}
      groups={accountNav({ venues: memberships.map((m) => m.venues) })}
    >
      <div className="max-w-lg">
        <PageHeader
          title="Add a venue"
          description="You become its owner. A song list is created with it."
        />
        <Panel className="mt-6">
          <NewVenueForm />
        </Panel>
      </div>
    </AppFrame>
  );
}
