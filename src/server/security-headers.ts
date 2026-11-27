// Security headers and Content-Security-Policy for every response (docs/architecture.md,
// section 8; workload W1). Used by next.config.ts. Only our own origin is allowed, plus
// Cloudflare Turnstile on the registration form and YouTube thumbnails in the team portal.

export function contentSecurityPolicy(development: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js inlines small bootstrap scripts without a nonce, so 'unsafe-inline' stays for
    // scripts; everything else is limited to our origin and Turnstile. Dev adds eval for HMR.
    "script-src": ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", ...(development ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://img.youtube.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://challenges.cloudflare.com", ...(development ? ["ws:", "wss:"] : [])],
    "frame-src": ["https://challenges.cloudflare.com"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(development ? {} : { "upgrade-insecure-requests": [] }),
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}

export function securityHeaders(development: boolean): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(development) },
    // HTTPS only for two years, once the site is served over HTTPS (production)
    ...(development ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
