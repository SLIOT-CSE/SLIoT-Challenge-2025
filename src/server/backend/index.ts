import { driveConfig, getEnv, sheetsConfig, turnstileConfig } from "../env";
import { createDriveUploader, createSheetsExporter } from "../services/google";
import { verifyTurnstileToken, youtubeVideoExists } from "../services/checks";
import { adminBackend } from "./admin";
import type { DriveUploader, RequestContext, Service, Services, SheetsExporter } from "./context";
import { teamBackend, type TurnstileVerifier } from "./team";

// The whole backend for one request: the same functions, names and return shapes the
// screens used with the sample store (src/lib/data), now backed by SQLite.

export type { RequestContext } from "./context";

export function createBackend(ctx: RequestContext, verifyTurnstile: TurnstileVerifier = turnstileFromEnv(ctx.production)) {
  return { ...teamBackend(ctx, verifyTurnstile), ...adminBackend(ctx) };
}

export type Backend = ReturnType<typeof createBackend>;

// One client per process, so cached access tokens and Drive folder ids are reused
let drive: Service<DriveUploader> | null = null;
let sheets: Service<SheetsExporter> | null = null;

/** The real outside services, configured from env variables */
export function servicesFromEnv(): Services {
  return {
    drive: () => {
      if (drive?.ok) return drive;
      const config = driveConfig();
      drive = config.ok ? { ok: true, service: createDriveUploader(config.config) } : { ok: false, missing: config.missing };
      return drive;
    },
    sheets: () => {
      if (sheets?.ok) return sheets;
      const config = sheetsConfig();
      sheets = config.ok ? { ok: true, service: createSheetsExporter(config.config) } : { ok: false, missing: config.missing };
      return sheets;
    },
    youtubeVideoExists: (id) => youtubeVideoExists(id),
  };
}

/**
 * Turnstile from env. Production refuses to start without the keys (instrumentation.ts), so
 * the only time they're missing is development, where the form shows a placeholder and the
 * check is skipped.
 */
function turnstileFromEnv(production: boolean): TurnstileVerifier {
  return async (token, ip) => {
    const config = turnstileConfig(getEnv());
    if (!config.ok) return !production;
    return verifyTurnstileToken(config.config.secretKey, token, ip);
  };
}
