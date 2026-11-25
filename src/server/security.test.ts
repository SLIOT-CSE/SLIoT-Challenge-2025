import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("security headers", () => {
  it("allow only our origin plus Turnstile, and forbid framing", () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy(true)).toContain("unsafe-eval");
  });

  it("send HSTS in production only", () => {
    const names = (dev: boolean) => securityHeaders(dev).map((h) => h.key);
    expect(names(false)).toContain("Strict-Transport-Security");
    expect(names(true)).not.toContain("Strict-Transport-Security");
    expect(names(false)).toEqual(expect.arrayContaining(["X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options"]));
  });
});

describe("isSameOrigin", () => {
  const h = (values: Record<string, string>) => new Headers(values);
  it("accepts a request from a page on the same host", () => {
    expect(isSameOrigin(h({ origin: "https://sliot.cse.mrt.ac.lk", host: "sliot.cse.mrt.ac.lk" }))).toBe(true);
    expect(isSameOrigin(h({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
  });
  it("refuses another site, a missing Origin and a malformed one", () => {
    expect(isSameOrigin(h({ origin: "https://evil.example", host: "sliot.cse.mrt.ac.lk" }))).toBe(false);
    expect(isSameOrigin(h({ host: "sliot.cse.mrt.ac.lk" }))).toBe(false);
    expect(isSameOrigin(h({ origin: "null", host: "sliot.cse.mrt.ac.lk" }))).toBe(false);
  });
});
