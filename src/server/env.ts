import path from "node:path";
import { z } from "zod";

// Server configuration from environment variables. Every variable is listed, without values,
// in .env.example. Nothing here may be imported by client components.
//
// Features that need outside accounts (email, Drive) have no fallback: until their variables
// are set, uploads fail with a clear error and emails wait in the outbox. In production the
// server refuses to start while any of them is missing (see missingProductionEnv).

/** Empty strings count as unset, so `KEY=` in a .env file behaves like a missing key */
const optional = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  /** SQLite file. Development default: ./data/sliot.db. Production: /var/lib/sliot/sliot.db */
  DATABASE_PATH: optional,

  /** Public address of the site, used for links in emails. e.g. https://sliot.cse.mrt.ac.lk */
  SITE_URL: optional,

  // Email through Google Workspace SMTP (docs/architecture.md section 7)
  SMTP_HOST: optional,
  SMTP_PORT: optional,
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  /** e.g. "SLIoT Challenge <sliot@cse.mrt.ac.lk>" */
  EMAIL_FROM: optional,

  // Proposal uploads to Google Drive, as sliot@cse.mrt.ac.lk through OAuth (workload R3)
  GOOGLE_OAUTH_CLIENT_ID: optional,
  GOOGLE_OAUTH_CLIENT_SECRET: optional,
  GOOGLE_OAUTH_REFRESH_TOKEN: optional,
  GOOGLE_DRIVE_FOLDER_ID: optional,

  // Sheets export through the service account (workload R2, R4)
  /** Path to the service account's JSON key file, e.g. /etc/sliot/google-sa.json */
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE: optional,
  /** The master spreadsheet's ID (from its URL) */
  GOOGLE_SHEET_ID: optional,

  // Cloudflare Turnstile on the registration form (workload R5)
  TURNSTILE_SECRET_KEY: optional,
  /** Public; read by the browser */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional,
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** The parsed environment. Read once; tests can pass their own values to parseEnv instead */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

export const DEFAULT_DEV_DATABASE_PATH = path.join("data", "sliot.db");

/** Where the SQLite file lives. Production must set DATABASE_PATH explicitly */
export function databasePath(env: Env = getEnv()): string {
  if (env.DATABASE_PATH) return env.DATABASE_PATH;
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_PATH is not set. In production it must point at /var/lib/sliot/sliot.db");
  }
  return path.resolve(DEFAULT_DEV_DATABASE_PATH);
}

/** A feature's settings, or the names of the variables it still needs */
export type FeatureConfig<T> = { ok: true; config: T } | { ok: false; missing: string[] };

function pick<K extends keyof Env>(env: Env, keys: readonly K[]): FeatureConfig<{ [P in K]: NonNullable<Env[P]> }> {
  const missing = keys.filter((key) => env[key] === undefined).map(String);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: Object.fromEntries(keys.map((key) => [key, env[key]])) as { [P in K]: NonNullable<Env[P]> } };
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export function emailConfig(env: Env = getEnv()): FeatureConfig<EmailConfig> {
  const result = pick(env, ["SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"] as const);
  if (!result.ok) return result;
  const port = Number(env.SMTP_PORT ?? "465");
  if (!Number.isInteger(port) || port <= 0) return { ok: false, missing: ["SMTP_PORT (not a valid port)"] };
  return {
    ok: true,
    config: {
      host: env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      user: result.config.SMTP_USER,
      password: result.config.SMTP_PASSWORD,
      from: result.config.EMAIL_FROM,
    },
  };
}

export interface DriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
}

export function driveConfig(env: Env = getEnv()): FeatureConfig<DriveConfig> {
  const result = pick(env, [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GOOGLE_DRIVE_FOLDER_ID",
  ] as const);
  if (!result.ok) return result;
  return {
    ok: true,
    config: {
      clientId: result.config.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: result.config.GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: result.config.GOOGLE_OAUTH_REFRESH_TOKEN,
      folderId: result.config.GOOGLE_DRIVE_FOLDER_ID,
    },
  };
}

export interface SheetsConfig {
  keyFile: string;
  sheetId: string;
}

export function sheetsConfig(env: Env = getEnv()): FeatureConfig<SheetsConfig> {
  const result = pick(env, ["GOOGLE_SERVICE_ACCOUNT_KEY_FILE", "GOOGLE_SHEET_ID"] as const);
  if (!result.ok) return result;
  return { ok: true, config: { keyFile: result.config.GOOGLE_SERVICE_ACCOUNT_KEY_FILE, sheetId: result.config.GOOGLE_SHEET_ID } };
}

export function turnstileConfig(env: Env = getEnv()): FeatureConfig<{ secretKey: string; siteKey: string }> {
  const result = pick(env, ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"] as const);
  if (!result.ok) return result;
  return { ok: true, config: { secretKey: result.config.TURNSTILE_SECRET_KEY, siteKey: result.config.NEXT_PUBLIC_TURNSTILE_SITE_KEY } };
}

/** Every variable production needs that isn't set. The server refuses to start unless this is empty */
export function missingProductionEnv(env: Env = getEnv()): string[] {
  const missing: string[] = [];
  if (!env.DATABASE_PATH) missing.push("DATABASE_PATH");
  if (!env.SITE_URL) missing.push("SITE_URL");
  const email = emailConfig(env);
  if (!email.ok) missing.push(...email.missing);
  const drive = driveConfig(env);
  if (!drive.ok) missing.push(...drive.missing);
  const turnstile = turnstileConfig(env);
  if (!turnstile.ok) missing.push(...turnstile.missing);
  // The Sheets export is optional: without it the button explains and the CSV download still works
  return missing;
}
