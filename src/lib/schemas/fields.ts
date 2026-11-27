import { z } from "zod";
import { normaliseTeamCode } from "@/lib/team-code";

// Single-field rules, shared by the forms now and the backend later.

/** `07X XXX XXXX`, `+94 7X XXX XXXX` (spaces, dashes and brackets ignored) to `+947XXXXXXXX` */
export function normaliseWhatsapp(raw: string): string | null {
  const s = raw.replace(/[\s\-()]/g, "");
  const m = /^(?:\+94|0094|94|0)(7[0-8]\d{7})$/.exec(s);
  return m ? `+94${m[1]}` : null;
}

/** Old `123456789V` or new 12-digit NIC, upper-cased, or null when the format is wrong */
export function normaliseNic(raw: string): string | null {
  const s = raw.replace(/\s/g, "").toUpperCase();
  return /^\d{9}[VX]$/.test(s) || /^\d{12}$/.test(s) ? s : null;
}

export const whatsappSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const n = normaliseWhatsapp(value);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a Sri Lankan mobile number, like 077 123 4567" });
      return z.NEVER;
    }
    return n;
  });

export const nicSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const n = normaliseNic(value);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a valid NIC, like 123456789V or 200012345678" });
      return z.NEVER;
    }
    return n;
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

export const teamCodeSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const code = normaliseTeamCode(value);
    if (!code) {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a team code" });
      return z.NEVER;
    }
    return code;
  });

/** Names and free text: trimmed, with a length range */
export function text(label: string, min: number, max: number) {
  // Empty says "is required" (reported first); too short but not empty says how long it must be
  const required = z.string({ error: `${label} is required` }).trim().min(1, { error: `${label} is required` });
  const ranged =
    min > 1 ? required.min(min, { error: `${label} must be at least ${min} characters` }) : required;
  return ranged.max(max, { error: `${label} must be at most ${max} characters` });
}

/** A scheme or "www.", or a dot running straight into two or more letters, as in `bad.example` */
const LINK = /:\/\/|www\.|[\p{L}\p{N}-][.。](?=\p{L}{2})/iu;
/** Control characters and line or paragraph breaks. Not format characters: Sinhala needs the zero-width joiner */
const BREAKS = /[\p{Cc}\p{Zl}\p{Zp}]/u;

/** True when a mail app could turn part of the text into a link */
export function looksLikeLink(value: string): boolean {
  // Fold full-width look-alikes and drop invisible characters before looking
  return LINK.test(value.normalize("NFKC").replace(/\p{Cf}/gu, ""));
}

/** The one name that goes into emails, which anyone can type for any address: no links, one line */
export const teamNameSchema = text("Team name", 2, 60)
  .refine((value) => !BREAKS.test(value), { error: "Team name must be on one line" })
  .refine((value) => !looksLikeLink(value), {
    error: "Team name can't contain a link or web address. Put a space after any dot",
  });

