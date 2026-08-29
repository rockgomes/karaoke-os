import SideNav, { type NavGroup } from "./side-nav";

/**
 * One surface, one menu. Every signed-in page hangs off this frame, so there
 * is never a top navigation duplicating what the rail already shows.
 */
export default function AppFrame({
  title,
  subtitle,
  live,
  groups,
  email,
  sessionControl,
  children,
}: {
  title: string;
  subtitle?: string;
  live?: boolean;
  groups: NavGroup[];
  email: string;
  sessionControl?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <SideNav
        title={title}
        subtitle={subtitle}
        live={live}
        groups={groups}
        email={email}
        sessionControl={sessionControl}
      />
      <main className="min-w-0 flex-1 bg-ground">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
