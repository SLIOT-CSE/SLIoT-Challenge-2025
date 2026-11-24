import { NextResponse } from "next/server";
import type { Result } from "@/lib/data/types";
import { MAX_PROPOSAL_BYTES } from "@/lib/team-rules";
import { isSameOrigin } from "@/server/origin";
import { requestBackend } from "@/server/request";

// POST /api/team/proposal: the proposal PDF upload (docs/architecture.md, 6.3). A route
// handler rather than a server action, whose 1 MB body limit is too small for a 10 MB PDF.
// nginx limits the body to 12 MB on this path (deploy/nginx.conf.example).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The PDF plus multipart overhead */
const MAX_BODY_BYTES = MAX_PROPOSAL_BYTES + 512 * 1024;

const reply = (result: Result<unknown>, status = 200) => NextResponse.json(result, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return reply({ ok: false, error: { code: "forbidden", message: "This upload must come from the SLIoT site." } }, 403);
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    return reply({ ok: false, error: { code: "invalid_input", message: "The proposal must be 10 MB or smaller" } }, 413);
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return reply({ ok: false, error: { code: "invalid_input", message: "The upload didn't arrive in one piece. Please try again." } }, 400);
  }
  if (!(file instanceof File)) {
    return reply({ ok: false, error: { code: "invalid_input", message: "Choose a PDF to upload." } }, 400);
  }
  if (file.size > MAX_PROPOSAL_BYTES) {
    return reply({ ok: false, error: { code: "invalid_input", message: "The proposal must be 10 MB or smaller" } }, 413);
  }

  const backend = await requestBackend();
  const result = await backend.uploadProposal({ fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  return reply(result);
}
