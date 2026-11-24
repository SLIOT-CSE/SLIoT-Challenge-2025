import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import { stageAt } from "@/lib/competition";
import type { CompetitionState, Submission, TeamDetail } from "@/lib/data";
import { sampleTimeForStage } from "@/lib/data/clock";
import { TEAM_STAGES, type TeamStage } from "@/lib/team-rules";
import {
  checkProposalFile,
  countdownParts,
  countdownTone,
  formatBytes,
  formatCountdown,
  formatWait,
  formatWhen,
  proposalPanel,
  prototypePanel,
  trackerFor,
  youtubeThumbnail,
} from "./portal";

const submission = (over: Partial<Submission>): Submission => ({
  id: 1,
  teamId: 1,
  kind: "proposal",
  version: 1,
  isCurrent: true,
  submittedAt: 0,
  fileName: "x.pdf",
  sizeBytes: 1000,
  driveUrl: null,
  youtubeId: null,
  youtubeUrl: null,
  ...over,
});

function team(stage: TeamStage, submissions: Submission[] = []): TeamDetail {
  const current = (kind: Submission["kind"]) => submissions.find((s) => s.kind === kind && s.isCurrent) ?? null;
  return {
    id: 1,
    code: "SL27-AAAA-BBBB",
    name: "T",
    category: "school",
    institutionName: "X",
    institutionIsOther: false,
    stage,
    shortlistMark: false,
    shortlistEmailedAt: null,
    finalistEmailedAt: null,
    createdAt: 0,
    updatedAt: 0,
    members: [],
    proposal: current("proposal"),
    prototype: current("prototype"),
    submissions,
  };
}

const at = (name: Parameters<typeof sampleTimeForStage>[0]): CompetitionState => {
  const now = sampleTimeForStage(name, deadlines);
  return { now, stage: stageAt(new Date(now), deadlines), shortlistState: "finalised", deadlines };
};

describe("trackerFor", () => {
  const statuses = (stage: TeamStage) => trackerFor(stage).map((s) => s.status);

  it("lights each stage and marks earlier ones done", () => {
    expect(statuses("registered")).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
    expect(statuses("proposal_submitted")).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
    expect(statuses("shortlisted")).toEqual(["done", "done", "current", "upcoming", "upcoming"]);
    expect(statuses("prototype_submitted")).toEqual(["done", "done", "done", "current", "upcoming"]);
    expect(statuses("finalist")).toEqual(["done", "done", "done", "done", "current"]);
  });

  it("stops a not-shortlisted team at Shortlist and says so", () => {
    expect(statuses("not_shortlisted")).toEqual(["done", "done", "stopped", "off", "off"]);
    expect(trackerFor("not_shortlisted")[2].label).toBe("Not shortlisted");
    expect(trackerFor("shortlisted")[2].label).toBe("Shortlist");
  });

  it("has one current or stopped step for every team stage", () => {
    for (const stage of TEAM_STAGES) {
      expect(trackerFor(stage).filter((s) => s.status === "current" || s.status === "stopped")).toHaveLength(1);
    }
  });
});

describe("proposalPanel", () => {
  it("allows uploads during registration, and says it is early", () => {
    const p = proposalPanel(team("registered"), at("registration"));
    expect(p).toMatchObject({ canUpload: true, lock: null, early: true });
  });

  it("allows uploads and replacements during the proposal round", () => {
    const old = submission({ id: 1, version: 1, isCurrent: false });
    const now = submission({ id: 2, version: 2 });
    const p = proposalPanel(team("proposal_submitted", [now, old]), at("proposal"));
    expect(p).toMatchObject({ canUpload: true, lock: null, early: false });
    expect(p.current?.version).toBe(2);
    expect(p.history.map((s) => s.version)).toEqual([1]);
  });

  it("locks after the deadline, keeping the file visible", () => {
    const sub = submission({ version: 3 });
    const p = proposalPanel(team("proposal_submitted", [sub]), at("shortlisting"));
    expect(p).toMatchObject({ canUpload: false, lock: "deadline" });
    expect(p.current).toBe(sub);
  });

  it("locks once a shortlist result exists, even before the deadline (sample clocks can disagree)", () => {
    expect(proposalPanel(team("shortlisted"), at("proposal"))).toMatchObject({ canUpload: false, lock: "decided" });
    expect(proposalPanel(team("not_shortlisted"), at("proposal"))).toMatchObject({ lock: "decided" });
  });

  it("is a deadline lock, not a decided lock, when both apply", () => {
    expect(proposalPanel(team("finalist"), at("finale")).lock).toBe("deadline");
  });
});

describe("prototypePanel", () => {
  const proto = submission({ kind: "prototype", youtubeId: "dQw4w9WgXcQ", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });

  it("waits for the shortlist, naming the date", () => {
    for (const stage of ["registered", "proposal_submitted"] as const) {
      expect(prototypePanel(team(stage), at("shortlisting"))).toEqual({
        kind: "waiting",
        announcedAt: deadlines.shortlistAnnounced,
      });
    }
  });

  it("gives a not-shortlisted team a message, not a panel", () => {
    expect(prototypePanel(team("not_shortlisted"), at("prototype"))).toEqual({ kind: "not-shortlisted" });
  });

  it("opens the link field for shortlisted teams until the deadline", () => {
    expect(prototypePanel(team("shortlisted"), at("prototype"))).toMatchObject({ kind: "open", current: null });
    expect(prototypePanel(team("prototype_submitted", [proto]), at("prototype"))).toMatchObject({
      kind: "open",
      current: proto,
    });
  });

  it("closes after the prototype deadline", () => {
    expect(prototypePanel(team("shortlisted"), at("finale"))).toMatchObject({ kind: "closed", current: null });
    expect(prototypePanel(team("prototype_submitted", [proto]), at("over"))).toMatchObject({ kind: "closed" });
  });

  it("shows a finalist's prototype read-only", () => {
    expect(prototypePanel(team("finalist", [proto]), at("prototype"))).toEqual({ kind: "finalist", current: proto });
  });
});

describe("countdown", () => {
  const H = 3600 * 1000;
  const D = 24 * H;

  it("splits time into parts", () => {
    expect(countdownParts(2 * D + 3 * H + 4 * 60_000 + 5000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      done: false,
    });
    expect(countdownParts(0).done).toBe(true);
    expect(countdownParts(-5000).done).toBe(true);
  });

  it.each([
    [12 * D + 4 * H + 30_000, "12 days 4 hours"],
    [1 * D, "1 day 0 hours"],
    [3 * H + 20 * 60_000, "3 hours 20 minutes"],
    [1 * H + 1 * 60_000, "1 hour 1 minute"],
    [4 * 60_000 + 10_000, "4 minutes 10 seconds"],
    [30_000, "0 minutes 30 seconds"],
    [0, "Deadline passed"],
  ])("formats %d ms as %s", (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });

  it("gets more urgent as the deadline nears", () => {
    expect(countdownTone(10 * D)).toBe("calm");
    expect(countdownTone(2 * D)).toBe("soon");
    expect(countdownTone(5 * H)).toBe("urgent");
    expect(countdownTone(0)).toBe("over");
  });
});

describe("formatting", () => {
  it("formats times in Sri Lanka time", () => {
    expect(formatWhen("2027-03-15T23:59:00+05:30")).toBe("15 March, 11:59 pm");
    expect(formatWhen(Date.parse("2027-03-15T23:59:00+05:30"))).toBe("15 March, 11:59 pm");
  });

  it("formats sizes and waits", () => {
    expect(formatBytes(100)).toBe("1 KB");
    expect(formatBytes(850 * 1024)).toBe("850 KB");
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(formatWait(900)).toBe("15 minutes");
    expect(formatWait(61)).toBe("2 minutes");
    expect(formatWait(60)).toBe("1 minute");
    expect(formatWait(40)).toBe("40 seconds");
    expect(formatWait(0.2)).toBe("1 second");
  });

  it("builds the thumbnail address", () => {
    expect(youtubeThumbnail("dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });
});

describe("checkProposalFile", () => {
  const header = (text: string) => new TextEncoder().encode(text);

  it("accepts a real PDF", () => {
    expect(checkProposalFile({ name: "Plan.PDF", size: 2_000_000 }, header("%PDF-1.7"))).toEqual({ ok: true });
    expect(checkProposalFile({ name: "plan.pdf", size: 2_000_000 })).toEqual({ ok: true });
  });

  it("says why each wrong file is wrong", () => {
    const message = (file: { name: string; size: number }, h?: Uint8Array) => {
      const r = checkProposalFile(file, h);
      return r.ok ? null : r.message;
    };
    expect(message({ name: "plan.docx", size: 1000 })).toMatch(/Only PDF/);
    expect(message({ name: "plan.pdf", size: 0 })).toMatch(/empty/);
    expect(message({ name: "plan.pdf", size: 12 * 1024 * 1024 })).toBe("That file is 12.0 MB. The limit is 10.0 MB.");
    expect(message({ name: "plan.pdf", size: 1000 }, header("PK\u0003\u0004"))).toMatch(/isn't a real PDF/);
  });

  it("accepts exactly 10 MB", () => {
    expect(checkProposalFile({ name: "plan.pdf", size: 10 * 1024 * 1024 }).ok).toBe(true);
  });
});
