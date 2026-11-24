import { beforeEach, describe, expect, it } from "vitest";
import { normaliseTeamCode } from "@/lib/team-code";
import { createData } from "./api";
import { createDev } from "./dev";
import { NetworkError } from "./errors";
import { generateSampleState, SAMPLE_SUPER_ADMIN } from "./sample";
import { Store } from "./store";

let store: Store;
let d: ReturnType<typeof createData>;
let dev: ReturnType<typeof createDev>;

beforeEach(() => {
  store = new Store({ seed: generateSampleState });
  d = createData(store);
  dev = createDev(store);
});

async function byName(name: string) {
  const team = (await d.listTeams()).find((t) => t.name === name);
  if (!team) throw new Error(`No sample team ${name}`);
  return team;
}

async function loginAs(name: string) {
  const team = await byName(name);
  const r = await d.loginWithCode(team.code);
  expect(r.ok).toBe(true);
  return team;
}

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

describe("registerTeam", () => {
  it("creates the team, its members, the confirmation email and an audit entry", async () => {
    const r = await d.registerTeam(newTeam());
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(normaliseTeamCode(r.data.code)).toBe(r.data.code);
    const team = await d.getTeam(r.data.teamId);
    expect(team?.stage).toBe("registered");
    expect(team?.members.map((m) => m.position)).toEqual([1, 2]);
    expect(team?.members[0].institutionName).toBe("Some School, Colombo");

    const mail = (await d.listOutbox(r.data.teamId))[0];
    expect(mail).toMatchObject({ template: "registration_confirmed", toEmail: "aruni@new.example.lk", status: "pending" });
    expect(mail.props.code).toBe(r.data.code);

    const audit = await d.getAuditLog({ targetType: "team", targetId: String(r.data.teamId) });
    expect(audit.map((a) => a.action)).toContain("team.registered");
    expect(await d.listTeams()).toHaveLength(21);
  });

  it("is refused before registration opens and after it closes", async () => {
    dev.setSampleStage("before-registration");
    expect(await d.registerTeam(newTeam())).toMatchObject({ ok: false, error: { code: "registration_not_open" } });
    dev.setSampleStage("proposal");
    expect(await d.registerTeam(newTeam())).toMatchObject({ ok: false, error: { code: "registration_closed" } });
    expect(await d.listTeams()).toHaveLength(20);
  });

  it("reports which field to fix when the input is invalid", async () => {
    const r = await d.registerTeam(newTeam({ members: [{ fullName: "A", whatsapp: "123", email: "nope" }] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("invalid_input");
    expect(r.error.issues?.map((i) => i.path)).toEqual(
      expect.arrayContaining(["members.0.fullName", "members.0.whatsapp", "members.0.email"]),
    );
  });

  it("names the member whose email is already in another team", async () => {
    const existing = (await byName("Wave Riders")).members[0].email;
    const r = await d.registerTeam(
      newTeam({
        members: [
          { fullName: "Aruni Silva", whatsapp: "077 555 0101", email: "aruni@new.example.lk" },
          { fullName: "Dev Perera", whatsapp: "077 555 0102", email: existing.toUpperCase() },
        ],
      }),
    );
    expect(r).toMatchObject({
      ok: false,
      error: { code: "duplicate_member", conflicts: [{ field: "email", memberPosition: 2 }] },
    });
    expect(await d.listTeams()).toHaveLength(20);
  });

  it("names the member whose NIC is already in another team", async () => {
    const taken = (await byName("Volt Voyagers")).members[0].nic!;
    const r = await d.registerTeam(
      newTeam({
        category: "university",
        institutionName: "University of Colombo",
        members: [{ fullName: "Aruni Silva", whatsapp: "077 555 0101", email: "aruni@new.example.lk", nic: taken }],
      }),
    );
    expect(r).toMatchObject({
      ok: false,
      error: { code: "duplicate_member", conflicts: [{ field: "nic", memberPosition: 1 }] },
    });
  });

  it("does not let one person register twice, even in the same team name", async () => {
    expect((await d.registerTeam(newTeam())).ok).toBe(true);
    const again = await d.registerTeam(newTeam({ name: "Second Try" }));
    expect(again).toMatchObject({ ok: false, error: { code: "duplicate_member" } });
  });
});

describe("login", () => {
  it("logs in with a code in any case and logs out", async () => {
    const team = await byName("Wave Riders");
    const r = await d.loginWithCode(team.code.toLowerCase());
    expect(r).toEqual({ ok: true, data: { teamId: team.id } });
    expect((await d.getCurrentTeam())?.name).toBe("Wave Riders");
    await d.logout();
    expect(await d.getCurrentTeam()).toBeNull();
  });

  it("refuses an unknown code and records the failed attempt", async () => {
    const r = await d.loginWithCode("SL27-0000-0000");
    expect(r).toMatchObject({ ok: false, error: { code: "invalid_code" } });
    expect(await d.loginWithCode("garbage")).toMatchObject({ ok: false, error: { code: "invalid_code" } });
    const actions = (await d.getAuditLog()).map((a) => a.action);
    expect(actions.filter((a) => a === "team.login_failed")).toHaveLength(2);
  });
});

describe("requestCodeReminder", () => {
  it("queues the code for the leader's email only", async () => {
    const team = await byName("Wave Riders");
    expect((await d.requestCodeReminder(team.members[0].email)).ok).toBe(true);
    const reminders = (await d.listOutbox(team.id)).filter((e) => e.template === "code_reminder");
    expect(reminders).toHaveLength(1);
    expect(reminders[0].props.code).toBe(team.code);
  });

  it("gives the same reply for unknown emails and non-leaders, and sends nothing", async () => {
    const team = await byName("Wave Riders");
    const before = (await d.listOutbox()).length;
    expect(await d.requestCodeReminder("nobody@example.lk")).toEqual({ ok: true, data: null });
    expect(await d.requestCodeReminder(team.members[1].email)).toEqual({ ok: true, data: null });
    expect((await d.listOutbox()).length).toBe(before);
  });

  it("rejects something that isn't an email", async () => {
    expect(await d.requestCodeReminder("not an email")).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });
});

describe("uploadProposal", () => {
  const pdf = { fileName: "plan.pdf", sizeBytes: 1_500_000 };

  it("needs a login", async () => {
    expect(await d.uploadProposal(pdf)).toMatchObject({ ok: false, error: { code: "not_logged_in" } });
  });

  it("moves a registered team to proposal_submitted and emails the leader", async () => {
    const team = await loginAs("Wave Riders");
    expect(await d.uploadProposal(pdf)).toEqual({ ok: true, data: { version: 1 } });
    const after = await d.getTeam(team.id);
    expect(after?.stage).toBe("proposal_submitted");
    expect(after?.proposal?.fileName).toBe(`${team.code} – Wave Riders – v1.pdf`);
    expect((await d.listOutbox(team.id)).some((e) => e.template === "proposal_received")).toBe(true);
  });

  it("keeps old versions and makes the newest current", async () => {
    const team = await loginAs("Wave Riders");
    await d.uploadProposal(pdf);
    expect(await d.uploadProposal(pdf)).toEqual({ ok: true, data: { version: 2 } });
    const after = await d.getTeam(team.id);
    expect(after?.submissions.filter((s) => s.kind === "proposal").map((s) => [s.version, s.isCurrent])).toEqual([
      [2, true],
      [1, false],
    ]);
    expect(after?.proposal?.version).toBe(2);
  });

  it("is refused after the proposal deadline", async () => {
    await loginAs("Wave Riders");
    dev.setSampleStage("shortlisting");
    expect(await d.uploadProposal(pdf)).toMatchObject({ ok: false, error: { code: "proposal_deadline_passed" } });
  });

  it("is refused for teams already shortlisted", async () => {
    await loginAs("Lanka Sensors");
    expect(await d.uploadProposal(pdf)).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });

  it("rejects files that aren't PDFs or are too big", async () => {
    await loginAs("Wave Riders");
    expect(await d.uploadProposal({ fileName: "plan.docx", sizeBytes: 1000 })).toMatchObject({
      ok: false,
      error: { code: "invalid_input" },
    });
    expect(await d.uploadProposal({ fileName: "plan.pdf", sizeBytes: 11 * 1024 * 1024 })).toMatchObject({
      ok: false,
      error: { code: "invalid_input" },
    });
    expect(
      await d.uploadProposal({ ...pdf, header: new TextEncoder().encode("PK\u0003\u0004zip") }),
    ).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await d.uploadProposal({ ...pdf, header: new TextEncoder().encode("%PDF-1.7") })).toMatchObject({ ok: true });
  });
});

describe("submitPrototype", () => {
  const link = "https://youtu.be/dQw4w9WgXcQ";

  it("moves a shortlisted team to prototype_submitted", async () => {
    const team = await loginAs("Lanka Sensors");
    expect(await d.submitPrototype(link)).toEqual({
      ok: true,
      data: { version: 1, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    const after = await d.getTeam(team.id);
    expect(after?.stage).toBe("prototype_submitted");
    expect(after?.prototype?.youtubeId).toBe("dQw4w9WgXcQ");
  });

  it("lets a team replace its link", async () => {
    await loginAs("Tiny Tinkerers");
    expect(await d.submitPrototype(link)).toMatchObject({ ok: true, data: { version: 2 } });
  });

  it("is refused for teams that weren't shortlisted", async () => {
    await loginAs("Green Pulse");
    expect(await d.submitPrototype(link)).toMatchObject({ ok: false, error: { code: "not_allowed" } });
    await d.logout();
    await loginAs("Wave Riders");
    expect(await d.submitPrototype(link)).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });

  it("is refused after the prototype deadline and for bad links", async () => {
    await loginAs("Lanka Sensors");
    expect(await d.submitPrototype("https://vimeo.com/1")).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    dev.setSampleStage("finale");
    expect(await d.submitPrototype(link)).toMatchObject({ ok: false, error: { code: "prototype_deadline_passed" } });
  });
});

describe("shortlisting", () => {
  it("can't change ticks while finalised, or tick a team without a proposal", async () => {
    const proposal = await byName("Byte Fireflies");
    expect(await d.setShortlistMarks([proposal.id], true, SAMPLE_SUPER_ADMIN)).toMatchObject({
      ok: false,
      error: { code: "shortlist_finalised" },
    });

    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)
    const noProposal = await byName("Wave Riders");
    expect(await d.setShortlistMarks([noProposal.id], true, SAMPLE_SUPER_ADMIN)).toMatchObject({
      ok: false,
      error: { code: "no_proposal" },
    });
    expect((await byName("Wave Riders")).shortlistMark).toBe(false);
  });

  it("only changes marks until the list is finalised: teams don't see them", async () => {
    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)
    const team = await byName("Byte Fireflies");
    expect(await d.setShortlistMarks([team.id], true, SAMPLE_SUPER_ADMIN)).toEqual({ ok: true, data: { count: 1 } });
    expect((await byName("Byte Fireflies")).stage).toBe("proposal_submitted");
    expect(await d.setShortlistMarks([team.id], true, SAMPLE_SUPER_ADMIN)).toEqual({ ok: true, data: { count: 0 } });
  });

  it("needs the word FINALISE", async () => {
    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)
    expect(await d.finaliseShortlist(SAMPLE_SUPER_ADMIN, "finalise")).toMatchObject({
      ok: false,
      error: { code: "confirmation_required" },
    });
  });

  it("can't be finalised twice or reopened when it's a draft", async () => {
    expect(await d.finaliseShortlist(SAMPLE_SUPER_ADMIN, "FINALISE")).toMatchObject({
      ok: false,
      error: { code: "shortlist_finalised" },
    });
    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)
    expect(await d.reopenShortlist(SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "shortlist_not_finalised" } });
  });

  it("re-finalising emails only newly shortlisted teams and moves stages from the ticks", async () => {
    const shortlistedMails = async (name: string) =>
      (await d.listOutbox((await byName(name)).id)).filter((e) => e.template === "shortlisted").length;

    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)

    const added = await byName("Byte Fireflies"); // proposal submitted, not yet ticked
    const removed = await byName("Lanka Sensors"); // shortlisted and emailed before
    await d.setShortlistMarks([added.id], true, SAMPLE_SUPER_ADMIN);
    await d.setShortlistMarks([removed.id], false, SAMPLE_SUPER_ADMIN);

    const result = await d.finaliseShortlist(SAMPLE_SUPER_ADMIN, "FINALISE");
    // 4 shortlisted + 3 prototype teams, minus 1 unticked, plus 1 newly ticked
    expect(result).toMatchObject({ ok: true, data: { shortlistedCount: 7, newlyEmailedCount: 1 } });

    expect((await byName("Byte Fireflies")).stage).toBe("shortlisted");
    expect((await byName("Lanka Sensors")).stage).toBe("not_shortlisted");
    expect((await byName("Tiny Tinkerers")).stage).toBe("prototype_submitted"); // still ticked: not downgraded
    expect((await byName("Wave Riders")).stage).toBe("not_shortlisted");
    expect((await d.getCompetitionState()).shortlistState).toBe("finalised");

    // Emailed once each, never twice; nobody is emailed for not being shortlisted
    expect(await shortlistedMails("Byte Fireflies")).toBe(1);
    expect(await shortlistedMails("Gridlock Breakers")).toBe(1);
    expect(await shortlistedMails("Lanka Sensors")).toBe(1);
    expect(await shortlistedMails("Green Pulse")).toBe(0);

    const history = await d.listShortlistFinalisations();
    expect(history).toHaveLength(2);
    expect(history[0].newlyEmailedCount).toBe(1);
    const actions = (await d.getAuditLog()).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["shortlist.marked", "shortlist.finalised"]));
  });
});

describe("reopening the shortlist", () => {
  it("is refused once any team has submitted a prototype", async () => {
    expect(await d.reopenShortlist(SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "not_allowed" } });
    expect((await d.getCompetitionState()).shortlistState).toBe("finalised");
  });

  it("works while no prototype exists, and is recorded", async () => {
    store.mutate((s) => {
      s.submissions = s.submissions.filter((x) => x.kind !== "prototype");
    });
    expect(await d.reopenShortlist(SAMPLE_SUPER_ADMIN)).toEqual({ ok: true, data: null });
    expect((await d.getCompetitionState()).shortlistState).toBe("draft");
    expect((await d.getAuditLog()).map((a) => a.action)).toContain("shortlist.reopened");
  });
});

describe("finalists", () => {
  const finalistMails = async (name: string) =>
    (await d.listOutbox((await byName(name)).id)).filter((e) => e.template === "finalist").length;

  it("starts with two finalists, each emailed once", async () => {
    expect((await d.listTeams({ stage: "finalist" })).map((t) => t.name).sort()).toEqual(["Kite Runners", "Ohm Sweet Ohm"]);
    expect(await finalistMails("Ohm Sweet Ohm")).toBe(1);
    expect(await finalistMails("Tiny Tinkerers")).toBe(0);
  });

  it("needs the word FINALISTS", async () => {
    const team = await byName("Tiny Tinkerers");
    expect(await d.announceFinalists([team.id], SAMPLE_SUPER_ADMIN, "FINALISE")).toMatchObject({
      ok: false,
      error: { code: "confirmation_required" },
    });
  });

  it("only takes teams that submitted a prototype, and changes nothing if one doesn't", async () => {
    const withPrototype = await byName("Tiny Tinkerers");
    const without = await byName("Lanka Sensors"); // shortlisted, no prototype yet
    expect(await d.announceFinalists([withPrototype.id, without.id], SAMPLE_SUPER_ADMIN, "FINALISTS")).toMatchObject({
      ok: false,
      error: { code: "no_prototype" },
    });
    expect((await byName("Tiny Tinkerers")).stage).toBe("prototype_submitted");
  });

  it("announces, emails the leader once and records it", async () => {
    const team = await byName("Tiny Tinkerers");
    const r = await d.announceFinalists([team.id, (await byName("Ohm Sweet Ohm")).id], SAMPLE_SUPER_ADMIN, "FINALISTS");
    expect(r).toEqual({ ok: true, data: { count: 1, newlyEmailedCount: 1 } }); // Ohm was already a finalist
    expect((await byName("Tiny Tinkerers")).stage).toBe("finalist");
    expect(await finalistMails("Tiny Tinkerers")).toBe(1);
    expect(await finalistMails("Ohm Sweet Ohm")).toBe(1);
    expect((await d.getAuditLog()).map((a) => a.action)).toContain("finalists.announced");
  });

  it("un-marking drops a team back without an email, and announcing again doesn't email twice", async () => {
    const team = await byName("Tiny Tinkerers");
    await d.announceFinalists([team.id], SAMPLE_SUPER_ADMIN, "FINALISTS");
    expect(await d.unmarkFinalists([team.id], SAMPLE_SUPER_ADMIN)).toEqual({ ok: true, data: { count: 1 } });
    expect((await byName("Tiny Tinkerers")).stage).toBe("prototype_submitted");

    expect(await d.announceFinalists([team.id], SAMPLE_SUPER_ADMIN, "FINALISTS")).toEqual({
      ok: true,
      data: { count: 1, newlyEmailedCount: 0 },
    });
    expect(await finalistMails("Tiny Tinkerers")).toBe(1);
  });

  it("can only un-mark finalists", async () => {
    const team = await byName("Tiny Tinkerers");
    expect(await d.unmarkFinalists([team.id], SAMPLE_SUPER_ADMIN)).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });

  it("stays a finalist through a shortlist re-finalise while still ticked, and can't replace the prototype", async () => {
    dev.setSampleShortlistState("draft"); // the sample has prototypes, so Reopen itself is refused (tested below)
    await d.finaliseShortlist(SAMPLE_SUPER_ADMIN, "FINALISE");
    expect((await byName("Kite Runners")).stage).toBe("finalist");

    await loginAs("Kite Runners");
    expect(await d.submitPrototype("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });
});

describe("login rate limit", () => {
  const fail5 = async () => {
    for (let i = 0; i < 5; i++) await d.loginWithCode("SL27-0000-000" + i);
  };

  it("blocks the sixth try after five failures, even with a correct code", async () => {
    await fail5();
    const code = (await byName("Wave Riders")).code;
    const r = await d.loginWithCode(code);
    expect(r).toMatchObject({ ok: false, error: { code: "rate_limited", retryAfterSeconds: 900 } });
    expect(await d.getCurrentTeam()).toBeNull();
  });

  it("is fine at four failures, and successful logins don't count", async () => {
    for (let i = 0; i < 4; i++) await d.loginWithCode("SL27-0000-000" + i);
    const code = (await byName("Wave Riders")).code;
    expect((await d.loginWithCode(code)).ok).toBe(true);
    await d.logout();
    expect((await d.loginWithCode(code)).ok).toBe(true);
  });

  it("frees up when the window passes, and the wait shrinks as it does", async () => {
    await fail5();
    dev.setSampleStage("registration"); // same clock: still blocked
    expect(await d.loginWithCode("SL27-0000-0009")).toMatchObject({ ok: false, error: { code: "rate_limited" } });

    store.mutate((state) => {
      state.settings.now = state.settings.now! + 10 * 60 * 1000;
    });
    const r = await d.loginWithCode("SL27-0000-0009");
    expect(r).toMatchObject({ ok: false, error: { code: "rate_limited", retryAfterSeconds: 300 } });

    store.mutate((state) => {
      state.settings.now = state.settings.now! + 10 * 60 * 1000;
    });
    expect(await d.loginWithCode("SL27-0000-0009")).toMatchObject({ ok: false, error: { code: "invalid_code" } });
  });

  it("clears on reset", async () => {
    await fail5();
    dev.resetSampleData();
    expect(await d.loginWithCode("SL27-0000-0009")).toMatchObject({ ok: false, error: { code: "invalid_code" } });
  });

  it("limits code reminders too, whether or not the email exists", async () => {
    for (let i = 0; i < 5; i++) expect((await d.requestCodeReminder(`nobody${i}@example.lk`)).ok).toBe(true);
    const leader = (await byName("Wave Riders")).members[0].email;
    expect(await d.requestCodeReminder(leader)).toMatchObject({ ok: false, error: { code: "rate_limited" } });
    expect((await d.listOutbox((await byName("Wave Riders")).id)).some((e) => e.template === "code_reminder")).toBe(false);
  });
});

describe("proposal upload progress", () => {
  const pdf = { fileName: "plan.pdf", sizeBytes: 3_000_000 };

  it("reports progress from 0 up to 1 and saves the file", async () => {
    await loginAs("Wave Riders");
    const seen: number[] = [];
    const r = await d.uploadProposal(pdf, { onProgress: (f) => seen.push(f) });
    expect(r.ok).toBe(true);
    expect(seen.at(-1)).toBe(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  describe("with a pretend delay", () => {
    let slowStore: Store;
    let slow: ReturnType<typeof createData>;

    beforeEach(async () => {
      slowStore = new Store({ seed: generateSampleState, latencyMs: 5 });
      slow = createData(slowStore);
      const team = (await slow.listTeams()).find((t) => t.name === "Wave Riders")!;
      await slow.loginWithCode(team.code);
    });

    it("ticks more than once", async () => {
      const seen: number[] = [];
      await slow.uploadProposal(pdf, { onProgress: (f) => seen.push(f) });
      expect(seen.length).toBeGreaterThan(3);
      expect(seen.at(-1)).toBe(1);
    });

    it("aborts without saving, leaving the previous version current", async () => {
      await slow.uploadProposal(pdf);
      const controller = new AbortController();
      const upload = slow.uploadProposal(pdf, { signal: controller.signal, onProgress: (f) => f > 0.3 && controller.abort() });
      await expect(upload).rejects.toMatchObject({ name: "AbortError" });
      const team = (await slow.getCurrentTeam())!;
      expect(team.submissions.filter((s) => s.kind === "proposal")).toHaveLength(1);
      expect(team.proposal?.version).toBe(1);
    });

    it("fails with a network error if the connection drops mid-upload, saving nothing", async () => {
      const upload = slow.uploadProposal(pdf, {
        onProgress: (f) => {
          if (f > 0.3) createDev(slowStore).setSampleNetworkError(true);
        },
      });
      await expect(upload).rejects.toBeInstanceOf(NetworkError);
      createDev(slowStore).setSampleNetworkError(false);
      expect((await slow.getCurrentTeam())!.proposal).toBeNull();
    });

    it("is refused if the deadline passes while the file uploads", async () => {
      const upload = slow.uploadProposal(pdf, {
        onProgress: (f) => {
          if (f > 0.3) createDev(slowStore).setSampleStage("shortlisting");
        },
      });
      expect(await upload).toMatchObject({ ok: false, error: { code: "proposal_deadline_passed" } });
      expect((await slow.getCurrentTeam())!.proposal).toBeNull();
    });
  });
});

describe("listTeams", () => {
  it("filters by category and stage", async () => {
    expect(await d.listTeams({ category: "open" })).toHaveLength(5);
    expect(await d.listTeams({ stage: "shortlisted" })).toHaveLength(4);
    expect(await d.listTeams({ category: "school", stage: "registered" })).toHaveLength(2);
  });

  it("searches team name, code, member name, email and NIC", async () => {
    const team = await byName("Volt Voyagers");
    const member = team.members[0];
    for (const q of ["volt voy", team.code.toLowerCase(), member.fullName.toUpperCase(), member.email, member.nic!]) {
      const found = await d.listTeams({ search: q });
      expect(found.map((t) => t.id), q).toContain(team.id);
    }
    expect(await d.listTeams({ search: "zzzz-no-match" })).toHaveLength(0);
  });

  it("returns copies the screens can't use to change the store", async () => {
    const [first] = await d.listTeams();
    first.name = "Hacked";
    first.members[0].fullName = "Hacked";
    expect((await d.listTeams())[0].name).not.toBe("Hacked");
    expect((await d.listTeams())[0].members[0].fullName).not.toBe("Hacked");
  });
});

describe("sample controls", () => {
  it("moves the sample clock and shortlist state", async () => {
    dev.setSampleStage("prototype");
    dev.setSampleShortlistState("draft");
    expect(await d.getCompetitionState()).toMatchObject({ stage: "prototype", shortlistState: "draft" });
  });

  it("makes every call throw a NetworkError while the outage is on, and stops when it's off", async () => {
    dev.setSampleNetworkError(true);
    await expect(d.registerTeam(newTeam())).rejects.toBeInstanceOf(NetworkError);
    await expect(d.listTeams()).rejects.toBeInstanceOf(NetworkError);
    expect(dev.listSampleTeamLogins()).toHaveLength(20); // the switcher itself keeps working

    dev.setSampleNetworkError(false);
    expect((await d.registerTeam(newTeam())).ok).toBe(true);
    expect(await d.listTeams()).toHaveLength(21); // nothing was saved during the outage
  });

  it("clears the outage on reset", async () => {
    dev.setSampleNetworkError(true);
    dev.resetSampleData();
    expect(await d.listTeams()).toHaveLength(20);
  });

  it("resets to the 20 seeded teams", async () => {
    await d.registerTeam(newTeam());
    await loginAs("Wave Riders");
    dev.setSampleStage("over");
    dev.resetSampleData();
    expect(await d.listTeams()).toHaveLength(20);
    expect(await d.getCurrentTeam()).toBeNull();
    expect((await d.getCompetitionState()).stage).toBe("registration");
  });

  it("lists every team's code for quick login", () => {
    const logins = dev.listSampleTeamLogins();
    expect(logins).toHaveLength(20);
    expect(logins[0]).toMatchObject({ name: "Wave Riders", stage: "registered" });
  });
});

describe("persistence", () => {
  it("restores the state a previous page load saved", async () => {
    let saved: string | null = null;
    const persistence = { load: () => saved, save: (json: string) => void (saved = json) };

    const first = new Store({ seed: generateSampleState, persistence });
    const data = createData(first);
    await data.registerTeam(newTeam());

    const second = new Store({ seed: generateSampleState, persistence });
    expect(await createData(second).listTeams()).toHaveLength(21);
  });

  it("ignores saved data it can't read", () => {
    const persistence = { load: () => "{not json", save: () => undefined };
    expect(new Store({ seed: generateSampleState, persistence }).state.teams).toHaveLength(20);
  });

  it("tells subscribers about every change", async () => {
    let calls = 0;
    store.subscribe(() => calls++);
    const before = store.getVersion();
    await d.registerTeam(newTeam());
    expect(calls).toBe(1);
    expect(store.getVersion()).toBe(before + 1);
  });
});
