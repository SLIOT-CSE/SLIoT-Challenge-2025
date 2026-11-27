import { getDb } from "./db/client";
import { createSmtpSender } from "./email/transport";
import { startEmailWorker } from "./email/worker";
import { emailConfig, getEnv, missingProductionEnv } from "./env";

// Server start-up, called from src/instrumentation.ts.

const globalForStart = globalThis as typeof globalThis & { __sliotStarted?: boolean };

export function startServer(): void {
  // Hot reload in development calls register() again; start once per process
  if (globalForStart.__sliotStarted) return;
  globalForStart.__sliotStarted = true;

  const env = getEnv();
  if (env.NODE_ENV === "production") {
    const missing = missingProductionEnv(env);
    if (missing.length > 0) {
      // Refuse to start rather than run without email, Drive or the bot check
      throw new Error(`Missing production settings: ${missing.join(", ")}. See .env.example.`);
    }
  }

  const email = emailConfig(env);
  if (!email.ok) console.warn(`Email is not set up (missing ${email.missing.join(", ")}). Emails will wait in the outbox.`);

  startEmailWorker({
    db: getDb(),
    send: email.ok ? createSmtpSender(email.config) : null,
    missing: email.ok ? [] : email.missing,
    siteUrl: env.SITE_URL ?? "http://localhost:3000",
  });
}
