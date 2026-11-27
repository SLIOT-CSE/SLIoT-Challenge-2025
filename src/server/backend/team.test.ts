import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { normaliseTeamCode } from "@/lib/team-code";
import type { Db } from "../db/client";
import * as schema from "../db/schema";
import { SETTING_KEYS, writeSetting } from "../settings";
import { PDF, browser, fakeServices, seededDb, setStage, teamByName, type FakeServices } from "./test-context";

let db: Db;
let fake: FakeServices;

beforeEach(async () => {
  db = await seededDb();
  fake = fakeServices();
});

const newTeam = (over: Record<string, unknown> = {}) => ({
  name: "Brand New Team",
  category: "school",
  institutionName: "Some School, Colombo",
  members: [
    { fullName: "Aruni Silva", whatsapp: "077 555 0101", email: "aruni@new.example.lk" },
    { fullName: "Dev Perera", whatsapp: "077 555 0102", email: "dev@new.example.lk" },
  ],
  ...over,
});

const outboxFor = (teamId: number) =>
  db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.teamId, teamId)).all();

describe("competition state", () => {
  it("is the prototype round in the seeded database, and follows the clock", async () => {
    const b = browser(db, fake);
    expect((await b.getCompetitionState()).stage).toBe("prototype");
    expect((await b.getCompetitionState()).shortlistState).toBe("finalised");
    setStage(db, "registration");
    expect((await b.getCompetitionState()).stage).toBe("registration");
  });
});

describe("registerTeam", () => {
  beforeEach(() => setStage(db, "registration"));

  it("saves the team and members, queues the confirmation email and audits it", async () => {
    const b = browser(db, fake);
    const r = await b.registerTeam(newTeam(), { turnstileToken: "ok" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(normaliseTeamCode(r.data.code)).toBe(r.data.code);

    const team = db.select().from(schema.teams).where(eq(schema.teams.id, r.data.teamId)).get()!;
    expect(team).toMatchObject({ stage: "registered", category: "school", institutionName: "Some School, Colombo" });
    const members = db.select().from(schema.members).where(eq(schema.members.teamId, team.id)).all();
    expect(members.map((m) => [m.position, m.whatsapp, m.institutionName])).toEqual([
      [1, "+94775550101", "Some School, Colombo"],
      [2, "+94775550102", "Some School, Colombo"],
    ]);
    expect(outboxFor(team.id)).toMatchObject([
      { template: "registration_confirmed", toEmail: "aruni@new.example.lk", status: "pending", props: { code: r.data.code } },
    ]);
    const audit = db.select().from(schema.auditLog).where(eq(schema.auditLog.targetId, String(team.id))).all();
    expect(audit.map((a) => [a.action, a.ip])).toEqual([["team.registered", "10.0.0.1"]]);
  });

  it("is refused outside the registration window", async () => {
    const b = browser(db, fake);
    setStage(db, "before-registration");
    expect(await b.registerTeam(newTeam())).toMatchObject({ ok: false, error: { code: "registration_not_open" } });
    setStage(db, "proposal");
    expect(await b.registerTeam(newTeam())).toMatchObject({ ok: false, error: { code: "registration_closed" } });
  });

  it("names the member whose email or NIC is already in another team", async () => {
    const b = browser(db, fake);
    const existing = db.select().from(schema.members).where(eq(schema.members.position, 1)).get()!;
    const r = await b.registerTeam(
      newTeam({ members: [newTeam().members[0], { fullName: "Copy Cat", whatsapp: "077 555 0109", email: existing.email }] }),
    );
    expect(r).toMatchObject({ ok: false, error: { code: "duplicate_member", conflicts: [{ field: "email", memberPosition: 2 }] } });
  });

  it("returns field issues for bad input, and refuses a failed bot check or a filled honeypot", async () => {
    const b = browser(db, fake);
    const bad = await b.registerTeam(newTeam({ members: [{ fullName: "A", whatsapp: "123", email: "nope" }] }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.issues?.map((i) => i.path)).toEqual(expect.arrayContaining(["members.0.whatsapp", "members.0.email"]));
    expect(await b.registerTeam(newTeam(), { turnstileToken: "bad-token" })).toMatchObject({ ok: false });
    expect(await b.registerTeam(newTeam(), { honeypot: "http://spam" })).toMatchObject({ ok: false });
    expect(db.select().from(schema.teams).all()).toHaveLength(20);
  });

  it("limits registrations per IP to 20 an hour", async () => {
    const b = browser(db, fake, "10.9.9.9");
    for (let i = 0; i < 20; i++) {
      const r = await b.registerTeam(
        newTeam({ name: `Team ${i}`, members: [{ fullName: "Lab Student", whatsapp: "077 555 0101", email: `s${i}@lab.example.lk` }] }),
      );
      expect(r.ok).toBe(true);
    }
    const r = await b.registerTeam(newTeam());
    expect(r).toMatchObject({ ok: false, error: { code: "rate_limited" } });
    // Another address is unaffected
    expect((await browser(db, fake, "10.9.9.8").registerTeam(newTeam())).ok).toBe(true);
  });
});

describe("team login", () => {
  it("logs in with the code (any spacing or case), sets the cookie and shows the team", async () => {
    const b = browser(db, fake);
    const team = teamByName(db, "Coral Code");
    const r = await b.loginWithCode(` ${team.code.toLowerCase().replaceAll("-", " ")} `);
    expect(r).toEqual({ ok: true, data: { teamId: team.id } });
    expect(b.jar.get("sliot_team")).toBeTruthy();
    const session = db.select().from(schema.sessions).get()!;
    // Only the hash is stored
    expect(session.id).not.toBe(b.jar.get("sliot_team"));
    expect(session.expiresAt - session.createdAt).toBe(7 * 24 * 3600 * 1000);

    const current = await b.getCurrentTeam();
    expect(current?.name).toBe("Coral Code");
    expect(current?.proposal?.version).toBe(2);
    expect(current?.submissions.map((s) => s.version)).toEqual([2, 1]);

    await b.logout();
    expect(await b.getCurrentTeam()).toBeNull();
    expect(db.select().from(schema.sessions).all()).toHaveLength(0);
  });

  it("blocks an IP after 5 wrong codes in 15 minutes", async () => {
    const b = browser(db, fake);
    for (let i = 0; i < 5; i++) expect(await b.loginWithCode("SL27-0000-0000")).toMatchObject({ error: { code: "invalid_code" } });
    const blocked = await b.loginWithCode(teamByName(db, "Coral Code").code);
    expect(blocked).toMatchObject({ ok: false, error: { code: "rate_limited" } });
    if (!blocked.ok) expect(blocked.error.retryAfterSeconds).toBeGreaterThan(0);
    expect((await browser(db, fake, "10.0.0.2").loginWithCode(teamByName(db, "Coral Code").code)).ok).toBe(true);
  });

  it("never shows draft shortlist ticks to the team", async () => {
    writeSetting(db, SETTING_KEYS.shortlistState, "draft", null, 0);
    db.update(schema.teams).set({ shortlistMark: true }).where(eq(schema.teams.name, "Green Pulse")).run();
    const b = browser(db, fake);
    await b.loginWithCode(teamByName(db, "Green Pulse").code);
    expect((await b.getCurrentTeam())?.shortlistMark).toBe(false);
  });
});

describe("requestCodeReminder", () => {
  it("emails the code to a leader, and gives the same reply for an unknown email", async () => {
    const b = browser(db, fake);
    const team = teamByName(db, "Kite Runners");
    const leader = db.select().from(schema.members).where(and(eq(schema.members.teamId, team.id), eq(schema.members.position, 1))).get()!;
    expect(await b.requestCodeReminder(leader.email.toUpperCase())).toEqual({ ok: true, data: null });
    expect(await b.requestCodeReminder("nobody@example.lk")).toEqual({ ok: true, data: null });
    const reminders = db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.template, "code_reminder")).all();
    expect(reminders.filter((e) => e.status === "pending")).toMatchObject([{ toEmail: leader.email, props: { code: team.code } }]);
  });
});

describe("requestCodeReminder cooldown", () => {
  it("sends one email per team in five minutes, even from different addresses", async () => {
    const team = teamByName(db, "Kite Runners");
    const leader = db.select().from(schema.members).where(and(eq(schema.members.teamId, team.id), eq(schema.members.position, 1))).get()!;
    const queued = () => outboxFor(team.id).filter((e) => e.template === "code_reminder" && e.status === "pending").length;

    const start = Date.now();
    const first = browser(db, fake, "10.0.0.1");
    const second = browser(db, fake, "10.0.0.2");
    first.ctx.appClock = () => start;
    await first.requestCodeReminder(leader.email);
    second.ctx.appClock = () => start + 4 * 60 * 1000;
    expect(await second.requestCodeReminder(leader.email)).toEqual({ ok: true, data: null });
    expect(queued()).toBe(1);

    second.ctx.appClock = () => start + 6 * 60 * 1000;
    await second.requestCodeReminder(leader.email);
    expect(queued()).toBe(2);
  });
});

describe("team portal lock", () => {
  it("refuses login and uploads until proposal submissions open", async () => {
    setStage(db, "registration");
    const b = browser(db, fake);
    const r = await b.registerTeam(newTeam());
    if (!r.ok) throw new Error("registration failed");
    const closed = { ok: false, error: { code: "portal_not_open" } };

    expect(await b.loginWithCode(r.data.code)).toMatchObject(closed);
    expect(await b.uploadProposal({ fileName: "ours.pdf", bytes: PDF })).toMatchObject(closed);
    expect(await b.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject(closed);
    expect(fake.uploads).toHaveLength(0);

    setStage(db, "proposal");
    expect((await b.loginWithCode(r.data.code)).ok).toBe(true);
    // A session left over from an open portal doesn't get in while it's locked
    setStage(db, "registration");
    expect(await b.getCurrentTeam()).toBeNull();
    expect(await b.uploadProposal({ fileName: "ours.pdf", bytes: PDF })).toMatchObject(closed);
  });
});

describe("uploadProposal", () => {
  async function loggedInRegisteredTeam() {
    setStage(db, "registration");
    const b = browser(db, fake);
    const r = await b.registerTeam(newTeam());
    if (!r.ok) throw new Error("registration failed");
    setStage(db, "proposal");
    await b.loginWithCode(r.data.code);
    return b;
  }

  it("uploads to Drive, saves a new version, moves the stage and emails the leader", async () => {
    const b = await loggedInRegisteredTeam();
    const first = await b.uploadProposal({ fileName: "ours.pdf", bytes: PDF });
    expect(first).toEqual({ ok: true, data: { version: 1 } });
    const second = await b.uploadProposal({ fileName: "ours-v2.pdf", bytes: PDF });
    expect(second).toEqual({ ok: true, data: { version: 2 } });

    const team = await b.getCurrentTeam();
    expect(team?.stage).toBe("proposal_submitted");
    expect(team?.proposal).toMatchObject({ version: 2, isCurrent: true, driveUrl: "https://drive.google.com/file/d/file-2/view" });
    expect(team?.submissions.filter((s) => s.isCurrent)).toHaveLength(1);
    expect(fake.uploads[0]).toMatchObject({ category: "school", size: PDF.byteLength });
    expect(fake.uploads[1].fileName).toMatch(/^SL27-.* – Brand New Team – v2\.pdf$/);
    const row = db.select().from(schema.submissions).where(eq(schema.submissions.driveFileId, "file-2")).get()!;
    expect(row.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(outboxFor(team!.id).filter((e) => e.template === "proposal_received")).toHaveLength(2);
  });

  it("fails clearly while Drive isn't set up, and saves nothing", async () => {
    const b = await loggedInRegisteredTeam();
    fake.drive = null;
    expect(await b.uploadProposal({ fileName: "ours.pdf", bytes: PDF })).toMatchObject({ ok: false, error: { code: "not_configured" } });
    expect((await b.getCurrentTeam())?.submissions).toHaveLength(0);
  });

  it("rejects a file that isn't a PDF, one that's too big, and uploads after the deadline", async () => {
    const b = await loggedInRegisteredTeam();
    const notPdf = await b.uploadProposal({ fileName: "ours.pdf", bytes: new TextEncoder().encode("hello world") });
    expect(notPdf).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    const big = await b.uploadProposal({ fileName: "ours.pdf", bytes: new Uint8Array(10 * 1024 * 1024 + 1) });
    expect(big).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    setStage(db, "shortlisting");
    expect(await b.uploadProposal({ fileName: "ours.pdf", bytes: PDF })).toMatchObject({ ok: false, error: { code: "proposal_deadline_passed" } });
    expect(fake.uploads).toHaveLength(0);
  });

  it("needs a logged-in team that hasn't had its shortlist decision", async () => {
    expect(await browser(db, fake).uploadProposal({ fileName: "a.pdf", bytes: PDF })).toMatchObject({ error: { code: "not_logged_in" } });
    const b = browser(db, fake);
    await b.loginWithCode(teamByName(db, "Green Pulse").code);
    expect(await b.uploadProposal({ fileName: "a.pdf", bytes: PDF })).toMatchObject({ error: { code: "not_allowed" } });
  });
});

describe("submitPrototype", () => {
  it("saves a shortlisted team's YouTube link as a new version and emails the leader", async () => {
    const b = browser(db, fake);
    const team = teamByName(db, "Lanka Sensors");
    await b.loginWithCode(team.code);
    const r = await b.submitPrototype("https://youtu.be/dQw4w9WgXcQ");
    expect(r).toEqual({ ok: true, data: { version: 1, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
    const again = await b.submitPrototype("https://www.youtube.com/shorts/aqz-KE-bpKQ");
    expect(again).toMatchObject({ ok: true, data: { version: 2 } });
    expect((await b.getCurrentTeam())?.stage).toBe("prototype_submitted");
    expect(outboxFor(team.id).filter((e) => e.template === "prototype_received")).toHaveLength(2);
  });

  it("refuses teams that weren't shortlisted, private videos and late links", async () => {
    const b = browser(db, fake);
    await b.loginWithCode(teamByName(db, "Green Pulse").code);
    expect(await b.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ error: { code: "not_allowed" } });

    const s = browser(db, fake, "10.0.0.3");
    await s.loginWithCode(teamByName(db, "Lanka Sensors").code);
    fake.videoExists = false;
    expect(await s.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ error: { code: "video_unavailable" } });
    expect(await s.submitPrototype("not a link")).toMatchObject({ error: { code: "invalid_input" } });
    fake.videoExists = true;
    setStage(db, "finale");
    expect(await s.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ error: { code: "prototype_deadline_passed" } });
  });
});
