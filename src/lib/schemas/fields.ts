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
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, { error: min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters` })
    .max(max, { error: `${label} must be at most ${max} characters` });
}
