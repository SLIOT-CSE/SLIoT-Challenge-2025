// Passwords the system generates for organizer accounts (docs/architecture.md, 6.5 and D15).
// 16 characters from an alphabet without look-alikes (no 0 O 1 l I), so a password read out
// over the phone or typed from a screen survives. About 93 bits.

export const PASSWORD_LENGTH = 16;
export const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** A cryptographically random byte. Replaceable in tests */
export type RandomByte = () => number;

const secureByte: RandomByte = () => crypto.getRandomValues(new Uint8Array(1))[0];

/** Generates a password. Rejects bytes that would bias the pick toward the start of the alphabet */
export function generatePassword(randomByte: RandomByte = secureByte): string {
  const n = PASSWORD_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < PASSWORD_LENGTH) {
    const b = randomByte();
    if (b < limit) out += PASSWORD_ALPHABET[b % n];
  }
  return out;
}
