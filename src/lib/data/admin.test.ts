import { beforeEach, describe, expect, it } from "vitest";
import { PASSWORD_ALPHABET, PASSWORD_LENGTH, generatePassword } from "@/lib/admin-password";
import { createData } from "./api";
import { auditActionGroup } from "./audit";
import { csvCell, formatColomboTime } from "./csv";
import { createDev } from "./dev";
import { generateSampleState, SAMPLE_ADMIN_ACCOUNTS, SAMPLE_SUPER_ADMIN } from "./sample";
import { Store } from "./store";
import type { AdminActor, TeamEditInput, TeamRow } from "./types";

let store: Store;
let d: ReturnType<typeof createData>;
let dev: ReturnType<typeof createDev>;

const ADMIN_ONE: AdminActor = { id: 2, name: "Sample Admin One" };
const [SUPER, ONE] = SAMPLE_ADMIN_ACCOUNTS;

beforeEach(() => {
  store = new Store({ seed: generateSampleState });
  d = createData(store);
  dev = createDev(store);
});

async function byName(name: string): Promise<TeamRow> {
  const team = (await d.listTeams()).find((t) => t.name === name);
  if (!team) throw new Error(`No sample team ${name}`);
  return team;
}

/** The edit form's starting values: the team as it is now */
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
      institutionName: m.institutionName,
      institutionIsOther: m.institutionIsOther,
    })),
    ...over,
  };
}

describe("sample admin accounts", () => {
  it("seeds one super admin and two admins, with ids the shortlist history uses", () => {
    const admins = store.state.admins;
    expect(admins.map((a) => [a.id, a.username, a.role])).toEqual([
      [1, "super", "super_admin"],
      [2, "admin1", "admin"],
      [3, "admin2", "admin"],
    ]);
    expect(SAMPLE_SUPER_ADMIN.id).toBe(1);
  });

  it("never keeps a password in the store", () => {
    const json = JSON.stringify(store.state);
    for (const account of SAMPLE_ADMIN_ACCOUNTS) expect(json).not.toContain(account.password);
  });
});

describe("adminLogin", () => {
  it("signs in with the right password, in any letter case, and records it", async () => {
    const r = await d.adminLogin("  SUPER ", SUPER.password);
    expect(r).toMatchObject({ ok: true, data: { admin: { id: 1, role: "super_admin" } } });
    if (r.ok) expect(r.data.admin).not.toHaveProperty("passwordHash");

    expect(await d.getCurrentAdmin()).toMatchObject({ username: "super" });
    expect(store.state.admins[0].lastLoginAt).toBe(store.now());
    const log = await d.getAuditLog({ targetType: "admin", targetId: "1" });
    expect(log.map((e) => e.action)).toContain("admin.login");
  });

  it("refuses a wrong password or an unknown user with the same reply, and logs the failure", async () => {
    const wrong = await d.adminLogin("super", "not-the-password");
    const unknown = await d.adminLogin("nobody", "whatever");
    expect(wrong).toMatchObject({ ok: false, error: { code: "invalid_credentials" } });
    expect(unknown).toEqual(wrong);
    expect(await d.getCurrentAdmin()).toBeNull();

    const failures = store.state.audit.filter((e) => e.action === "admin.login_failed");
    expect(failures).toHaveLength(2);
    expect(failures[0].actorType).toBe("anonymous");
    // The attempted username is logged, the password never is
    expect(JSON.stringify(failures)).not.toContain("not-the-password");
  });

  it("does not let a disabled account in, and says nothing about why", async () => {
    await d.setAdminDisabled(ONE.id, true, SAMPLE_SUPER_ADMIN);
    expect(await d.adminLogin(ONE.username, ONE.password)).toMatchObject({
      ok: false,
      error: { code: "invalid_credentials" },
    });
  });

  it("limits tries to 5 per 15 minutes, even with the right password", async () => {
    for (let i = 0; i < 5; i++) await d.adminLogin("super", "wrong");
    const r = await d.adminLogin("super", SUPER.password);
    expect(r).toMatchObject({ ok: false, error: { code: "rate_limited" } });
    if (!r.ok) expect(r.error.retryAfterSeconds).toBeGreaterThan(0);

    // The window passes on the sample clock
    store.mutate((s) => {
      s.settings.now = store.now() + 16 * 60 * 1000;
    });
    expect((await d.adminLogin("super", SUPER.password)).ok).toBe(true);
  });

  it("logs out", async () => {
    await d.adminLogin("super", SUPER.password);
    await d.adminLogout();
    expect(await d.getCurrentAdmin()).toBeNull();
  });

  it("signs in as a sample admin from the dev switcher without a password", async () => {
    dev.loginAsSampleAdmin(2);
    expect(await d.getCurrentAdmin()).toMatchObject({ username: "admin1", role: "admin" });
    expect(dev.listSampleAdminLogins().map((a) => a.username)).toEqual(["super", "admin1", "admin2"]);
  });
});

describe("roles", () => {
  it("keeps every super-admin function from a regular admin", async () => {
    const [first] = await d.listTeams();
    const forbidden = { ok: false, error: { code: "forbidden" } };

    expect(await d.setShortlistMarks([first.id], true, ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.finaliseShortlist(ADMIN_ONE, "FINALISE")).toMatchObject(forbidden);
    expect(await d.reopenShortlist(ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.announceFinalists([first.id], ADMIN_ONE, "FINALISTS")).toMatchObject(forbidden);
    expect(await d.unmarkFinalists([first.id], ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.updateSettings({ proposalDue: "2027-03-20T23:59:00+05:30" }, ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.listAdmins(ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.createAdmin({ username: "newbie", displayName: "New Bie", role: "admin" }, ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.resetAdminPassword(1, ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.setAdminDisabled(3, true, ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.setAdminRole(3, "super_admin", ADMIN_ONE)).toMatchObject(forbidden);
    expect(await d.listAuditLog(ADMIN_ONE)).toMatchObject(forbidden);

    // Nothing changed
    expect(store.state.settings.shortlistState).toBe("finalised");
    expect(store.state.admins).toHaveLength(3);
  });

  it("lets a regular admin do the organizer functions", async () => {
    const team = await byName("Wave Riders");
    expect((await d.resendCode(team.id, ADMIN_ONE)).ok).toBe(true);
    expect((await d.updateTeam(team.id, editFrom(team, { name: "Wave Riders 2" }), ADMIN_ONE)).ok).toBe(true);
    expect((await d.exportTeamsCsv(undefined, ADMIN_ONE)).ok).toBe(true);
    expect((await d.exportToSheets(ADMIN_ONE)).ok).toBe(true);
  });

  it("refuses an actor that isn't an account, or whose account is disabled", async () => {
    const ghost: AdminActor = { id: 999, name: "Ghost" };
    expect(await d.exportToSheets(ghost)).toMatchObject({ ok: false, error: { code: "forbidden" } });

    await d.setAdminDisabled(ONE.id, true, SAMPLE_SUPER_ADMIN);
    expect(await d.exportToSheets(ADMIN_ONE)).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

describe("generatePassword", () => {
  it("makes 16 characters from the alphabet without look-alikes", () => {
    const p = generatePassword();
    expect(p).toHaveLength(PASSWORD_LENGTH);
    for (const ch of p) expect(PASSWORD_ALPHABET).toContain(ch);
    expect(PASSWORD_ALPHABET).not.toMatch(/[01OlI]/);
  });

  it("does not repeat, and skips bytes that would bias the pick", () => {
    expect(generatePassword()).not.toBe(generatePassword());
    // 255 is above the unbiased limit, so it is skipped and the next byte (0) is used
    const bytes = [255, 0];
    let i = 0;
    const p = generatePassword(() => (i < bytes.length ? bytes[i++] : 1));
    expect(p[0]).toBe(PASSWORD_ALPHABET[0]);
  });
});

describe("createAdmin", () => {
  it("makes the account, shows the password once and lets it sign in", async () => {
    const r = await d.createAdmin({ username: " New.Admin ", displayName: "New Admin", role: "admin" }, SAMPLE_SUPER_ADMIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.admin).toMatchObject({ username: "new.admin", role: "admin", disabled: false, lastLoginAt: null });
    expect(r.data.password).toHaveLength(PASSWORD_LENGTH);

    expect(JSON.stringify(store.state)).not.toContain(r.data.password);
    expect((await d.adminLogin("new.admin", r.data.password)).ok).toBe(true);

    const log = await d.getAuditLog({ targetType: "admin", targetId: String(r.data.admin.id) });
    expect(log.find((e) => e.action === "admin.created")?.details).toEqual({ username: "new.admin", role: "admin" });
    expect(JSON.stringify(log)).not.toContain(r.data.password);
  });

  it("refuses a taken or malformed username", async () => {
    expect(await d.createAdmin({ username: "SUPER", displayName: "Another", role: "admin" }, SAMPLE_SUPER_ADMIN)).toMatchObject({
      ok: false,
      error: { code: "duplicate_username", issues: [{ path: "username" }] },
    });
    const bad = await d.createAdmin({ username: "a b", displayName: "X", role: "admin" }, SAMPLE_SUPER_ADMIN);
    expect(bad).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    if (!bad.ok) expect(bad.error.issues?.map((i) => i.path)).toEqual(expect.arrayContaining(["username", "displayName"]));
    expect(store.state.admins).toHaveLength(3);
  });

  it("lists accounts without hashes", async () => {
    const r = await d.listAdmins(SAMPLE_SUPER_ADMIN);
    expect(r.ok && r.data.map((a) => a.username)).toEqual(["super", "admin1", "admin2"]);
    expect(JSON.stringify(r)).not.toContain("passwordHash");
  });
});

describe("resetAdminPassword", () => {
  it("replaces the password and ends that account's session", async () => {
    await d.adminLogin(ONE.username, ONE.password);
    const r = await d.resetAdminPassword(ONE.id, SAMPLE_SUPER_ADMIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(await d.getCurrentAdmin()).toBeNull();
    expect((await d.adminLogin(ONE.username, ONE.password)).ok).toBe(false);
    expect((await d.adminLogin(ONE.username, r.data.password)).ok).toBe(true);
    expect(store.state.audit.some((e) => e.action === "admin.password_reset" && e.targetId === "2")).toBe(true);
  });

  it("reports an account that doesn't exist", async () => {
    expect(await d.resetAdminPassword(999, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});

describe("setAdminDisabled", () => {
  it("disables and re-enables an account, ending its session", async () => {
    await d.adminLogin(ONE.username, ONE.password);
    const off = await d.setAdminDisabled(ONE.id, true, SAMPLE_SUPER_ADMIN);
    expect(off).toMatchObject({ ok: true, data: { disabled: true } });
    expect(await d.getCurrentAdmin()).toBeNull();

    const on = await d.setAdminDisabled(ONE.id, false, SAMPLE_SUPER_ADMIN);
    expect(on).toMatchObject({ ok: true, data: { disabled: false } });
    expect((await d.adminLogin(ONE.username, ONE.password)).ok).toBe(true);

    const actions = store.state.audit.filter((e) => e.targetType === "admin" && e.targetId === "2").map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["admin.disabled", "admin.enabled"]));
  });

  it("won't disable your own account", async () => {
    expect(await d.setAdminDisabled(1, true, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "own_account" } });
  });

  it("lets one super admin disable another, and then protects the one left", async () => {
    await d.setAdminRole(2, "super_admin", SAMPLE_SUPER_ADMIN);
    expect((await d.setAdminDisabled(1, true, ADMIN_ONE)).ok).toBe(true);

    // Admin 2 is now the only active super admin: they can't disable or demote themselves
    expect(await d.setAdminDisabled(2, true, ADMIN_ONE)).toMatchObject({ ok: false, error: { code: "own_account" } });
    expect(await d.setAdminRole(2, "admin", ADMIN_ONE)).toMatchObject({ ok: false, error: { code: "last_super_admin" } });

    // A disabled super admin doesn't count, and can't act
    expect(await d.setAdminDisabled(3, true, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

describe("setAdminRole", () => {
  it("won't demote the last active super admin", async () => {
    expect(await d.setAdminRole(1, "admin", SAMPLE_SUPER_ADMIN)).toMatchObject({
      ok: false,
      error: { code: "last_super_admin" },
    });
    expect(store.state.admins[0].role).toBe("super_admin");
  });

  it("promotes, then allows demoting the first super admin, and records the change", async () => {
    const up = await d.setAdminRole(2, "super_admin", SAMPLE_SUPER_ADMIN);
    expect(up).toMatchObject({ ok: true, data: { role: "super_admin" } });
    expect((await d.setAdminRole(1, "admin", ADMIN_ONE)).ok).toBe(true);

    const entry = store.state.audit.find((e) => e.action === "admin.role_changed" && e.targetId === "2");
    expect(entry?.details).toEqual({ from: "admin", to: "super_admin" });
  });

  it("changes nothing when the role is already set", async () => {
    const before = store.state.audit.length;
    expect((await d.setAdminRole(2, "admin", SAMPLE_SUPER_ADMIN)).ok).toBe(true);
    expect(store.state.audit).toHaveLength(before);
  });
});

describe("updateSettings", () => {
  it("changes deadlines, shows them to the rest of the app and records old and new", async () => {
    const r = await d.updateSettings({ proposalDue: "2027-03-20T23:59:00+05:30" }, SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: true, data: { proposalDue: "2027-03-20T23:59:00+05:30" } });
    expect((await d.getCompetitionState()).deadlines.proposalDue).toBe("2027-03-20T23:59:00+05:30");

    const entry = store.state.audit.find((e) => e.action === "settings.updated");
    expect(entry?.details).toEqual({
      changes: [{ field: "proposalDue", from: "2027-03-15T23:59:00+05:30", to: "2027-03-20T23:59:00+05:30" }],
    });
  });

  it("keeps registration, proposal and prototype in order", async () => {
    const r = await d.updateSettings({ proposalDue: "2027-02-01T23:59:00+05:30" }, SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: false, error: { code: "invalid_input", issues: [{ path: "proposalDue" }] } });

    const r2 = await d.updateSettings({ prototypeDue: "2027-03-01T23:59:00+05:30" }, SAMPLE_SUPER_ADMIN);
    expect(r2).toMatchObject({ ok: false, error: { issues: [{ path: "prototypeDue" }] } });
    expect((await d.getSettings()).deadlines.proposalDue).toBe("2027-03-15T23:59:00+05:30");
  });

  it("rejects a time without an offset or one that isn't a date", async () => {
    expect(await d.updateSettings({ proposalDue: "2027-03-20T23:59:00" }, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false });
    expect(await d.updateSettings({ proposalDue: "soon" }, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false });
  });

  it("records nothing when nothing changed", async () => {
    const before = store.state.audit.length;
    const current = (await d.getSettings()).deadlines;
    expect((await d.updateSettings({ proposalDue: current.proposalDue }, SAMPLE_SUPER_ADMIN)).ok).toBe(true);
    expect(store.state.audit).toHaveLength(before);
  });
});

describe("updateTeam", () => {
  it("fixes a name and a member's details, normalising them, and records each change", async () => {
    const team = await byName("Gridlock Breakers");
    const members = editFrom(team).members;
    members[1] = { ...members[1], fullName: "Fixed Name", whatsapp: "077 123 4567", email: "FIXED@Example.lk" };

    const r = await d.updateTeam(team.id, editFrom(team, { name: "Gridlock Fixers", members }), ADMIN_ONE);
    expect(r.ok).toBe(true);

    const after = await d.getTeam(team.id);
    expect(after?.name).toBe("Gridlock Fixers");
    expect(after?.members[1]).toMatchObject({ fullName: "Fixed Name", whatsapp: "+94771234567", email: "fixed@example.lk" });
    expect(after!.updatedAt).toBe(store.now());

    const entry = (await d.getAuditLog({ targetType: "team", targetId: String(team.id) })).find((e) => e.action === "team.edited");
    expect(entry?.actorName).toBe("Sample Admin One");
    const fields = (entry?.details as { changes: { field: string }[] }).changes.map((c) => c.field);
    expect(fields).toEqual(["name", "member2.fullName", "member2.whatsapp", "member2.email"]);
  });

  it("changes nothing and logs nothing when the form is unchanged", async () => {
    const team = await byName("Wave Riders");
    const before = store.state.audit.length;
    expect(await d.updateTeam(team.id, editFrom(team), SAMPLE_SUPER_ADMIN)).toEqual({ ok: true, data: { changes: [] } });
    expect(store.state.audit).toHaveLength(before);
    expect((await d.getTeam(team.id))!.updatedAt).toBe(team.updatedAt);
  });

  it("applies the registration rules: a university student needs a NIC", async () => {
    const team = await byName("Gridlock Breakers");
    const members = editFrom(team).members;
    members[0] = { ...members[0], nic: "" };
    const r = await d.updateTeam(team.id, editFrom(team, { members }), SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: false, error: { code: "invalid_input", issues: [{ path: "members.0.nic" }] } });
    expect((await d.getTeam(team.id))!.members[0].nic).not.toBeNull();
  });

  it("names the member whose email belongs to another team, but not that team", async () => {
    const team = await byName("Wave Riders");
    const other = await byName("Byte Fireflies");
    const members = editFrom(team).members;
    members[2] = { ...members[2], email: other.members[0].email };

    const r = await d.updateTeam(team.id, editFrom(team, { members }), SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: false, error: { code: "duplicate_member", conflicts: [{ field: "email", memberPosition: 3 }] } });
    expect(JSON.stringify(r)).not.toContain(other.code);
  });

  it("doesn't treat a member's own unchanged email and NIC as a clash", async () => {
    const team = await byName("Gridlock Breakers");
    expect((await d.updateTeam(team.id, editFrom(team, { name: "Gridlock Breakers!" }), SAMPLE_SUPER_ADMIN)).ok).toBe(true);
  });

  it("can't add or remove members, or edit an unknown team", async () => {
    const team = await byName("Wave Riders");
    const fewer = editFrom(team, { members: editFrom(team).members.slice(0, 2) });
    expect(await d.updateTeam(team.id, fewer, SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await d.updateTeam(999_999, editFrom(team), SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("logs one team-level institution change for a School team, not one per member", async () => {
    const team = await byName("Wave Riders");
    const r = await d.updateTeam(team.id, editFrom(team, { institutionName: "Fixed College, Kandy" }), SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: true, data: { changes: [{ field: "institutionName", to: "Fixed College, Kandy" }] } });
    const after = await d.getTeam(team.id);
    expect(after!.members.every((m) => m.institutionName === "Fixed College, Kandy")).toBe(true);
  });

  it("lets an Open team change one member's institution", async () => {
    const team = await byName("Island Edge");
    const members = editFrom(team).members;
    members[1] = { ...members[1], institutionName: "Renamed School, Galle" };
    const r = await d.updateTeam(team.id, editFrom(team, { members }), SAMPLE_SUPER_ADMIN);
    expect(r).toMatchObject({ ok: true, data: { changes: [{ field: "member2.institutionName", to: "Renamed School, Galle" }] } });
  });

  it("never changes the code, category or stage", async () => {
    const team = await byName("Gridlock Breakers");
    await d.updateTeam(team.id, editFrom(team, { name: "Renamed" }), SAMPLE_SUPER_ADMIN);
    const after = await d.getTeam(team.id);
    expect([after?.code, after?.category, after?.stage]).toEqual([team.code, team.category, team.stage]);
  });
});

describe("resendCode", () => {
  it("queues the code to the leader and records it", async () => {
    const team = await byName("Wave Riders");
    const r = await d.resendCode(team.id, ADMIN_ONE);
    expect(r).toEqual({ ok: true, data: { toEmail: team.members[0].email } });

    const mail = (await d.listOutbox(team.id))[0];
    expect(mail).toMatchObject({ template: "code_reminder", toEmail: team.members[0].email, status: "pending" });
    expect(mail.props.code).toBe(team.code);
    expect(store.state.audit.some((e) => e.action === "team.code_resent" && e.actorId === 2)).toBe(true);
  });

  it("reports an unknown team", async () => {
    expect(await d.resendCode(999_999, ADMIN_ONE)).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});

describe("exportTeamsCsv", () => {
  async function csv(ids?: number[]) {
    const r = await d.exportTeamsCsv(ids, ADMIN_ONE);
    if (!r.ok) throw new Error(r.error.message);
    return r.data;
  }

  it("makes UTF-8 with a byte-order mark, one row per team, M1 to M5 columns", async () => {
    const { csv: text, count, fileName } = await csv();
    expect(text.startsWith("﻿")).toBe(true);
    expect(count).toBe(20);
    expect(fileName).toMatch(/^sliot-teams-2027-\d{2}-\d{2}-\d{4}\.csv$/);

    const lines = text.slice(1).trimEnd().split("\r\n");
    expect(lines).toHaveLength(21);
    const header = lines[0].split(",");
    expect(header.slice(0, 5)).toEqual(["Team code", "Team name", "Category", "Institution", "Stage"]);
    expect(header).toContain("M1 name");
    expect(header).toContain("M5 NIC");
    // 5 team columns, the result column, 5 more team columns, then 5 columns for each of 5 members
    expect(header).toHaveLength(5 + 1 + 5 + 25);
  });

  it("follows the order it was given (the table's view) and fills only the members a team has", async () => {
    const small = await byName("Circuit Cubs");
    const big = await byName("Lanka Sensors");
    const { csv: text, count } = await csv([big.id, small.id]);
    expect(count).toBe(2);

    const [, first, second] = text.slice(1).trimEnd().split("\r\n");
    expect(first.startsWith(big.code)).toBe(true);
    expect(second.startsWith(small.code)).toBe(true);
    expect(first).toContain(big.members[4].email);
    // One member: the cells for M2 to M5 (20 of them) are empty, so the row ends in commas
    expect(second.endsWith(",".repeat(20))).toBe(true);
    expect(second).toContain(small.members[0].email);
  });

  it("adds the shortlist result column only while the shortlist is finalised", async () => {
    expect((await csv()).csv).toContain("Shortlist result");
    dev.setSampleShortlistState("draft");
    expect((await csv()).csv).not.toContain("Shortlist result");
  });

  it("records the export, and reports unknown teams", async () => {
    await csv([1]);
    expect(store.state.audit.find((e) => e.action === "export.csv")?.details).toEqual({ count: 1 });
    expect(await d.exportTeamsCsv([999_999], ADMIN_ONE)).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});

describe("csvCell", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(3)).toBe("3");
  });

  it("defuses spreadsheet formulas but leaves phone numbers alone", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("+cmd|' /C calc'!A0")).toMatch(/^"?'\+cmd/);
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("+94700000001")).toBe("+94700000001");
    expect(csvCell("Sinhala සිංහල")).toBe("Sinhala සිංහල");
  });

  it("writes times in Sri Lanka time", () => {
    expect(formatColomboTime(Date.parse("2027-03-15T23:59:00+05:30"))).toBe("2027-03-15 23:59");
    expect(formatColomboTime(Date.parse("2027-03-15T18:29:00Z"))).toBe("2027-03-15 23:59");
  });
});

describe("exportToSheets", () => {
  it("records when it ran", async () => {
    expect(store.state.settings.lastSheetExportAt).toBeNull();
    const r = await d.exportToSheets(SAMPLE_SUPER_ADMIN);
    expect(r).toEqual({ ok: true, data: { exportedAt: store.now(), count: 20 } });
    expect((await d.getSettings()).lastSheetExportAt).toBe(store.now());
    expect(store.state.audit.some((e) => e.action === "export.sheets")).toBe(true);
  });
});

describe("listAuditLog", () => {
  it("filters by action group, actor and dates, newest first, with actor names", async () => {
    const team = await byName("Wave Riders");
    await d.resendCode(team.id, ADMIN_ONE);
    await d.exportToSheets(SAMPLE_SUPER_ADMIN);

    const all = await d.listAuditLog(SAMPLE_SUPER_ADMIN);
    expect(all.ok && all.data.entries[0].createdAt).toBeGreaterThanOrEqual(all.ok ? all.data.entries.at(-1)!.createdAt : 0);

    const exports = await d.listAuditLog(SAMPLE_SUPER_ADMIN, { actionGroup: "export" });
    expect(exports.ok && exports.data.entries.map((e) => e.action)).toEqual(["export.sheets"]);
    expect(exports.ok && exports.data.entries[0].actorName).toBe("Sample Super Admin");

    const byAdminOne = await d.listAuditLog(SAMPLE_SUPER_ADMIN, { actorType: "admin", actorId: 2 });
    expect(byAdminOne.ok && byAdminOne.data.entries.map((e) => e.action)).toEqual(["team.code_resent"]);

    // The seeded history runs past the sample clock, so look beyond the newest entry
    const newest = Math.max(...store.state.audit.map((e) => e.createdAt));
    const future = await d.listAuditLog(SAMPLE_SUPER_ADMIN, { from: newest + 1 });
    expect(future.ok && future.data.entries).toEqual([]);
    const onlyNewest = await d.listAuditLog(SAMPLE_SUPER_ADMIN, { from: newest, to: newest });
    expect(onlyNewest.ok && onlyNewest.data.entries.length).toBeGreaterThan(0);
  });

  it("pages 100 at a time and says when there is more", async () => {
    for (let i = 0; i < 120; i++) await d.exportToSheets(SAMPLE_SUPER_ADMIN);
    const first = await d.listAuditLog(SAMPLE_SUPER_ADMIN);
    expect(first.ok && first.data.entries).toHaveLength(100);
    expect(first.ok && first.data.hasMore).toBe(true);

    const second = await d.listAuditLog(SAMPLE_SUPER_ADMIN, { offset: 100, limit: 100 });
    expect(second.ok && second.data.hasMore).toBe(false);
    const ids = [...(first.ok ? first.data.entries : []), ...(second.ok ? second.data.entries : [])].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("groups every action the layer records", () => {
    const groups = {
      "team.registered": "team",
      "proposal.uploaded": "team",
      "prototype.submitted": "team",
      "shortlist.finalised": "shortlist",
      "finalists.announced": "finalists",
      "admin.login_failed": "admin",
      "settings.updated": "settings",
      "export.csv": "export",
    } as const;
    for (const [action, group] of Object.entries(groups)) expect(auditActionGroup(action)).toBe(group);
    expect(auditActionGroup("mystery.thing")).toBeNull();
  });

  it("gives the team drawer's trail the actor's name", async () => {
    const team = await byName("Wave Riders");
    await d.resendCode(team.id, ADMIN_ONE);
    const trail = await d.getAuditLog({ targetType: "team", targetId: String(team.id) });
    expect(trail.find((e) => e.action === "team.code_resent")?.actorName).toBe("Sample Admin One");
    expect(trail.find((e) => e.action === "team.registered")?.actorName).toBeNull();
  });
});
