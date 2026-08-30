import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 calls this a proxy; it was called middleware before.
// Refreshes the auth session on every request so server components see a
// valid user. Without this, a token that expired mid-visit logs the user out.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching getUser() is what performs the refresh. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * A swept demo venue leaves live bookmarks and shared links behind it.
   *
   * Whoever follows one is, by definition, not staff, so the sign-in form the
   * admin layout would send them to is the wrong answer: it asks the one
   * person we know has no account to make one. Send them to the front door,
   * which offers a fresh demo instead.
   *
   * It has to happen here rather than in the venue layout, because the auth
   * gate one level up redirects before that layout ever sees the slug.
   *
   * create_venue reserves the demo- prefix, so no real venue is ever here.
   */
  if (!user && request.nextUrl.pathname.startsWith("/admin/demo-")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "demo=expired";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
