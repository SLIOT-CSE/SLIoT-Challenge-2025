import { deadlines } from "@/content/deadlines";
import { universities } from "@/content/universities";
import { generateTeamCode } from "@/lib/team-code";
import type { CategoryId, InstitutionType, TeamStage } from "@/lib/team-rules";
import { sampleTimeForStage } from "./clock";
import type { StoreState } from "./store";
import { sampleHash } from "./sample-auth";
import type {
  Admin,
  AdminActor,
  AdminRole,
  AuditEntry,
  Member,
  OutboxEmail,
  ShortlistFinalisation,
  Submission,
  Team,
} from "./types";

// The sample teams. Fixed seed, so the same 20 teams appear every time.
// Every name, email, NIC and number here is invented: emails end in @example.lk, NICs
// start with 2099 (not a possible birth year) and WhatsApp numbers are 070 0xx xxxx.

export const SAMPLE_SEED = 2027;

/** The organizer the sample shortlist history is attributed to, and the actor screens can use */
export const SAMPLE_SUPER_ADMIN: AdminActor = { id: 1, name: "Sample Super Admin" };

/**
 * The seeded organizer accounts. The passwords are invented and exist only in this sample
 * layer (the dev switcher and the login page show them in development); the store keeps
 * only a fake hash. Admin ids are their own numbering, separate from team ids.
 */
export const SAMPLE_ADMIN_ACCOUNTS = [
  { id: 1, username: "super", displayName: SAMPLE_SUPER_ADMIN.name, role: "super_admin", password: "sample-super-1" },
  { id: 2, username: "admin1", displayName: "Sample Admin One", role: "admin", password: "sample-admin-1" },
  { id: 3, username: "admin2", displayName: "Sample Admin Two", role: "admin", password: "sample-admin-2" },
] as const satisfies readonly { id: number; username: string; displayName: string; role: AdminRole; password: string }[];

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
    next,
    int: (max: number) => Math.floor(next() * max),
    byte: () => Math.floor(next() * 256),
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)],
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
}

// 7 School, 8 University, 5 Open; every team stage is represented (two finalists, one team that stopped at its prototype)
const PLANS: TeamPlan[] = [
  { name: "Wave Riders", category: "school", stage: "registered", members: 3 },
  { name: "Byte Fireflies", category: "school", stage: "proposal_submitted", members: 4 },
  { name: "Lanka Sensors", category: "school", stage: "shortlisted", members: 5 },
  { name: "Green Pulse", category: "school", stage: "not_shortlisted", members: 2 },
  { name: "Tiny Tinkerers", category: "school", stage: "prototype_submitted", members: 3 },
  { name: "Circuit Cubs", category: "school", stage: "registered", members: 1 },
  { name: "Smart Paddy", category: "school", stage: "proposal_submitted", members: 4 },
  { name: "Volt Voyagers", category: "university", stage: "registered", members: 4 },
  { name: "Neuron Nest", category: "university", stage: "proposal_submitted", members: 3 },
  { name: "Gridlock Breakers", category: "university", stage: "shortlisted", members: 5 },
  { name: "Aqua Alert", category: "university", stage: "shortlisted", members: 4 },
  { name: "Tea Leaf Tech", category: "university", stage: "not_shortlisted", members: 3 },
  { name: "Ohm Sweet Ohm", category: "university", stage: "finalist", members: 2 },
  { name: "Signal Sparks", category: "university", stage: "proposal_submitted", members: 4 },
  { name: "Monsoon Mesh", category: "university", stage: "registered", members: 3 },
  { name: "Island Edge", category: "open", stage: "registered", members: 5 },
  { name: "Harbour Hackers", category: "open", stage: "proposal_submitted", members: 4 },
  { name: "Coral Code", category: "open", stage: "shortlisted", members: 3 },
  { name: "Paddy Pulse", category: "open", stage: "not_shortlisted", members: 2 },
  { name: "Kite Runners", category: "open", stage: "finalist", members: 4 },
];

const SAMPLE_VIDEO_IDS = ["aqz-KE-bpKQ", "jNQXAC9IVRw", "9bZkp7q19f0", "kJQP7kiw5Fk", "M7lc1UVf-VE"];

export function generateSampleState(): StoreState {
  const rng = createRng(SAMPLE_SEED);
  const d = deadlines;
  const t = (iso: string) => Date.parse(iso);

  let id = 1;
  const nextId = () => id++;

  const teams: Team[] = [];
  const members: Member[] = [];
  const submissions: Submission[] = [];
  const outbox: OutboxEmail[] = [];
  const audit: AuditEntry[] = [];

  const finalisedAt = t(d.shortlistAnnounced) - 3600 * 1000;
  const usedCodes = new Set<string>();
  let personNumber = 0;

  PLANS.forEach((plan, i) => {
    const teamId = nextId();

    let code = generateTeamCode(rng.byte);
    while (usedCodes.has(code)) code = generateTeamCode(rng.byte);
    usedCodes.add(code);

    // Registered across the registration window, in order
    const createdAt = Math.round(
      t(d.registrationOpens) + ((i + 1) / (PLANS.length + 1)) * (t(d.registrationCloses) - t(d.registrationOpens)),
    );

    const teamSchool = plan.category === "school" ? SCHOOLS[i % SCHOOLS.length] : null;
    const teamUniversity = plan.category === "university" ? universities[(i * 3) % universities.length] : null;
    const teamInstitution = teamSchool ?? teamUniversity;

    const shortlisted =
      plan.stage === "shortlisted" || plan.stage === "prototype_submitted" || plan.stage === "finalist";
    const finalist = plan.stage === "finalist";
    const hasProposal = plan.stage !== "registered";
    // Finalists were announced the day after prototypes were due
    const finalistsAnnouncedAt = t(d.prototypeDue) + 24 * 3600 * 1000;

    teams.push({
      id: teamId,
      code,
      name: plan.name,
      category: plan.category,
      institutionName: teamInstitution,
      institutionIsOther: false,
      stage: plan.stage,
      shortlistMark: shortlisted,
      shortlistEmailedAt: shortlisted ? finalisedAt : null,
      finalistEmailedAt: finalist ? finalistsAnnouncedAt : null,
      createdAt,
      updatedAt: createdAt,
    });

    for (let position = 1; position <= plan.members; position++) {
      personNumber++;
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);

      let type: InstitutionType;
      let institution: string;
      if (plan.category === "open") {
        // alternate university and school students
        type = position % 2 === 1 ? "university" : "school";
        institution =
          type === "university"
            ? universities[(i * 5 + position) % universities.length]
            : SCHOOLS[(i + position) % SCHOOLS.length];
      } else {
        type = plan.category;
        institution = teamInstitution as string;
      }

      const n = String(personNumber).padStart(3, "0");
      members.push({
        id: nextId(),
        teamId,
        position,
        fullName: `${first} ${last}`,
        whatsapp: `+94700${String(personNumber).padStart(6, "0")}`,
        email: `${first}.${last}.${n}@example.lk`.toLowerCase(),
        institutionType: type,
        institutionName: institution,
        institutionIsOther: false,
        nic: type === "university" ? `2099${String(personNumber).padStart(8, "0")}` : null,
      });
    }

    const leader = members.find((m) => m.teamId === teamId && m.position === 1)!;

    audit.push({
      id: nextId(),
      actorType: "anonymous",
      actorId: null,
      action: "team.registered",
      targetType: "team",
      targetId: String(teamId),
      details: { code },
      createdAt,
    });
    outbox.push({
      id: nextId(),
      teamId,
      toEmail: leader.email,
      template: "registration_confirmed",
      props: { code, teamName: plan.name },
      status: "sent",
      createdAt,
    });

    if (hasProposal) {
      // Every third team replaced its proposal once
      const versions = i % 3 === 0 ? 2 : 1;
      for (let v = 1; v <= versions; v++) {
        const at = Math.round(
          t(d.registrationCloses) + (((i * 37 + v * 11) % 100) / 100) * 0.8 * (t(d.proposalDue) - t(d.registrationCloses)),
        );
        submissions.push({
          id: nextId(),
          teamId,
          kind: "proposal",
          version: v,
          isCurrent: v === versions,
          submittedAt: Math.max(at, createdAt),
          fileName: `${code} – ${plan.name} – v${v}.pdf`,
          sizeBytes: 400_000 + rng.int(4_000_000),
          driveUrl: `https://drive.google.com/sample/${code}-v${v}`,
          youtubeId: null,
          youtubeUrl: null,
        });
      }
      outbox.push({
        id: nextId(),
        teamId,
        toEmail: leader.email,
        template: "proposal_received",
        props: { teamName: plan.name },
        status: "sent",
        createdAt: createdAt + 1000,
      });
    }

    if (plan.stage === "prototype_submitted" || finalist) {
      const videoId = SAMPLE_VIDEO_IDS[i % SAMPLE_VIDEO_IDS.length];
      submissions.push({
        id: nextId(),
        teamId,
        kind: "prototype",
        version: 1,
        isCurrent: true,
        submittedAt: Math.round(t(d.shortlistAnnounced) + (0.4 + (i % 5) / 10) * (t(d.prototypeDue) - t(d.shortlistAnnounced))),
        fileName: null,
        sizeBytes: null,
        driveUrl: null,
        youtubeId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    if (shortlisted) {
      outbox.push({
        id: nextId(),
        teamId,
        toEmail: leader.email,
        template: "shortlisted",
        props: { teamName: plan.name },
        status: "sent",
        createdAt: finalisedAt,
      });
    }

    if (finalist) {
      outbox.push({
        id: nextId(),
        teamId,
        toEmail: leader.email,
        template: "finalist",
        props: { teamName: plan.name },
        status: "sent",
        createdAt: finalistsAnnouncedAt,
      });
    }
  });

  const shortlistedIds = teams.filter((x) => x.shortlistMark).map((x) => x.id);
  const finalisation: ShortlistFinalisation = {
    id: nextId(),
    finalisedBy: SAMPLE_SUPER_ADMIN.id,
    finalisedByName: SAMPLE_SUPER_ADMIN.name,
    finalisedAt,
    shortlistedCount: shortlistedIds.length,
    newlyEmailedCount: shortlistedIds.length,
    teamIds: shortlistedIds,
  };
  audit.push({
    id: nextId(),
    actorType: "admin",
    actorId: SAMPLE_SUPER_ADMIN.id,
    action: "shortlist.finalised",
    targetType: "setting",
    targetId: "shortlist_state",
    details: { shortlistedCount: shortlistedIds.length },
    createdAt: finalisedAt,
  });
  const finalistIds = teams.filter((x) => x.stage === "finalist").map((x) => x.id);
  audit.push({
    id: nextId(),
    actorType: "admin",
    actorId: SAMPLE_SUPER_ADMIN.id,
    action: "finalists.announced",
    targetType: "team",
    targetId: finalistIds.join(","),
    details: { count: finalistIds.length, newlyEmailedCount: finalistIds.length },
    createdAt: t(d.prototypeDue) + 24 * 3600 * 1000,
  });
  audit.sort((a, b) => a.createdAt - b.createdAt);

  const admins: Admin[] = SAMPLE_ADMIN_ACCOUNTS.map((a, i) => ({
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    role: a.role,
    disabled: false,
    passwordHash: sampleHash(a.password),
    // Accounts were made before registration opened; the super admin logged in most recently
    createdAt: t(d.registrationOpens) - (10 - i) * 24 * 3600 * 1000,
    lastLoginAt: i === 0 ? t(d.prototypeDue) + 25 * 3600 * 1000 : null,
  }));

  return {
    schemaVersion: 3,
    nextId: id,
    teams,
    admins,
    members,
    submissions,
    settings: {
      // Registration is open, so /register works straight away. Change it from the switcher.
      now: sampleTimeForStage("registration", d),
      shortlistState: "finalised",
      deadlines: { ...d },
      lastSheetExportAt: null,
    },
    finalisations: [finalisation],
    outbox,
    audit,
    session: null,
    adminSession: null,
  };
}
