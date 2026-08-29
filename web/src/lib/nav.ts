import type { NavGroup } from "@/components/side-nav";

export type NavVenue = { name: string; slug: string };

export type NavContext = {
  /** Every venue this person works at. */
  venues: NavVenue[];
  isPlatformAdmin: boolean;
  /** The venue currently open, if any. Keeps the rail from linking to itself. */
  currentSlug?: string;
};

/**
 * The account group is the same everywhere, so the rail does not rearrange
 * itself as you move between a venue and the venue list.
 */
function accountGroup({
  venues,
  isPlatformAdmin,
  currentSlug,
}: NavContext): NavGroup {
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

  if (isPlatformAdmin) {
    items.push({ href: "/platform", label: "All venues", icon: "platform" });
  }

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
