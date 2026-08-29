/**
 * Where to send someone after they sign in.
 *
 * Only a path on this site is ever allowed. A `next` value arrives in a query
 * string, so anyone can put anything there; without this check a link like
 * `/login?next=https://example.com/` would turn our own sign-in page into a
 * redirect to someone else's, which is exactly the shape of a phishing link.
 *
 * Rejected: absolute URLs, protocol-relative `//host`, and backslashes, which
 * some browsers normalise to a slash.
 */
export function safeNext(
  value: string | string[] | undefined,
  fallback = "/admin",
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}
