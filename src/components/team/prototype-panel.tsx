"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Heart, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NetworkError, submitPrototype, type Submission } from "@/lib/data";
import { parseYoutubeId } from "@/lib/schemas";
import { Countdown } from "./countdown";
import { formatWhen, youtubeThumbnail, type PrototypePanelState } from "./portal";

/** The prototype video: locked until shortlisted, then a YouTube link with a live preview */
export function PrototypePanel({ state, now }: { state: PrototypePanelState; now: number }) {
  return (
    <section aria-labelledby="prototype-title" className="flex flex-col gap-6 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="prototype-title" className="text-title font-semibold text-foam">
            Prototype video
          </h2>
          <p className="max-w-[48ch] text-small text-haze">
            Shortlisted teams show their working prototype in a short YouTube video. Public or unlisted both work.
          </p>
        </div>
        {(state.kind === "open" || state.kind === "closed") && <Countdown dueAt={state.dueAt} now={now} />}
      </div>

      {state.kind === "waiting" && (
        <Note icon={<Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-haze" />}>
          This opens if your team is shortlisted. The shortlist is announced on{" "}
          <strong className="font-semibold">{formatWhen(state.announcedAt)}</strong>, and we&apos;ll email your team
          leader.
        </Note>
      )}

      {state.kind === "not-shortlisted" && (
        // TODO(2027): placeholder wording, to be confirmed by the organizers
        <Note icon={<Heart aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />}>
          Thank you for taking part in the SLIoT Challenge. Your team wasn&apos;t shortlisted for the prototype round
          this time. The ideas were strong, and we hope to see you again next year.
        </Note>
      )}

      {state.kind === "finalist" && (
        <>
          <Note icon={<CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />}>
            Your prototype is final: finalists can&apos;t change their video.
          </Note>
          {state.current && <VideoCard video={state.current} />}
        </>
      )}

      {state.kind === "closed" && (
        <>
          <Note icon={<Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-haze" />}>
            {state.current
              ? "The prototype deadline has passed. Your current video is the one that will be judged."
              : "The prototype deadline has passed, and no prototype was submitted."}
          </Note>
          {state.current && <VideoCard video={state.current} />}
        </>
      )}

      {state.kind === "open" && <LinkForm current={state.current} />}
    </section>
  );
}

function LinkForm({ current }: { current: Submission | null }) {
  const [link, setLink] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<{ kind: "field" | "network"; text: string } | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const videoId = parseYoutubeId(link);
  const localError = touched && link.trim() && !videoId ? "Paste a YouTube link, like https://youtu.be/dQw4w9WgXcQ" : undefined;
  const fieldError = problem?.kind === "field" ? problem.text : localError;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!videoId) {
      setTouched(true);
      if (!link.trim()) setProblem({ kind: "field", text: "Paste the link to your prototype video." });
      return;
    }

    setSubmitting(true);
    setProblem(null);
    setDone(null);
    try {
      const result = await submitPrototype(link);
      if (result.ok) {
        setDone(result.data.version);
        setLink("");
        setTouched(false);
      } else {
        setProblem({ kind: "field", text: result.error.message });
      }
    } catch (e) {
      if (!(e instanceof NetworkError)) console.error(e);
      setProblem({ kind: "network", text: "We couldn't reach the server. Your link is still here, so you can try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {current && <VideoCard video={current} />}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field
          label={current ? "Replace your video link" : "YouTube link"}
          helper="Public or unlisted. Private videos can't be watched by the judges."
          error={fieldError}
          required
        >
          {(control) => (
            <Input
              {...control}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://youtu.be/…"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setProblem((p) => (p?.kind === "field" ? null : p));
                setDone(null);
              }}
              onBlur={() => setTouched(true)}
            />
          )}
        </Field>

        {videoId && <VideoPreview key={videoId} id={videoId} />}

        {problem?.kind === "network" && (
          <p role="alert" className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            {problem.text}
          </p>
        )}
        {done !== null && (
          <p role="status" className="flex items-start gap-3 rounded-control bg-mint/10 p-4 text-small text-foam ring-1 ring-mint/30 ring-inset">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
            Prototype submitted{done > 1 ? ` (v${done})` : ""}. We&apos;ve emailed your team leader.
          </p>
        )}

        <Button type="submit" size="lg" loading={submitting} className="w-fit">
          {submitting ? "Submitting…" : problem?.kind === "network" ? "Try again" : current ? "Replace prototype" : "Submit prototype"}
        </Button>
      </form>
    </div>
  );
}

/** The thumbnail of a valid link, so the team can see they pasted the right video */
function VideoPreview({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-control bg-deep/60 ring-1 ring-edge ring-inset">
        {failed ? (
          <div className="grid size-full place-items-center p-4 text-center text-small text-haze">
            No preview available. If the video is private or the ID is wrong, the judges won&apos;t be able to watch it.
          </div>
        ) : (
          <>
            <img
              src={youtubeThumbnail(id)}
              alt="Thumbnail of the video you pasted"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
            <PlayCircle aria-hidden="true" className="absolute top-1/2 left-1/2 size-12 -translate-1/2 text-foam drop-shadow" />
          </>
        )}
      </div>
      <figcaption className="text-caption text-haze">Preview. Check this is your prototype before you submit.</figcaption>
    </figure>
  );
}

function VideoCard({ video }: { video: Submission }) {
  return (
    <div className="flex flex-col gap-3 rounded-control bg-deep/60 p-4 ring-1 ring-mint/30 ring-inset sm:flex-row sm:items-center">
      {video.youtubeId && (
        <img
          src={youtubeThumbnail(video.youtubeId)}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="aspect-video w-full rounded-control object-cover sm:w-40"
        />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foam">Your prototype video</span>
          <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-caption font-semibold text-mint ring-1 ring-mint/30 ring-inset">
            Current · version {video.version}
          </span>
        </p>
        <p className="text-small text-haze">Submitted {formatWhen(video.submittedAt)}</p>
        {video.youtubeUrl && (
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 break-all text-small font-semibold text-mint hover:underline"
          >
            Watch on YouTube
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  );
}

function Note({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-control bg-deep/60 p-4 text-small text-foam ring-1 ring-edge ring-inset">
      {icon}
      <span>{children}</span>
    </p>
  );
}
