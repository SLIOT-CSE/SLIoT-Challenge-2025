import { describe, expect, it } from "vitest";
import { registrationInputSchema } from "@/lib/schemas";
import {
  addMember,
  asksNic,
  changeCategory,
  emptyMember,
  emptyValues,
  errorsForStep,
  firstStepWithError,
  removeMember,
  serverErrors,
  shiftMemberPaths,
  stepOfPath,
  stepsFor,
  toInput,
  validate,
  type FormValues,
} from "./form";

const filledMember = (n: number, over: Partial<ReturnType<typeof emptyMember>> = {}) => ({
  ...emptyMember(),
  fullName: `Member ${n} Name`,
  whatsapp: `077 123 456${n}`,
  email: `member${n}@example.lk`,
  ...over,
});

const school = (): FormValues => ({
  ...emptyValues("school"),
  name: "Wave Riders",
  institutionName: "Central College, Kandy",
  members: [filledMember(1), filledMember(2)],
});

describe("stepsFor", () => {
  it("skips Institution for Open teams only", () => {
    expect(stepsFor("open")).toEqual(["team", "members", "review"]);
    expect(stepsFor("school")).toEqual(["team", "institution", "members", "review"]);
    expect(stepsFor("university")).toEqual(["team", "institution", "members", "review"]);
    expect(stepsFor("")).toEqual(["team", "institution", "members", "review"]);
  });
});

describe("stepOfPath", () => {
  it.each([
    ["name", "team"],
    ["category", "team"],
    ["institutionName", "institution"],
    ["members", "members"],
    ["members.2.nic", "members"],
  ])("puts %s in %s", (path, step) => {
    expect(stepOfPath(path)).toBe(step);
  });
});

describe("validate", () => {
  it("is empty for a valid school team", () => {
    expect(validate(school())).toEqual({});
  });

  it("says what is missing on an empty form, in plain words", () => {
    const errors = validate(emptyValues());
    expect(errors).toMatchObject({
      name: "Team name is required",
      category: "Choose a category",
      "members.0.fullName": "Full name is required",
      "members.0.whatsapp": "WhatsApp number is required",
      "members.0.email": "Email is required",
    });
  });

  it("shows the institution error even while members are still empty", () => {
    // zod alone would skip this rule until every field was valid
    const v = { ...emptyValues("school"), name: "Wave Riders" };
    expect(validate(v).institutionName).toBe("Enter the school name");
    expect(errorsForStep(validate(v), "institution")).toEqual({ institutionName: "Enter the school name" });
    expect(errorsForStep(validate(v), "team")).toEqual({});
  });

  it("asks for a NIC from university students next to other member errors", () => {
    const v: FormValues = {
      ...emptyValues("university"),
      name: "Volt",
      institutionName: "University of Moratuwa",
      members: [filledMember(1, { whatsapp: "bad" })],
    };
    const errors = validate(v);
    expect(errors["members.0.whatsapp"]).toMatch(/Sri Lankan mobile/);
    expect(errors["members.0.nic"]).toBe("NIC is required for university students");
  });

  it("needs a type and name per Open member, and a NIC from university students", () => {
    const v: FormValues = {
      ...emptyValues("open"),
      name: "Island Edge",
      members: [
        filledMember(1),
        filledMember(2, { institutionType: "university", institutionName: "SLIIT" }),
        filledMember(3, { institutionType: "school", institutionName: "" }),
      ],
    };
    const errors = validate(v);
    expect(errors["members.0.institutionType"]).toBe("Choose School or University");
    expect(errors["members.1.nic"]).toBe("NIC is required for university students");
    expect(errors["members.2.institutionName"]).toBe("Enter the school name");
    expect(errors.institutionName).toBeUndefined(); // Open teams have no shared institution
  });

  it("flags repeats inside the form on the later member", () => {
    const v = { ...school(), members: [filledMember(1), filledMember(2, { email: "MEMBER1@example.lk" })] };
    expect(validate(v)).toEqual({ "members.1.email": "Same email as member 1" });
  });

  it("asks for the name, not a choice, when Other is picked with no name typed", () => {
    const v: FormValues = {
      ...emptyValues("university"),
      name: "Volt",
      institutionName: "",
      institutionIsOther: true,
      members: [filledMember(1, { nic: "200012345678" })],
    };
    expect(validate(v).institutionName).toBe("Enter the university name");
  });

  it("accepts a university chosen with Other", () => {
    const v: FormValues = {
      ...emptyValues("university"),
      name: "Volt",
      institutionName: "Some New Campus",
      institutionIsOther: true,
      members: [filledMember(1, { nic: "200012345678" })],
    };
    expect(validate(v)).toEqual({});
  });
});

describe("toInput", () => {
  it("leaves out what the category doesn't use, so stale values can't cause errors", () => {
    const v: FormValues = {
      ...school(),
      members: [filledMember(1, { institutionType: "university", institutionName: "SLIIT", institutionIsOther: true })],
    };
    const input = toInput(v);
    expect(input.members[0]).toMatchObject({ institutionType: undefined, institutionName: undefined });
  });

  it("produces something the schema accepts for every category", () => {
    const uni: FormValues = {
      ...emptyValues("university"),
      name: "Volt",
      institutionName: "University of Colombo",
      members: [filledMember(1, { nic: "123456789v" })],
    };
    const open: FormValues = {
      ...emptyValues("open"),
      name: "Island Edge",
      members: [
        filledMember(1, { institutionType: "school", institutionName: "Central College, Kandy" }),
        filledMember(2, { institutionType: "university", institutionName: "SLIIT", nic: "200012345678" }),
      ],
    };
    for (const v of [school(), uni, open]) {
      expect(registrationInputSchema.safeParse(toInput(v)).success).toBe(true);
    }
  });
});

describe("asksNic", () => {
  it("is for university students in any category", () => {
    expect(asksNic("school", emptyMember())).toBe(false);
    expect(asksNic("university", emptyMember())).toBe(true);
    expect(asksNic("open", emptyMember())).toBe(false);
    expect(asksNic("open", { ...emptyMember(), institutionType: "university" })).toBe(true);
    expect(asksNic("open", { ...emptyMember(), institutionType: "school" })).toBe(false);
  });
});

describe("changeCategory", () => {
  it("keeps names and contacts but clears institutions", () => {
    const v: FormValues = {
      ...school(),
      members: [filledMember(1, { nic: "200012345678", institutionType: "school", institutionName: "X" })],
    };
    const next = changeCategory(v, "university");
    expect(next.category).toBe("university");
    expect(next.institutionName).toBe("");
    expect(next.name).toBe("Wave Riders");
    expect(next.members[0]).toMatchObject({
      fullName: "Member 1 Name",
      email: "member1@example.lk",
      nic: "200012345678",
      institutionType: "",
      institutionName: "",
    });
  });

  it("does nothing when the category is the same", () => {
    const v = school();
    expect(changeCategory(v, "school")).toBe(v);
  });
});

describe("members", () => {
  it("adds up to 5 and never removes the leader", () => {
    let v = emptyValues("school");
    for (let i = 0; i < 6; i++) v = addMember(v);
    expect(v.members).toHaveLength(5);
    expect(removeMember(v, 0)).toBe(v);
    expect(removeMember(v, 4).members).toHaveLength(4);
    expect(removeMember(v, 9)).toBe(v);
  });

  it("moves error keys so messages stay with the right card", () => {
    const errors = {
      name: "x",
      "members.1.email": "one",
      "members.2.email": "two",
      "members.3.nic": "three",
    };
    expect(shiftMemberPaths(errors, 1)).toEqual({
      name: "x",
      "members.1.email": "two",
      "members.2.nic": "three",
    });
  });
});

describe("serverErrors", () => {
  it("turns issues into field errors", () => {
    expect(
      serverErrors({
        code: "invalid_input",
        message: "",
        issues: [
          { path: "members.0.email", message: "Enter a valid email address" },
          { path: "members.0.email", message: "ignored second" },
        ],
      }),
    ).toEqual({ "members.0.email": "Enter a valid email address" });
  });

  it("points each conflict at the member and field to fix, without naming a team", () => {
    const errors = serverErrors({
      code: "duplicate_member",
      message: "",
      conflicts: [
        { field: "email", memberPosition: 2 },
        { field: "nic", memberPosition: 3 },
      ],
    });
    expect(Object.keys(errors)).toEqual(["members.1.email", "members.2.nic"]);
    expect(errors["members.1.email"]).toMatch(/already registered/);
  });

  it("picks the earliest step with an error, in the category's order", () => {
    expect(firstStepWithError({ "members.0.email": "x", name: "y" }, "school")).toBe("team");
    expect(firstStepWithError({ "members.0.email": "x" }, "open")).toBe("members");
    expect(firstStepWithError({}, "open")).toBeNull();
  });
});
