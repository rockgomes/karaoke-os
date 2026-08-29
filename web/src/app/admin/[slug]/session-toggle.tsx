import { toggleSession } from "./actions";

/**
 * The one control someone may need in a hurry, so it sits in the rail rather
 * than partway down a page of song admin.
 */
export default function SessionToggle({
  slug,
  openSessionId,
}: {
  slug: string;
  openSessionId: string | null;
}) {
  const live = Boolean(openSessionId);

  return (
    <form action={toggleSession}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="open_session_id" value={openSessionId ?? ""} />
      <button
        type="submit"
        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          live
            ? "border border-rail-line text-rail-ink hover:bg-rail-2"
            : "bg-accent text-accent-ink hover:bg-accent-hover"
        }`}
      >
        {live ? "Close karaoke" : "Open karaoke"}
      </button>
    </form>
  );
}
