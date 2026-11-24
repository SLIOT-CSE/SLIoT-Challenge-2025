// Team codes: `SL27-` + 8 characters from the Crockford base-32 alphabet (no I, L, O, U),
// shown as `SL27-7KQ4-M9XD`. See docs/architecture.md, section 6.1.
//
// Uses the Web Crypto API, so the same code runs in the browser (sample store) and on
// the server (Node 20+).

export const CODE_PREFIX = "SL27";
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const BODY_LENGTH = 8;

const BODY_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${BODY_LENGTH}}$`);

/** `SL27-7KQ4-M9XD` from the 8-character body */
function compose(body: string): string {
  return `${CODE_PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** A fresh random code. `randomByte` is injectable for tests. */
export function generateTeamCode(randomByte: () => number = defaultRandomByte): string {
  let body = "";
  while (body.length < BODY_LENGTH) {
    // 32 divides 256, so masking the low five bits is unbiased
    body += CODE_ALPHABET[randomByte() & 31];
  }
  return compose(body);
}

function defaultRandomByte(): number {
  const bytes = new Uint8Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return bytes[0];
}

/** Crockford reading rules: O is 0, I and L are 1 */
function decodeLookalikes(s: string): string {
  return s.replace(/O/g, "0").replace(/[IL]/g, "1");
}

function clean(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** The canonical code for whatever the person typed or pasted, or null when it isn't a valid code */
export function normaliseTeamCode(raw: string): string | null {
  let s = clean(raw);
  if (s.startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length);
  s = decodeLookalikes(s);
  return BODY_PATTERN.test(s) ? compose(s) : null;
}

/**
 * Formats the 8-character part of a code as the person types, for the login field that
 * shows `SL27-` itself: `7kq4m9xd` becomes `7KQ4-M9XD`. A pasted full code loses its prefix.
 */
export function formatCodeInput(raw: string): string {
  let s = clean(raw);
  if (s.length > BODY_LENGTH && s.startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length);
  s = decodeLookalikes(s)
    .replace(new RegExp(`[^${CODE_ALPHABET}]`, "g"), "")
    .slice(0, BODY_LENGTH);
  return s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
}
