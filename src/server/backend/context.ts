import type { Db } from "../db/client";
import { readDevNow } from "../settings";

// Everything a backend call needs from the request it runs in. Server actions and route
// handlers build it from Next's cookies and headers; tests build it from plain objects.

export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, maxAgeSeconds: number): void;
  delete(name: string): void;
}

export interface DriveFile {
  fileId: string;
  url: string;
}

/** Puts a proposal PDF in the Drive folder */
export interface DriveUploader {
  upload(input: { fileName: string; category: string; bytes: Uint8Array }): Promise<DriveFile>;
}

/** Rewrites the Teams tab of the master Sheet */
export interface SheetsExporter {
  replaceTeamsTab(rows: string[][]): Promise<void>;
}

/** An outside service, or the env variables it still needs */
export type Service<T> = { ok: true; service: T } | { ok: false; missing: string[] };

export interface Services {
  drive: () => Service<DriveUploader>;
  sheets: () => Service<SheetsExporter>;
  /** True when the video exists and is public or unlisted (YouTube oEmbed) */
  youtubeVideoExists: (videoId: string) => Promise<boolean>;
}

export interface RequestContext {
  db: Db;
  production: boolean;
  ip: string | null;
  userAgent: string | null;
  cookies: CookieJar;
  services: Services;
  /** The real clock. Replaceable in tests */
  clock?: () => number;
}

/** Real time. Sessions use it, so moving the dev clock never signs anyone out */
export function realNow(ctx: RequestContext): number {
  return (ctx.clock ?? Date.now)();
}

/** The moment the app treats as now: the dev clock when one is set (never in production), otherwise the real time */
export function nowFor(ctx: RequestContext): number {
  const real = realNow(ctx);
  return readDevNow(ctx.db, ctx.production, real) ?? real;
}
