// Cross-site request forgery check for route handlers (docs/architecture.md, section 8; workload W3).
// Server actions get the same check from Next itself.

/**
 * True when a state-changing request comes from a page on this site: the Origin header must be
 * present and name the same host the request was sent to. Browsers always send Origin on POST,
 * so a missing one means a non-browser client or a stripped header, and is refused.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
