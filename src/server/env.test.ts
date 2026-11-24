import path from "node:path";
import { describe, expect, it } from "vitest";
import { databasePath, driveConfig, emailConfig, missingProductionEnv, parseEnv } from "./env";

describe("env", () => {
  it("uses ./data/sliot.db in development and requires DATABASE_PATH in production", () => {
    expect(databasePath(parseEnv({ NODE_ENV: "development" }))).toBe(path.resolve("data/sliot.db"));
    expect(() => databasePath(parseEnv({ NODE_ENV: "production" }))).toThrow(/DATABASE_PATH/);
    expect(databasePath(parseEnv({ NODE_ENV: "production", DATABASE_PATH: "/var/lib/sliot/sliot.db" }))).toBe(
      "/var/lib/sliot/sliot.db",
    );
  });

  it("treats empty values as unset and names what email and Drive still need", () => {
    const env = parseEnv({ SMTP_USER: "sliot@cse.mrt.ac.lk", SMTP_PASSWORD: "  ", GOOGLE_DRIVE_FOLDER_ID: "folder" });
    expect(emailConfig(env)).toEqual({ ok: false, missing: ["SMTP_PASSWORD", "EMAIL_FROM"] });
    expect(driveConfig(env)).toEqual({
      ok: false,
      missing: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"],
    });
  });

  it("defaults SMTP to Gmail on port 465", () => {
    const env = parseEnv({ SMTP_USER: "u", SMTP_PASSWORD: "p", EMAIL_FROM: "SLIoT <u@example.com>" });
    expect(emailConfig(env)).toEqual({
      ok: true,
      config: { host: "smtp.gmail.com", port: 465, user: "u", password: "p", from: "SLIoT <u@example.com>" },
    });
    expect(emailConfig(parseEnv({ SMTP_USER: "u", SMTP_PASSWORD: "p", EMAIL_FROM: "f", SMTP_PORT: "abc" })).ok).toBe(false);
  });

  it("lists everything production is missing", () => {
    expect(missingProductionEnv(parseEnv({ NODE_ENV: "production" }))).toEqual([
      "DATABASE_PATH",
      "SITE_URL",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "EMAIL_FROM",
      "GOOGLE_OAUTH_CLIENT_ID",
      "GOOGLE_OAUTH_CLIENT_SECRET",
      "GOOGLE_OAUTH_REFRESH_TOKEN",
      "GOOGLE_DRIVE_FOLDER_ID",
    ]);
  });
});
