import type { NavGroup } from "@/components/side-nav";

export type NavVenue = { name: string; slug: string };

export type NavContext = {
  /** Every venue this person works at. */
  venues: NavVenue[];
  isPlatformAdmin: boolean;
  /** The venue currently open, if any. Keeps the rail from linking to itself. */
  currentSlug?: string;
};

/** Where the rail offers to take you when you leave this surface entirely. */
export type SurfaceSwitch = { href: string; label: string };

/**
 * Two surfaces, two rails.
 *
 * Running a bar and running Karaoke OS are different jobs. The platform used
 * to be a link in the venue rail, sitting between "Add a venue" and the rest,
 * so choosing it silently moved you into a different product. Now each
 * surface has its own navigation, and the way across is a switch set apart
 * from it rather than an item within it.
 */
function accountGroup({ venues, currentSlug }: NavContext): NavGroup {
  const items: NavGroup["items"] = [];

  if (venues.length > 1) {
    items.push({ href: "/admin", label: "Your venues", icon: "venues" });
  } else if (venues.length === 1 && venues[0].slug !== currentSlug) {
    // /admin sends someone with one venue straight into it, so a link called
    // "Your venues" would be a list of one. Name the venue instead. Without
    // this, "Add a venue" is a dead end for everyone who owns exactly one.
    items.push({
      href: `/admin/${venues[0].slug}`,
      label: venues[0].name,
      icon: "venues",
    });
  }

  items.push({ href: "/admin/new", label: "Add a venue", icon: "add" });

  return { label: "Account", items };
}

export function venueNav(slug: string, context: NavContext): NavGroup[] {
  return [
    {
      label: "Venue",
      items: [
        { href: `/admin/${slug}`, label: "Songs", icon: "songs" },
        { href: `/admin/${slug}/import`, label: "Import a CSV", icon: "import" },
        { href: `/admin/${slug}/share`, label: "QR code", icon: "qr" },
        {
          href: `/v/${slug}`,
          label: "What guests see",
          icon: "guest",
          external: true,
        },
      ],
    },
    accountGroup({ ...context, currentSlug: slug }),
  ];
}

export function accountNav(context: NavContext): NavGroup[] {
  return [accountGroup(context)];
}

/** The operator's own rail. No venue navigation belongs here. */
export function platformNav(): NavGroup[] {
  return [
    {
      label: "Platform",
      items: [{ href: "/platform", label: "Venues", icon: "platform" }],
    },
  ];
}

/** From a venue or the account pages, into the operator surface. */
export function toPlatform(isPlatformAdmin: boolean): SurfaceSwitch | undefined {
  return isPlatformAdmin ? { href: "/platform", label: "Platform" } : undefined;
}

/** And back again. */
export const TO_VENUES: SurfaceSwitch = { href: "/admin", label: "Your venues" };
