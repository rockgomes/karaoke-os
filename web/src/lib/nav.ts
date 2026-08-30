import type { NavGroup } from "@/components/side-nav";

export type NavVenue = { name: string; slug: string };

export type NavContext = {
  /** Every venue this person works at. */
  venues: NavVenue[];
  /** The venue currently open, if any. Keeps the rail from linking to itself. */
  currentSlug?: string;
  /**
   * True for a visitor trying the demo. They are signed in, but they are not
   * a customer, and the database refuses to let them create a venue. The rail
   * should not offer a door the back end holds shut.
   */
  isDemo?: boolean;
};

/**
 * Two systems, not two areas of one.
 *
 * Running a bar and running Karaoke OS are different jobs done by different
 * people. A venue's screens carry no trace of the platform — no tab, no
 * switch, no arrow at the foot of the rail — and the platform carries no
 * venue navigation. Each has its own door at its own address.
 */
function accountGroup({ venues, currentSlug, isDemo }: NavContext): NavGroup {
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

  if (!isDemo) {
    items.push({ href: "/admin/new", label: "Add a venue", icon: "add" });
  }

  return { label: "Account", items };
}

export function venueNav(slug: string, context: NavContext): NavGroup[] {
  // A group with nothing in it still draws its heading. Hiding "Add a venue"
  // from a demo visitor left "Account" sitting on its own at the foot of the
  // rail, labelling nothing.
  return dropEmpty([
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
  ]);
}

export function accountNav(context: NavContext): NavGroup[] {
  return dropEmpty([accountGroup(context)]);
}

function dropEmpty(groups: NavGroup[]): NavGroup[] {
  return groups.filter((group) => group.items.length > 0);
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


