import { hash, verify } from "@node-rs/argon2";

// Organizer passwords: argon2id (docs/architecture.md, 6.5). The library's defaults are
// argon2id with OWASP-recommended cost, so no parameters are set here.

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** False for a wrong password and for a malformed hash, never throws */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * A real hash of a random password, checked when the username doesn't exist, so a missing
 * account takes as long to reject as a wrong password and usernames can't be found by timing.
 */
let decoy: Promise<string> | null = null;
export function decoyHash(): Promise<string> {
  decoy ??= hash(crypto.randomUUID());
  return decoy;
}
