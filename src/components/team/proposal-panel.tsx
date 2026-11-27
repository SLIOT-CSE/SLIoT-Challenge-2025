"use client";

import { useRef, useState, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, FileText, Lock, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkError, uploadProposal, type Submission } from "@/lib/data";
import { MAX_PROPOSAL_BYTES } from "@/lib/team-rules";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import { checkProposalFile, formatBytes, formatWhen, readHeader, type ProposalPanelState } from "./portal";

type Upload =
  | { kind: "idle" }
  | { kind: "uploading"; file: File; progress: number }
  | { kind: "error"; message: string; retryFile?: File }
  | { kind: "cancelled" }
  | { kind: "done"; version: number };

/** The proposal: where it stands, the drop zone (until it locks), and every earlier version */
export function ProposalPanel({ state, now }: { state: ProposalPanelState; now: number }) {
  const [upload, setUpload] = useState<Upload>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const busy = upload.kind === "uploading";

  async function start(file: File) {
    // Check everything we can before spending the person's data
    const check = checkProposalFile(file, await readHeader(file));
    if (!check.ok) return setUpload({ kind: "error", message: check.message });

    const abort = new AbortController();
    controller.current = abort;
    setUpload({ kind: "uploading", file, progress: 0 });
    try {
      const result = await uploadProposal(
        { file },
        {
          signal: abort.signal,
          onProgress: (progress) => setUpload((u) => (u.kind === "uploading" ? { ...u, progress } : u)),
        },
      );
      setUpload(result.ok ? { kind: "done", version: result.data.version } : { kind: "error", message: result.error.message });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return setUpload({ kind: "cancelled" });
      if (!(e instanceof NetworkError)) console.error(e);
      setUpload({
        kind: "error",
        message: "The upload didn't finish because the connection dropped. Nothing was saved, so your previous version is unchanged.",
        retryFile: file,
      });
    } finally {
      controller.current = null;
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files[0];
    if (file) void start(file);
  }

  return (
    <section aria-labelledby="proposal-title" className="flex flex-col gap-6 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="proposal-title" className="text-title font-semibold text-foam">
            Project proposal
          </h2>
          <p className="max-w-[48ch] text-small text-haze">
            One PDF, up to {formatBytes(MAX_PROPOSAL_BYTES)}. You can replace it until the deadline, and the newest
            version is the one judged.
          </p>
        </div>
        <Countdown dueAt={state.dueAt} now={now} />
      </div>

      {state.early && state.canUpload && (
        <p className="rounded-control bg-deep/60 p-4 text-small text-haze ring-1 ring-edge ring-inset">
          You don&apos;t have to wait: you can upload now and replace it any time before{" "}
          <strong className="font-semibold text-foam">{formatWhen(state.dueAt)}</strong>.
        </p>
      )}

      <CurrentFile current={state.current} />

      {state.lock && <LockedNote lock={state.lock} hasProposal={state.current !== null} />}

      {state.canUpload && (
        <div className="flex flex-col gap-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
            }}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-4 rounded-panel border-2 border-dashed px-5 py-8 text-center transition-colors duration-200 motion-reduce:transition-none",
              dragging ? "border-mint bg-mint/10" : "border-edge bg-deep/30",
              busy && "opacity-60",
            )}
          >
            <UploadCloud aria-hidden="true" className="size-10 text-mint" />
            <div className="flex flex-col gap-1">
              <p className="text-body font-semibold text-foam">
                {state.current ? "Drop a new PDF here to replace it" : "Drop your proposal PDF here"}
              </p>
              <p className="text-small text-haze">or choose it from your device</p>
            </div>
            <label
              className={cn(
                "inline-flex h-12 cursor-pointer items-center rounded-full bg-mint px-6 font-body text-body font-semibold text-abyss hover:bg-aqua has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint",
                busy && "pointer-events-none",
              )}
            >
              Choose PDF
              <input
                ref={input}
                type="file"
                accept="application/pdf,.pdf"
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void start(file);
                }}
              />
            </label>
          </div>

          <UploadStatus upload={upload} onAbort={() => controller.current?.abort()} onRetry={(file) => void start(file)} />
        </div>
      )}

      {state.history.length > 0 && <History versions={state.history} />}
    </section>
  );
}

function CurrentFile({ current }: { current: Submission | null }) {
  if (!current) {
    return (
      <p className="rounded-control bg-deep/40 p-4 text-small text-haze ring-1 ring-edge ring-inset">
        No proposal uploaded yet.
      </p>
    );
  }
  return (
    <div className="flex items-start gap-4 rounded-control bg-deep/60 p-4 ring-1 ring-mint/30 ring-inset">
      <FileText aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-mint" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="break-all font-semibold text-foam">{current.fileName}</span>
          <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-caption font-semibold text-mint ring-1 ring-mint/30 ring-inset">
            Current · version {current.version}
          </span>
        </p>
        <p className="text-small text-haze">
          {formatBytes(current.sizeBytes ?? 0)} · uploaded {formatWhen(current.submittedAt)}
        </p>
      </div>
    </div>
  );
}

function LockedNote({ lock, hasProposal }: { lock: "deadline" | "decided"; hasProposal: boolean }) {
  const text =
    lock === "deadline"
      ? hasProposal
        ? "The proposal deadline has passed. Your current version is the one that will be judged."
        : "The proposal deadline has passed, and no proposal was submitted."
      : "Proposals are closed for your team: it already has a shortlist result.";
  return (
    <p className="flex items-start gap-3 rounded-control bg-deep/60 p-4 text-small text-foam ring-1 ring-edge ring-inset">
      <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-haze" />
      {text}
    </p>
  );
}

function UploadStatus({
  upload,
  onAbort,
  onRetry,
}: {
  upload: Upload;
  onAbort: () => void;
  onRetry: (file: File) => void;
}) {
  if (upload.kind === "idle") return <p role="status" className="sr-only" />;

  if (upload.kind === "uploading") {
    const percent = Math.round(upload.progress * 100);
    return (
      <div className="flex flex-col gap-3 rounded-control bg-deep/60 p-4 ring-1 ring-edge ring-inset">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-small text-foam">
            Uploading <span className="break-all font-semibold">{upload.file.name}</span> ({formatBytes(upload.file.size)})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={onAbort}>
            <X aria-hidden="true" className="size-4" />
            Cancel
          </Button>
        </div>
        <div
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-night"
        >
          <div
            className="h-full rounded-full bg-mint transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-caption text-haze">{percent}%</p>
      </div>
    );
  }

  if (upload.kind === "done") {
    return (
      <p role="status" className="flex items-start gap-3 rounded-control bg-mint/10 p-4 text-small text-foam ring-1 ring-mint/30 ring-inset">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
        Proposal submitted (v{upload.version}). We&apos;ve emailed your team leader.
      </p>
    );
  }

  if (upload.kind === "cancelled") {
    return (
      <p role="status" className="rounded-control bg-deep/60 p-4 text-small text-haze ring-1 ring-edge ring-inset">
        Upload cancelled. Nothing changed: your previous version is still the current one.
      </p>
    );
  }

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-control bg-danger/10 p-4 ring-1 ring-danger/50 ring-inset">
      <p className="flex items-start gap-3 text-small text-foam">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
        {upload.message}
      </p>
      {upload.retryFile && (
        <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={() => onRetry(upload.retryFile!)}>
          Try again with {upload.retryFile.name}
        </Button>
      )}
    </div>
  );
}

function History({ versions }: { versions: Submission[] }) {
  return (
    <details className="group rounded-control ring-1 ring-edge ring-inset">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-control px-4 text-small font-semibold text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint">
        Earlier versions ({versions.length})
        <span aria-hidden="true" className="text-haze transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <ul className="flex flex-col divide-y divide-edge/60 border-t border-edge px-4">
        {versions.map((v) => (
          <li key={v.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-small">
            <span className="font-semibold text-foam">Version {v.version}</span>
            <span className="text-haze">
              {formatBytes(v.sizeBytes ?? 0)} · {formatWhen(v.submittedAt)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
