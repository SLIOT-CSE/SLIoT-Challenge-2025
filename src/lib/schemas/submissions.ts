import { z } from "zod";
import { MAX_PROPOSAL_BYTES } from "@/lib/team-rules";

// Proposal PDF and prototype video rules (docs/architecture.md, sections 6.3 and 6.4).

/** What the server knows about an uploaded proposal before it reaches Drive */
export const proposalFileSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .refine((n) => n.toLowerCase().endsWith(".pdf"), { error: "The proposal must be a PDF" }),
  sizeBytes: z
    .number()
    .int()
    .min(1, { error: "The file is empty" })
    .max(MAX_PROPOSAL_BYTES, { error: "The proposal must be 10 MB or smaller" }),
});

export type ProposalFileInput = z.input<typeof proposalFileSchema>;

/** True when the bytes start with `%PDF-` */
export function hasPdfHeader(bytes: Uint8Array): boolean {
  const magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return bytes.length >= magic.length && magic.every((b, i) => bytes[i] === b);
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** The 11-character video ID from a watch, youtu.be, shorts or embed link, or null */
export function parseYoutubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  let id: string | null | undefined = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (host === "youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (parts[0] === "shorts" || parts[0] === "embed") id = parts[1];
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export const prototypeLinkSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const id = parseYoutubeId(value);
    if (!id) {
      ctx.addIssue({ code: "custom", message: "Paste a YouTube link to your prototype video" });
      return z.NEVER;
    }
    return { youtubeId: id, youtubeUrl: youtubeWatchUrl(id) };
  });

export type PrototypeLink = z.output<typeof prototypeLinkSchema>;
