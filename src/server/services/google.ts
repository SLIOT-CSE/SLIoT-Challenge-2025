import { createSign } from "node:crypto";
import fs from "node:fs";
import type { DriveFile, DriveUploader, SheetsExporter } from "../backend/context";
import type { DriveConfig, SheetsConfig } from "../env";

// Google Drive (proposal uploads) and Sheets (the master export) over plain HTTPS, without
// the googleapis SDK.
//
// Drive: OAuth as sliot@cse.mrt.ac.lk with a stored refresh token (workload R3, option B),
// because a service account has no storage of its own and can't own files in My Drive.
// Sheets: the service account's JSON key; the Sheet is shared with it as an editor.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const FOLDER_MIME = "application/vnd.google-apps.folder";

type Fetch = typeof fetch;

interface CachedToken {
  token: string;
  expiresAt: number;
}

async function expectOk(response: Response, what: string): Promise<Response> {
  if (response.ok) return response;
  const body = await response.text().catch(() => "");
  throw new Error(`${what} failed: ${response.status} ${body.slice(0, 300)}`);
}

/** An access token, refreshed a minute before it runs out */
function tokenCache(fetchToken: () => Promise<{ access_token: string; expires_in: number }>) {
  let cached: CachedToken | null = null;
  return async () => {
    if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;
    const fresh = await fetchToken();
    cached = { token: fresh.access_token, expiresAt: Date.now() + fresh.expires_in * 1000 };
    return cached.token;
  };
}

// ---- Drive ----

/** Uploads proposals into `<folder>/<Category>/`, creating the category folders on first use */
export function createDriveUploader(config: DriveConfig, fetcher: Fetch = fetch): DriveUploader {
  const accessToken = tokenCache(async () => {
    const response = await fetcher(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    return (await expectOk(response, "Google OAuth token refresh")).json();
  });

  const folders = new Map<string, Promise<string>>();

  async function categoryFolder(category: string): Promise<string> {
    const name = category.charAt(0).toUpperCase() + category.slice(1);
    if (!folders.has(name)) {
      const lookup = (async () => {
        const auth = { Authorization: `Bearer ${await accessToken()}` };
        const q = `'${config.folderId}' in parents and name = '${name}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
        const found = await expectOk(
          await fetcher(`${DRIVE_FILES}?${new URLSearchParams({ q, fields: "files(id)", pageSize: "1" })}`, { headers: auth }),
          "Drive folder lookup",
        );
        const existing = ((await found.json()) as { files: { id: string }[] }).files[0];
        if (existing) return existing.id;
        const created = await expectOk(
          await fetcher(`${DRIVE_FILES}?fields=id`, {
            method: "POST",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [config.folderId] }),
          }),
          "Drive folder create",
        );
        return ((await created.json()) as { id: string }).id;
      })();
      // A failed lookup is retried next time instead of being cached
      lookup.catch(() => folders.delete(name));
      folders.set(name, lookup);
    }
    return folders.get(name)!;
  }

  return {
    async upload({ fileName, category, bytes }): Promise<DriveFile> {
      const parent = await categoryFolder(category);
      const boundary = `sliot${crypto.randomUUID().replaceAll("-", "")}`;
      const metadata = JSON.stringify({ name: fileName, parents: [parent], mimeType: "application/pdf" });
      const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
        `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
        bytes as Uint8Array<ArrayBuffer>,
        `\r\n--${boundary}--\r\n`,
      ]);
      const response = await expectOk(
        await fetcher(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,webViewLink`, {
          method: "POST",
          headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": `multipart/related; boundary=${boundary}` },
          body,
        }),
        "Drive upload",
      );
      const file = (await response.json()) as { id: string; webViewLink?: string };
      return { fileId: file.id, url: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view` };
    },
  };
}

// ---- Sheets ----

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

/** A signed JWT exchanged for an access token (Google's service-account flow) */
function serviceAccountToken(key: ServiceAccountKey, scope: string, fetcher: Fetch) {
  return tokenCache(async () => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = base64url(
      JSON.stringify({ iss: key.client_email, scope, aud: TOKEN_URL, iat: issuedAt, exp: issuedAt + 3600 }),
    );
    const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key);
    const response = await fetcher(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${header}.${claims}.${base64url(signature)}`,
      }),
    });
    return (await expectOk(response, "Google service account token")).json();
  });
}

export const TEAMS_TAB = "Teams";

/** Clears and rewrites the Teams tab; other tabs (notes, scores) are never touched */
export function createSheetsExporter(config: SheetsConfig, fetcher: Fetch = fetch): SheetsExporter {
  let token: (() => Promise<string>) | null = null;
  const accessToken = () => {
    token ??= serviceAccountToken(
      JSON.parse(fs.readFileSync(config.keyFile, "utf8")) as ServiceAccountKey,
      "https://www.googleapis.com/auth/spreadsheets",
      fetcher,
    );
    return token();
  };
  const sheet = `${SHEETS}/${encodeURIComponent(config.sheetId)}`;

  return {
    async replaceTeamsTab(rows: string[][]): Promise<void> {
      const auth = { Authorization: `Bearer ${await accessToken()}` };
      const json = { ...auth, "Content-Type": "application/json" };

      const info = await expectOk(await fetcher(`${sheet}?fields=sheets.properties.title`, { headers: auth }), "Sheets read");
      const titles = ((await info.json()) as { sheets: { properties: { title: string } }[] }).sheets.map((s) => s.properties.title);
      if (!titles.includes(TEAMS_TAB)) {
        await expectOk(
          await fetcher(`${sheet}:batchUpdate`, {
            method: "POST",
            headers: json,
            body: JSON.stringify({ requests: [{ addSheet: { properties: { title: TEAMS_TAB } } }] }),
          }),
          "Sheets add tab",
        );
      }
      await expectOk(
        await fetcher(`${sheet}/values/${TEAMS_TAB}:clear`, { method: "POST", headers: json, body: "{}" }),
        "Sheets clear",
      );
      // RAW: cells are stored as typed, so a name starting with = is text, never a formula
      await expectOk(
        await fetcher(`${sheet}/values/${TEAMS_TAB}!A1?valueInputOption=RAW`, {
          method: "PUT",
          headers: json,
          body: JSON.stringify({ values: rows }),
        }),
        "Sheets write",
      );
    },
  };
}
