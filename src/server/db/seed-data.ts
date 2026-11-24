import { deadlines } from "@/content/deadlines";
import { universities } from "@/content/universities";
import { generateTeamCode } from "@/lib/team-code";
import type { CategoryId, InstitutionType, TeamStage } from "@/lib/team-rules";
import type * as schema from "./schema";

// The development test data that `pnpm db:seed` writes. Fixed seed, so every run gives the
// same 20 teams, codes and logins. Pure: no database access here, so it can be unit tested.
//
// Scenario: the prototype round. Registration and proposals are closed, the shortlist was
// finalised, and prototypes are due in four days by the dev clock (`dev_now` setting).
//
// Every name, email, NIC and number is invented: emails end in @example.lk, NICs start with
// 2099 (not a possible birth year), WhatsApp numbers are +94 700 xxx xxx. No seeded email is
// left pending, so a real SMTP setup never sends to these addresses.

export const SEED = 2027;
const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;
const SEED_IP = "127.0.0.1";

/**
 * Organizer logins for development. Not secrets: they only exist in seeded dev databases,
 * and the seed script refuses to run in production. Hashed with argon2id by the script.
 */
export const SEED_ADMIN_LOGINS = [
  { id: 1, username: "super", displayName: "Sample Super Admin", role: "super_admin", password: "sample-super-1" },
  { id: 2, username: "admin1", displayName: "Sample Admin One", role: "admin", password: "sample-admin-1" },
  { id: 3, username: "admin2", displayName: "Sample Admin Two", role: "admin", password: "sample-admin-2" },
] as const;

type Insert<T extends { $inferInsert: unknown }> = T["$inferInsert"];

export interface SeedData {
  teams: Insert<typeof schema.teams>[];
  members: Insert<typeof schema.members>[];
  submissions: Insert<typeof schema.submissions>[];
  /** Without password hashes; the script adds them */
  admins: (Omit<Insert<typeof schema.admins>, "passwordHash"> & { password: string })[];
  settings: Insert<typeof schema.settings>[];
  shortlistFinalisations: Insert<typeof schema.shortlistFinalisations>[];
  emailOutbox: Insert<typeof schema.emailOutbox>[];
  auditLog: Insert<typeof schema.auditLog>[];
  /** The dev clock the seed sets: four days before prototypes are due */
  devNow: number;
}

/** mulberry32: a small seeded random number generator */
function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (max: number) => Math.floor(next() * max),
    byte: () => Math.floor(next() * 256),
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    hex: (length: number) => Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join(""),
  };
}

const FIRST_NAMES = [
  "Nimal", "Kasun", "Dilini", "Thilini", "Sahan", "Ishara", "Chamara", "Nethmi", "Ravindu", "Amaya",
  "Tharindu", "Sachini", "Kavindu", "Hansika", "Dinuka", "Janani", "Arun", "Priya", "Kumaran", "Anjali",
  "Sivaram", "Nirmala", "Farhan", "Ayesha", "Rizwan", "Fathima", "Hashan", "Malsha", "Dulani", "Pasindu",
];

const LAST_NAMES = [
  "Perera", "Fernando", "Silva", "Jayasinghe", "Wickramasinghe", "Bandara", "Gunawardena", "Herath",
  "Karunaratne", "Ranasinghe", "Kumar", "Selvarajah", "Rajendran", "Nadarajah", "Mohamed", "Hussain",
  "Ismail", "Abeysekara", "Liyanage", "Amarasinghe",
];

const SCHOOLS = [
  "Central College, Kandy",
  "Model Vidyalaya, Galle",
  "Maha Vidyalaya, Kurunegala",
  "Girls' College, Matara",
  "Hindu College, Jaffna",
  "Muslim Maha Vidyalaya, Colombo",
  "National School, Anuradhapura",
  "Boys' High School, Badulla",
];

interface TeamPlan {
  name: string;
  category: CategoryId;
  stage: TeamStage;
  members: number;
  /** Not-shortlisted teams that never uploaded a proposal */
  noProposal?: boolean;
  /** Proposal versions uploaded (default 1) */
  proposalVersions?: number;
  /** A university typed in with "Other" */
  otherUniversity?: string;
}

// 7 School, 8 University, 5 Open. After the shortlist was finalised every unticked team is
// `not_shortlisted`, including the three that never sent a proposal.
// 10 not shortlisted (3 without a proposal), 6 shortlisted, 4 with a prototype.
const PLANS: TeamPlan[] = [
  { name: "Wave Riders", category: "school", stage: "not_shortlisted", members: 3, noProposal: true },
  { name: "Byte Fireflies", category: "school", stage: "not_shortlisted", members: 4, proposalVersions: 2 },
  { name: "Lanka Sensors", category: "school", stage: "shortlisted", members: 5 },
  { name: "Green Pulse", category: "school", stage: "not_shortlisted", members: 2 },
  { name: "Tiny Tinkerers", category: "school", stage: "prototype_submitted", members: 3, proposalVersions: 2 },
  { name: "Circuit Cubs", category: "school", stage: "shortlisted", members: 1 },
  { name: "Smart Paddy", category: "school", stage: "not_shortlisted", members: 4 },
  { name: "Volt Voyagers", category: "university", stage: "not_shortlisted", members: 4, noProposal: true },
  { name: "Neuron Nest", category: "university", stage: "not_shortlisted", members: 3, proposalVersions: 3 },
  { name: "Gridlock Breakers", category: "university", stage: "shortlisted", members: 5 },
  { name: "Aqua Alert", category: "university", stage: "prototype_submitted", members: 4 },
  { name: "Tea Leaf Tech", category: "university", stage: "not_shortlisted", members: 3 },
  { name: "Ohm Sweet Ohm", category: "university", stage: "prototype_submitted", members: 2, proposalVersions: 2 },
  { name: "Signal Sparks", category: "university", stage: "shortlisted", members: 4, otherUniversity: "Institute of Applied Robotics, Kandy" },
  { name: "Monsoon Mesh", category: "university", stage: "not_shortlisted", members: 3 },
  { name: "Island Edge", category: "open", stage: "not_shortlisted", members: 5, noProposal: true },
  { name: "Harbour Hackers", category: "open", stage: "shortlisted", members: 4 },
  { name: "Coral Code", category: "open", stage: "shortlisted", members: 3, proposalVersions: 2 },
  { name: "Paddy Pulse", category: "open", stage: "not_shortlisted", members: 2 },
  { name: "Kite Runners", category: "open", stage: "prototype_submitted", members: 4 },
];

const VIDEO_IDS = ["aqz-KE-bpKQ", "jNQXAC9IVRw", "9bZkp7q19f0", "kJQP7kiw5Fk", "M7lc1UVf-VE"];

export function buildSeedData(): SeedData {
  const rng = createRng(SEED);
  const t = (iso: string) => Date.parse(iso);
  const d = deadlines;

  const registrationOpens = t(d.registrationOpens);
  const registrationCloses = t(d.registrationCloses);
  const proposalDue = t(d.proposalDue);
  const prototypeDue = t(d.prototypeDue);
  const finalisedAt = t(d.shortlistAnnounced) - HOUR;
  const devNow = prototypeDue - 4 * DAY;
  const superAdmin = SEED_ADMIN_LOGINS[0];

  const data: SeedData = {
    teams: [],
    members: [],
    submissions: [],
    admins: [],
    settings: [],
    shortlistFinalisations: [],
    emailOutbox: [],
    auditLog: [],
    devNow,
  };

  const audit = (row: Omit<Insert<typeof schema.auditLog>, "ip"> & { ip?: string | null }) =>
    data.auditLog.push({ ip: null, ...row });
  const email = (
    teamId: number,
    toEmail: string,
    template: Insert<typeof schema.emailOutbox>["template"],
    props: Record<string, string>,
    at: number,
  ) =>
    data.emailOutbox.push({
      teamId,
      toEmail,
      template,
      props,
      status: "sent",
      attempts: 1,
      nextAttemptAt: at,
      createdAt: at,
      sentAt: at + 5000,
    });

  // Organizer accounts, made before registration opened
  SEED_ADMIN_LOGINS.forEach((a, i) => {
    data.admins.push({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      role: a.role,
      password: a.password,
      disabled: false,
      createdAt: registrationOpens - (10 - i) * DAY,
      lastLoginAt: i === 0 ? devNow - 2 * HOUR : i === 1 ? devNow - 3 * DAY : null,
    });
  });

  const usedCodes = new Set<string>();
  let personNumber = 0;

  PLANS.forEach((plan, i) => {
    const teamId = i + 1;
    let code = generateTeamCode(rng.byte);
    while (usedCodes.has(code)) code = generateTeamCode(rng.byte);
    usedCodes.add(code);

    // Registered across the registration window, in order
    const createdAt = Math.round(registrationOpens + ((i + 1) / (PLANS.length + 1)) * (registrationCloses - registrationOpens));
    const shortlisted = plan.stage === "shortlisted" || plan.stage === "prototype_submitted";

    const teamInstitution =
      plan.category === "school"
        ? SCHOOLS[i % SCHOOLS.length]
        : plan.category === "university"
          ? (plan.otherUniversity ?? universities[(i * 3) % universities.length])
          : null;

    data.teams.push({
      id: teamId,
      code,
      name: plan.name,
      category: plan.category,
      institutionName: teamInstitution,
      institutionIsOther: plan.otherUniversity !== undefined,
      stage: plan.stage,
      shortlistMark: shortlisted,
      shortlistEmailedAt: shortlisted ? finalisedAt : null,
      finalistEmailedAt: null,
      createdAt,
      updatedAt: finalisedAt,
    });

    let leaderEmail = "";
    for (let position = 1; position <= plan.members; position++) {
      personNumber++;
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);

      let type: InstitutionType;
      let institution: string;
      let isOther = false;
      if (plan.category === "open") {
        // Open teams mix university and school students
        type = position % 2 === 1 ? "university" : "school";
        institution =
          type === "university" ? universities[(i * 5 + position) % universities.length] : SCHOOLS[(i + position) % SCHOOLS.length];
      } else {
        type = plan.category;
        institution = teamInstitution as string;
        isOther = plan.otherUniversity !== undefined;
      }

      const n = String(personNumber).padStart(3, "0");
      const memberEmail = `${first}.${last}.${n}@example.lk`.toLowerCase();
      if (position === 1) leaderEmail = memberEmail;
      data.members.push({
        teamId,
        position,
        fullName: `${first} ${last}`,
        whatsapp: `+94700${String(personNumber).padStart(6, "0")}`,
        email: memberEmail,
        institutionType: type,
        institutionName: institution,
        institutionIsOther: isOther,
        nic: type === "university" ? `2099${String(personNumber).padStart(8, "0")}` : null,
      });
    }

    audit({ actorType: "anonymous", actorId: null, action: "team.registered", targetType: "team", targetId: String(teamId), details: { code }, ip: SEED_IP, createdAt });
    email(teamId, leaderEmail, "registration_confirmed", { code, teamName: plan.name }, createdAt);

    if (!plan.noProposal) {
      const versions = plan.proposalVersions ?? 1;
      for (let v = 1; v <= versions; v++) {
        // Spread across the proposal window, later versions later
        const at = Math.max(
          createdAt + HOUR,
          Math.round(registrationCloses + ((v + (i % 4)) / (versions + 5)) * (proposalDue - registrationCloses)),
        );
        const driveFileId = `seed${rng.hex(28)}`;
        data.submissions.push({
          teamId,
          kind: "proposal",
          version: v,
          isCurrent: v === versions,
          driveFileId,
          driveUrl: `https://drive.google.com/file/d/${driveFileId}/view`,
          fileName: `${code} – ${plan.name} – v${v}.pdf`,
          sizeBytes: 400_000 + rng.int(4_000_000),
          sha256: rng.hex(64),
          submittedAt: at,
          submittedIp: SEED_IP,
        });
        audit({ actorType: "team", actorId: teamId, action: "proposal.uploaded", targetType: "team", targetId: String(teamId), details: { version: v }, ip: SEED_IP, createdAt: at });
        email(teamId, leaderEmail, "proposal_received", { teamName: plan.name }, at);
      }
    }

    if (shortlisted) email(teamId, leaderEmail, "shortlisted", { teamName: plan.name }, finalisedAt);

    if (plan.stage === "prototype_submitted") {
      const videoId = VIDEO_IDS[i % VIDEO_IDS.length];
      const at = finalisedAt + (5 + i) * DAY;
      data.submissions.push({
        teamId,
        kind: "prototype",
        version: 1,
        isCurrent: true,
        youtubeId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        submittedAt: at,
        submittedIp: SEED_IP,
      });
      audit({ actorType: "team", actorId: teamId, action: "prototype.submitted", targetType: "team", targetId: String(teamId), details: { version: 1 }, ip: SEED_IP, createdAt: at });
      email(teamId, leaderEmail, "prototype_received", { teamName: plan.name }, at);
    }
  });

  // The shortlist: ticked over two sittings, then finalised once
  const shortlistedIds = data.teams.filter((x) => x.shortlistMark).map((x) => x.id as number);
  const firstBatch = shortlistedIds.slice(0, 6);
  const secondBatch = shortlistedIds.slice(6);
  audit({ actorType: "admin", actorId: superAdmin.id, action: "shortlist.marked", targetType: "team", targetId: firstBatch.join(","), details: { marked: true, count: firstBatch.length }, createdAt: finalisedAt - 3 * DAY });
  audit({ actorType: "admin", actorId: superAdmin.id, action: "shortlist.marked", targetType: "team", targetId: secondBatch.join(","), details: { marked: true, count: secondBatch.length }, createdAt: finalisedAt - 2 * DAY });
  data.shortlistFinalisations.push({
    finalisedBy: superAdmin.id,
    finalisedAt,
    shortlistedCount: shortlistedIds.length,
    newlyEmailedCount: shortlistedIds.length,
    teamIds: shortlistedIds,
  });
  audit({
    actorType: "admin",
    actorId: superAdmin.id,
    action: "shortlist.finalised",
    targetType: "setting",
    targetId: "shortlist_state",
    details: { shortlistedCount: shortlistedIds.length, newlyEmailedCount: shortlistedIds.length },
    createdAt: finalisedAt,
  });

  // A little organizer activity for the audit log
  audit({ actorType: "admin", actorId: 2, action: "admin.login", targetType: "admin", targetId: "2", ip: SEED_IP, createdAt: devNow - 3 * DAY });
  audit({ actorType: "admin", actorId: 2, action: "export.csv", details: { rows: data.teams.length }, ip: SEED_IP, createdAt: devNow - 3 * DAY + 10 * 60 * 1000 });
  audit({ actorType: "anonymous", actorId: null, action: "admin.login_failed", details: { username: "admin2" }, ip: SEED_IP, createdAt: devNow - DAY });
  audit({ actorType: "admin", actorId: superAdmin.id, action: "admin.login", targetType: "admin", targetId: "1", ip: SEED_IP, createdAt: devNow - 2 * HOUR });

  // One email that gave up, so the dashboard shows a failure. Never retried (attempts at the limit)
  const reminderTeam = data.teams[3];
  const reminderTo = data.members.find((m) => m.teamId === reminderTeam.id && m.position === 1)!.email;
  data.emailOutbox.push({
    teamId: reminderTeam.id,
    toEmail: reminderTo,
    template: "code_reminder",
    props: { code: reminderTeam.code, teamName: reminderTeam.name },
    status: "failed",
    attempts: 6,
    nextAttemptAt: devNow - DAY,
    lastError: "550 5.1.1 The email account that you tried to reach does not exist (seeded example)",
    createdAt: devNow - 2 * DAY,
    sentAt: null,
  });
  audit({ actorType: "anonymous", actorId: null, action: "team.code_reminder_requested", targetType: "team", targetId: String(reminderTeam.id), ip: SEED_IP, createdAt: devNow - 2 * DAY });

  // Settings (architecture section 5): JSON values, times as Unix ms
  const setting = (key: string, value: unknown, updatedBy: number | null, updatedAt: number) =>
    data.settings.push({ key, value: JSON.stringify(value), updatedBy, updatedAt });
  setting("registration_closes_at", registrationCloses, superAdmin.id, registrationOpens - 10 * DAY);
  setting("proposal_due_at", proposalDue, superAdmin.id, registrationOpens - 10 * DAY);
  setting("prototype_due_at", prototypeDue, superAdmin.id, registrationOpens - 10 * DAY);
  setting("shortlist_state", "finalised", superAdmin.id, finalisedAt);
  setting("last_sheet_export_at", null, null, registrationOpens - 10 * DAY);
  // Development only: the moment the app treats as "now". Ignored in production
  setting("dev_now", devNow, null, devNow);

  data.auditLog.sort((a, b) => a.createdAt - b.createdAt);
  data.emailOutbox.sort((a, b) => a.createdAt - b.createdAt);
  return data;
}

/** Team codes for the dev switcher's quick login, in team order */
export function seedTeamLogins(data: SeedData) {
  return data.teams.map((team) => ({ code: team.code, name: team.name, stage: team.stage as TeamStage }));
}
