// Sample-only password "hash". The real backend uses argon2id (step V1); this exists so the
// sample store never holds a password in the clear, and a wrong password can be told apart.
// It is NOT secure: two FNV-1a passes, no real salt. Never use it outside the sample layer.

function fnv1a(text: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function sampleHash(password: string): string {
  const a = fnv1a(password, 0x811c9dc5).toString(16).padStart(8, "0");
  const b = fnv1a(password, 0x9747b28c).toString(16).padStart(8, "0");
  return `sample:${a}${b}`;
}

export const sampleHashMatches = (password: string, hash: string): boolean => sampleHash(password) === hash;
