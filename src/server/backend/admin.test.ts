import { eq, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { PASSWORD_LENGTH } from "@/lib/admin-password";
import type { TeamEditInput, TeamRow } from "@/lib/data/types";
import type { Db } from "../db/client";
import * as schema from "../db/schema";
import { SETTING_KEYS, writeSetting } from "../settings";
import { ADMIN1, SUPER, browser, fakeServices, seededDb, teamByName, type FakeServices } from "./test-context";

let db: Db;
let fake: FakeServices;

beforeEach(async () => {
  db = await seededDb();
  fake = fakeServices();
});

async function signedIn(login: { username: string; password: string }, ip = "10.1.0.1") {
  const b = browser(db, fake, ip);
  const r = await b.adminLogin(login.username, login.password);
  if (!r.ok) throw new Error(`login failed: ${r.error.code}`);
  return b;
}

function editFrom(team: TeamRow, over: Partial<TeamEditInput> = {}): TeamEditInput {
  return {
    name: team.name,
    institutionName: team.institutionName ?? undefined,
    institutionIsOther: team.institutionIsOther,
    members: team.members.map((m) => ({
      fullName: m.fullName,
      whatsapp: m.whatsapp,
      email: m.email,
      nic: m.nic ?? undefined,
      institutionType: m.institutionType,
      institutionName: m.institutionName ?? undefined,
      institutionIsOther: m.institutionIsOther,
    })),
    ...over,
  };
}

/** Puts the database back before the shortlist was finalised: draft, no prototypes */
function backToDraft() {
  db.delete(schema.submissions).where(eq(schema.submissions.kind, "prototype")).run();
  db.update(schema.teams).set({ stage: "shortlisted" }).where(eq(schema.teams.stage, "prototype_submitted")).run();
  writeSetting(db, SETTING_KEYS.shortlistState, "draft", null, 0);
}

describe("admin sign in", () => {
  it("checks the argon2 password, sets a 12-hour session and records the login", async () => {
    const b = browser(db, fake);
    const r = await b.adminLogin(" SUPER ", SUPER.password);
    expect(r).toMatchObject({ ok: true, data: { admin: { username: "super", role: "super_admin" } } });
    expect(b.jar.get("sliot_admin")).toBeTruthy();
    const session = db.select().from(schema.sessions).get()!;
    expect(session.expiresAt - session.createdAt).toBe(12 * 3600 * 1000);
    expect((await b.getCurrentAdmin())?.username).toBe("super");
    await b.adminLogout();
    expect(await b.getCurrentAdmin()).toBeNull();
  });

  it("gives one answer for a wrong password, an unknown user and a disabled account", async () => {
    const b = browser(db, fake);
    db.update(schema.admins).set({ disabled: true }).where(eq(schema.admins.username, "admin2")).run();
    for (const [u, p] of [["super", "nope"], ["ghost", "x"], ["admin2", "sample-admin-2"]]) {
      expect(await b.adminLogin(u, p)).toMatchObject({ ok: false, error: { code: "invalid_credentials" } });
    }
  });

  it("blocks an IP after 5 failed sign-ins", async () => {
    const b = browser(db, fake, "10.1.9.9");
    for (let i = 0; i < 5; i++) await b.adminLogin("super", "wrong");
    expect(await b.adminLogin("super", SUPER.password)).toMatchObject({ ok: false, error: { code: "rate_limited" } });
  });

  it("refuses every organizer call without a session, whatever actor the browser claims", async () => {
    const b = browser(db, fake);
    expect(await b.listTeams()).toEqual([]);
    expect(await b.getTeam(1)).toBeNull();
    expect(await b.resendCode(1, { id: 1, name: "Sample Super Admin" })).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(await b.listAdmins({ id: 1, name: "x" })).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

describe("teams", () => {
  it("lists every team with members and current submissions, and filters and searches", async () => {
    const b = await signedIn(ADMIN1);
    const all = await b.listTeams();
    expect(all).toHaveLength(20);
    const coral = all.find((t) => t.name === "Coral Code")!;
    expect(coral.members.map((m) => m.position)).toEqual([1, 2, 3]);
    expect(coral.proposal?.version).toBe(2);
    expect((await b.listTeams({ category: "open" })).every((t) => t.category === "open")).toBe(true);
    expect((await b.listTeams({ stage: "prototype_submitted" })).map((t) => t.name).sort()).toEqual(
      ["Aqua Alert", "Kite Runners", "Ohm Sweet Ohm", "Tiny Tinkerers"].sort(),
    );
    expect((await b.listTeams({ search: coral.members[1].email.toUpperCase() })).map((t) => t.name)).toEqual(["Coral Code"]);
    expect((await b.listTeams({ search: coral.code.toLowerCase() })).map((t) => t.name)).toEqual(["Coral Code"]);
  });

  it("hides draft ticks from plain admins but shows them to super admins", async () => {
    backToDraft();
    db.update(schema.teams).set({ shortlistMark: true }).where(eq(schema.teams.name, "Green Pulse")).run();
    const admin = await signedIn(ADMIN1);
    const sup = await signedIn(SUPER, "10.1.0.2");
    expect((await admin.listTeams()).find((t) => t.name === "Green Pulse")?.shortlistMark).toBe(false);
    expect((await sup.listTeams()).find((t) => t.name === "Green Pulse")?.shortlistMark).toBe(true);
  });

  it("edits a team, records each change, and refuses a clash or a stale edit", async () => {
    const b = await signedIn(ADMIN1);
    const team = (await b.listTeams()).find((t) => t.name === "Coral Code")!;
    const r = await b.updateTeam(team.id, editFrom(team, { name: "Coral Code Crew" }));
    expect(r).toEqual({ ok: true, data: { changes: [{ field: "name", from: "Coral Code", to: "Coral Code Crew" }] } });
    expect(teamByName(db, "Coral Code Crew").id).toBe(team.id);

    const other = (await b.listTeams()).find((t) => t.name === "Kite Runners")!;
    const clash = editFrom(team, { name: "Coral Code Crew" });
    clash.members[1].email = other.members[0].email;
    expect(await b.updateTeam(team.id, clash)).toMatchObject({
      ok: false,
      error: { code: "duplicate_member", conflicts: [{ field: "email", memberPosition: 2 }] },
    });

    expect(await b.updateTeam(team.id, { ...editFrom(team), expectedUpdatedAt: team.updatedAt })).toMatchObject({
      ok: false,
      error: { code: "edit_conflict" },
    });
    const audit = await b.getAuditLog({ targetType: "team", targetId: String(team.id) });
    expect(audit[0]).toMatchObject({ action: "team.edited", actorName: "Sample Admin One" });
  });

  it("lets members of one team swap emails", async () => {
    const b = await signedIn(ADMIN1);
    const team = (await b.listTeams()).find((t) => t.name === "Coral Code")!;
    const edit = editFrom(team);
    [edit.members[0].email, edit.members[1].email] = [edit.members[1].email, edit.members[0].email];
    expect((await b.updateTeam(team.id, edit)).ok).toBe(true);
  });

  it("emails the code again and records who asked", async () => {
    const b = await signedIn(ADMIN1);
    const team = teamByName(db, "Island Edge");
    const r = await b.resendCode(team.id);
    expect(r.ok).toBe(true);
    const mail = (await b.listOutbox(team.id))[0];
    expect(mail).toMatchObject({ template: "code_reminder", status: "pending", props: { code: team.code } });
  });

  it("queues a failed email to go again, and leaves sent ones alone", async () => {
    const b = await signedIn(ADMIN1);
    const team = teamByName(db, "Island Edge");
    await b.resendCode(team.id);
    const [mail, ...older] = await b.listOutbox(team.id);
    const sent = older.find((e) => e.status === "sent")!;
    db.update(schema.emailOutbox)
      .set({ status: "failed", attempts: 6, nextAttemptAt: 9_999_999_999_999, lastError: "550 rejected" })
      .where(eq(schema.emailOutbox.id, mail.id))
      .run();

    expect(await b.retryEmails([mail.id, sent.id])).toEqual({ ok: true, data: { count: 1 } });

    const row = db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.id, mail.id)).get()!;
    expect(row).toMatchObject({ status: "pending", attempts: 0, nextAttemptAt: 0, lastError: null });
    expect((await b.listOutbox(team.id)).find((e) => e.id === sent.id)).toEqual(sent);
    expect((await b.getAuditLog({ targetType: "team", targetId: String(team.id) }))[0]).toMatchObject({
      action: "email.retried",
      actorName: "Sample Admin One",
    });
    expect(await b.retryEmails([sent.id])).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await b.retryEmails([])).toMatchObject({ ok: false });
  });

  it("refuses a retry from someone who isn't signed in", async () => {
    expect(await browser(db, fake).retryEmails([1])).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });

  it("hides draft ticks from plain admins in a team's audit trail", async () => {
    const sup = await signedIn(SUPER);
    const admin = await signedIn(ADMIN1, "10.1.0.2");
    const id = String(teamByName(db, "Lanka Sensors").id);
    const all = await sup.getAuditLog({});
    const forAdmin = await admin.getAuditLog({});
    expect(all.some((e) => e.action === "shortlist.marked")).toBe(true);
    expect(forAdmin.some((e) => e.action === "shortlist.marked")).toBe(false);
    expect((await admin.getAuditLog({ targetType: "team", targetId: id })).length).toBeGreaterThan(0);
  });
});

describe("shortlist", () => {
  it("can't be reopened once a prototype exists", async () => {
    const b = await signedIn(SUPER);
    expect(await b.reopenShortlist()).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });

  it("is super-admin only", async () => {
    backToDraft();
    const b = await signedIn(ADMIN1);
    expect(await b.setShortlistMarks([teamByName(db, "Green Pulse").id], true)).toMatchObject({ error: { code: "forbidden" } });
    expect(await b.finaliseShortlist(undefined, "FINALISE")).toMatchObject({ error: { code: "forbidden" } });
  });

  it("ticks only teams with a proposal, while it's a draft", async () => {
    const b = await signedIn(SUPER);
    expect(await b.setShortlistMarks([teamByName(db, "Green Pulse").id], true)).toMatchObject({ error: { code: "shortlist_finalised" } });
    backToDraft();
    expect(await b.setShortlistMarks([teamByName(db, "Wave Riders").id], true)).toMatchObject({ error: { code: "no_proposal" } });
    expect(await b.setShortlistMarks([teamByName(db, "Green Pulse").id], true)).toEqual({ ok: true, data: { count: 1 } });
  });

  it("finalises in one go: stages, emails only to newly shortlisted teams, history and audit", async () => {
    backToDraft();
    const b = await signedIn(SUPER);
    const green = teamByName(db, "Green Pulse");
    const lanka = teamByName(db, "Lanka Sensors");
    await b.setShortlistMarks([green.id], true);
    await b.setShortlistMarks([lanka.id], false);
    expect(await b.finaliseShortlist(undefined, "finalise")).toMatchObject({ error: { code: "confirmation_required" } });

    const r = await b.finaliseShortlist(undefined, "FINALISE");
    expect(r).toMatchObject({ ok: true, data: { shortlistedCount: 10, newlyEmailedCount: 1 } });
    expect(teamByName(db, "Green Pulse").stage).toBe("shortlisted");
    expect(teamByName(db, "Lanka Sensors").stage).toBe("not_shortlisted");
    const shortlistEmails = db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.template, "shortlisted")).all();
    expect(shortlistEmails.filter((e) => e.status === "pending").map((e) => e.teamId)).toEqual([green.id]);

    const history = await b.listShortlistFinalisations();
    expect(history[0]).toMatchObject({ finalisedByName: "Sample Super Admin", shortlistedCount: 10, newlyEmailedCount: 1 });
    expect(await b.finaliseShortlist(undefined, "FINALISE")).toMatchObject({ error: { code: "shortlist_finalised" } });

    // Reopen and finalise again: nobody is emailed twice
    expect((await b.reopenShortlist()).ok).toBe(true);
    expect(await b.finaliseShortlist(undefined, "FINALISE")).toMatchObject({ ok: true, data: { newlyEmailedCount: 0 } });
  });
});

describe("finalists", () => {
  it("announces only teams with a prototype, emails each once, and can be undone without email", async () => {
    const b = await signedIn(SUPER);
    const aqua = teamByName(db, "Aqua Alert");
    const lanka = teamByName(db, "Lanka Sensors");
    expect(await b.announceFinalists([lanka.id], undefined, "FINALISTS")).toMatchObject({ error: { code: "no_prototype" } });
    expect(await b.announceFinalists([aqua.id], undefined, "yes")).toMatchObject({ error: { code: "confirmation_required" } });

    expect(await b.announceFinalists([aqua.id], undefined, "FINALISTS")).toEqual({ ok: true, data: { count: 1, newlyEmailedCount: 1 } });
    expect(teamByName(db, "Aqua Alert").stage).toBe("finalist");
    expect(await b.unmarkFinalists([aqua.id])).toEqual({ ok: true, data: { count: 1 } });
    expect(teamByName(db, "Aqua Alert").stage).toBe("prototype_submitted");
    expect(await b.announceFinalists([aqua.id], undefined, "FINALISTS")).toEqual({ ok: true, data: { count: 1, newlyEmailedCount: 0 } });
    expect(db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.template, "finalist")).all()).toHaveLength(1);
  });

  it("stops a finalist from replacing its prototype", async () => {
    const sup = await signedIn(SUPER);
    const aqua = teamByName(db, "Aqua Alert");
    await sup.announceFinalists([aqua.id], undefined, "FINALISTS");
    const team = browser(db, fake, "10.2.0.1");
    await team.loginWithCode(aqua.code);
    expect(await team.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ error: { code: "not_allowed" } });
  });
});

describe("exports", () => {
  it("downloads CSV with a BOM, the result column and the given order", async () => {
    const b = await signedIn(ADMIN1);
    const ids = [teamByName(db, "Kite Runners").id, teamByName(db, "Wave Riders").id];
    const r = await b.exportTeamsCsv(ids);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const lines = r.data.csv.split("\r\n");
    expect(lines[0].startsWith("﻿Team code")).toBe(true);
    expect(lines[0]).toContain("Shortlist result");
    expect(lines[1]).toContain("Kite Runners");
    expect(lines[2]).toContain("Wave Riders");
    expect(r.data.fileName).toMatch(/^sliot-teams-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
  });

  it("rewrites the Teams tab, or explains when Sheets isn't set up", async () => {
    const b = await signedIn(ADMIN1);
    const r = await b.exportToSheets();
    expect(r).toMatchObject({ ok: true, data: { count: 20 } });
    expect(fake.sheetRows).toHaveLength(21);
    expect((await b.getSettings()).lastSheetExportAt).toBe(r.ok ? r.data.exportedAt : null);
    fake.sheets = null;
    expect(await b.exportToSheets()).toMatchObject({ ok: false, error: { code: "not_configured" } });
  });
});

describe("settings", () => {
  it("saves deadlines in order, super admins only, and records the change", async () => {
    const sup = await signedIn(SUPER);
    const before = (await sup.getSettings()).deadlines;
    const later = "2027-06-20T23:59:00+05:30";
    expect(await sup.updateSettings({ prototypeDue: later })).toMatchObject({ ok: true, data: { prototypeDue: later } });
    expect((await sup.getSettings()).deadlines.prototypeDue).toBe(later);
    expect(await sup.updateSettings({ proposalDue: before.registrationCloses })).toMatchObject({ error: { code: "invalid_input" } });
    const admin = await signedIn(ADMIN1, "10.1.0.2");
    expect(await admin.updateSettings({ prototypeDue: later })).toMatchObject({ error: { code: "forbidden" } });
  });
});

describe("organizer accounts", () => {
  it("creates an account with a one-time password that works", async () => {
    const sup = await signedIn(SUPER);
    const r = await sup.createAdmin({ username: "Judge.One", displayName: "Judge One", role: "admin" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.password).toHaveLength(PASSWORD_LENGTH);
    expect(r.data.admin.username).toBe("judge.one");
    expect(await sup.createAdmin({ username: "judge.one", displayName: "Again", role: "admin" })).toMatchObject({
      error: { code: "duplicate_username" },
    });
    const judge = browser(db, fake, "10.3.0.1");
    expect((await judge.adminLogin("judge.one", r.data.password)).ok).toBe(true);
  });

  it("resets a password: the old one stops working and sessions end", async () => {
    const one = await signedIn(ADMIN1, "10.3.0.2");
    const sup = await signedIn(SUPER);
    const r = await sup.resetAdminPassword(ADMIN1.id);
    expect(r.ok).toBe(true);
    expect(await one.getCurrentAdmin()).toBeNull();
    expect(await browser(db, fake, "10.3.0.3").adminLogin("admin1", ADMIN1.password)).toMatchObject({ ok: false });
    if (r.ok) expect((await browser(db, fake, "10.3.0.4").adminLogin("admin1", r.data.password)).ok).toBe(true);
  });

  it("protects your own account and the last super admin", async () => {
    const sup = await signedIn(SUPER);
    expect(await sup.setAdminDisabled(SUPER.id, true)).toMatchObject({ error: { code: "own_account" } });
    expect(await sup.setAdminRole(SUPER.id, "admin")).toMatchObject({ error: { code: "last_super_admin" } });
    expect(await sup.setAdminRole(ADMIN1.id, "super_admin")).toMatchObject({ ok: true, data: { role: "super_admin" } });
    expect(await sup.setAdminDisabled(ADMIN1.id, true)).toMatchObject({ ok: true, data: { disabled: true } });
    expect((await sup.listAdmins()).ok).toBe(true);
  });

  it("disabling an account ends its sessions", async () => {
    const two = await signedIn({ username: "admin2", password: "sample-admin-2" }, "10.3.0.5");
    const sup = await signedIn(SUPER);
    await sup.setAdminDisabled(3, true);
    expect(await two.getCurrentAdmin()).toBeNull();
    expect(db.select().from(schema.sessions).where(inArray(schema.sessions.subjectId, [3])).all()).toHaveLength(0);
  });
});

describe("audit log", () => {
  it("pages newest first and filters by group, super admins only", async () => {
    const sup = await signedIn(SUPER);
    const page = await sup.listAuditLog(undefined, { limit: 5 });
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    expect(page.data.entries).toHaveLength(5);
    expect(page.data.hasMore).toBe(true);
    const times = page.data.entries.map((e) => e.createdAt);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    const shortlist = await sup.listAuditLog(undefined, { actionGroup: "shortlist", limit: 100 });
    expect(shortlist.ok && shortlist.data.entries.every((e) => e.action.startsWith("shortlist."))).toBe(true);
    const admin = await signedIn(ADMIN1, "10.1.0.2");
    expect(await admin.listAuditLog(undefined, {})).toMatchObject({ error: { code: "forbidden" } });
  });
});
