import NewVenueForm from "./new-venue-form";

export const metadata = { title: "Add a venue — Karaoke OS" };

export default function NewVenuePage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Add a venue</h1>
      <p className="mt-1 text-sm text-neutral-500">
        You become its owner. A song list is created with it.
      </p>
      <NewVenueForm />
    </main>
  );
}
