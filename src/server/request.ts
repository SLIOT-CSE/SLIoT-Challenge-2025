import "server-only";
import { cookies, headers } from "next/headers";
import type { CookieJar, RequestContext } from "./backend/context";
import { createBackend, servicesFromEnv } from "./backend";
import { getDb } from "./db/client";
import { getEnv } from "./env";

// Builds the backend for the request being handled, from Next's cookies and headers.

/**
 * The visitor's address. nginx sets X-Real-IP to the connecting address (deploy/nginx.conf.example);
 * the Node server only listens on 127.0.0.1, so the header can't be forged from outside.
 */
export function clientIp(h: Headers): string | null {
  const real = h.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 64);
  return getEnv().NODE_ENV === "production" ? null : "127.0.0.1";
}

export async function requestContext(): Promise<RequestContext> {
  const production = getEnv().NODE_ENV === "production";
  const jar = await cookies();
  const h = await headers();
  const cookieJar: CookieJar = {
    get: (name) => jar.get(name)?.value,
    set: (name, value, maxAgeSeconds) =>
      jar.set(name, value, { httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge: maxAgeSeconds }),
    delete: (name) => jar.delete(name),
  };
  return {
    db: getDb(),
    production,
    ip: clientIp(h),
    userAgent: h.get("user-agent"),
    cookies: cookieJar,
    services: servicesFromEnv(),
  };
}

export async function requestBackend() {
  return createBackend(await requestContext());
}
