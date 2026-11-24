import { describe, expect, it } from "vitest";
import {
  hasPdfHeader,
  normaliseNic,
  normaliseWhatsapp,
  parseYoutubeId,
  prototypeLinkSchema,
  proposalFileSchema,
  registrationInputSchema,
  type RegistrationInput,
} from "@/lib/schemas";

const member = (n: number, extra: Record<string, unknown> = {}) => ({
  fullName: `Member ${n} Name`,
  whatsapp: `077 123 456${n}`,
  email: `Member${n}@Example.lk`,
  ...extra,
});

const uniMember = (n: number, extra: Record<string, unknown> = {}) =>
  member(n, { nic: `20000123456${n}`, ...extra });

function team(over: Record<string, unknown>): RegistrationInput {
  return {
    name: "Test Team",
    category: "school",
    institutionName: "Royal College",
    members: [member(1)],
    ...over,
  } as RegistrationInput;
}

function issuePaths(input: RegistrationInput): string[] {
  const r = registrationInputSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
}

describe("normaliseWhatsapp", () => {
  it.each([
    ["077 123 4567", "+94771234567"],
    ["0771234567", "+94771234567"],
    ["+94 77 123 4567", "+94771234567"],
    ["+94-77-123-4567", "+94771234567"],
    ["(071) 234 5678", "+94712345678"],
  ])("accepts %s", (raw, expected) => {
    expect(normaliseWhatsapp(raw)).toBe(expected);
  });

  it.each(["011 234 5678", "077 123 456", "0771234567890", "+1 555 123 4567", "abc", ""])(
    "rejects %s",
    (raw) => {
      expect(normaliseWhatsapp(raw)).toBeNull();
    },
  );
});

describe("normaliseNic", () => {
  it("accepts the old format and upper-cases it", () => {
    expect(normaliseNic("123456789v")).toBe("123456789V");
    expect(normaliseNic("123456789X")).toBe("123456789X");
  });

  it("accepts the 12-digit format", () => {
    expect(normaliseNic("200012345678")).toBe("200012345678");
  });

  it.each(["12345678V", "1234567890V", "12345678901", "1234567890123", "abcdefghiV", ""])(
    "rejects %s",
    (raw) => {
      expect(normaliseNic(raw)).toBeNull();
    },
  );
});

describe("registrationInputSchema", () => {
  it("accepts a school team and fills the institution on every member", () => {
    const r = registrationInputSchema.parse(team({ members: [member(1), member(2)] }));
    expect(r.institutionName).toBe("Royal College");
    expect(r.members.map((m) => m.position)).toEqual([1, 2]);
    expect(r.members.every((m) => m.institutionType === "school" && m.institutionName === "Royal College")).toBe(true);
  });

  it("normalises the email and WhatsApp number", () => {
    const r = registrationInputSchema.parse(team({}));
    expect(r.members[0].email).toBe("member1@example.lk");
    expect(r.members[0].whatsapp).toBe("+94771234561");
  });

  it("drops a NIC sent for a school student", () => {
    const r = registrationInputSchema.parse(team({ members: [member(1, { nic: "200012345678" })] }));
    expect(r.members[0].nic).toBeNull();
  });

  it("requires the school name", () => {
    expect(issuePaths(team({ institutionName: "" }))).toContain("institutionName");
  });

  it("rejects 0 members and more than 5", () => {
    expect(issuePaths(team({ members: [] }))).toContain("members");
    const six = [1, 2, 3, 4, 5, 6].map((n) => member(n));
    expect(issuePaths(team({ members: six }))).toContain("members");
  });

  it("accepts exactly 5 members", () => {
    const five = [1, 2, 3, 4, 5].map((n) => member(n));
    expect(registrationInputSchema.safeParse(team({ members: five })).success).toBe(true);
  });

  describe("university team", () => {
    const uni = (over: Record<string, unknown> = {}) =>
      team({
        category: "university",
        institutionName: "University of Moratuwa",
        members: [uniMember(1), uniMember(2)],
        ...over,
      });

    it("accepts a university from the list", () => {
      const r = registrationInputSchema.parse(uni());
      expect(r.members.every((m) => m.institutionType === "university" && m.nic !== null)).toBe(true);
    });

    it("requires a NIC from every member", () => {
      expect(issuePaths(uni({ members: [uniMember(1), member(2)] }))).toEqual(["members.1.nic"]);
    });

    it("rejects a malformed NIC", () => {
      expect(issuePaths(uni({ members: [uniMember(1, { nic: "12345" })] }))).toEqual(["members.0.nic"]);
    });

    it("rejects a university not in the list unless it is marked Other", () => {
      expect(issuePaths(uni({ institutionName: "Some Campus" }))).toContain("institutionName");
      const other = registrationInputSchema.parse(uni({ institutionName: "Some Campus", institutionIsOther: true }));
      expect(other.institutionIsOther).toBe(true);
      expect(other.members[0].institutionIsOther).toBe(true);
    });
  });

  describe("open team", () => {
    it("lets members mix school and university", () => {
      const r = registrationInputSchema.parse(
        team({
          category: "open",
          institutionName: undefined,
          members: [
            uniMember(1, { institutionType: "university", institutionName: "SLIIT" }),
            member(2, { institutionType: "school", institutionName: "Ananda College" }),
          ],
        }),
      );
      expect(r.institutionName).toBeNull();
      expect(r.members.map((m) => m.institutionType)).toEqual(["university", "school"]);
      expect(r.members[0].nic).toBe("200001234561");
      expect(r.members[1].nic).toBeNull();
    });

    it("needs a type and a name per member, and a NIC for university students", () => {
      const paths = issuePaths(
        team({
          category: "open",
          members: [member(1), member(2, { institutionType: "university", institutionName: "SLIIT" })],
        }),
      );
      expect(paths).toContain("members.0.institutionType");
      expect(paths).toContain("members.1.nic");
    });
  });

  it("flags a repeated email or NIC inside the form, on the later member", () => {
    expect(issuePaths(team({ members: [member(1), member(2, { email: "MEMBER1@example.lk" })] }))).toEqual([
      "members.1.email",
    ]);

    const dupNic = team({
      category: "university",
      institutionName: "University of Colombo",
      members: [uniMember(1), uniMember(2, { nic: "200001234561" })],
    });
    expect(issuePaths(dupNic)).toEqual(["members.1.nic"]);
  });
});

describe("proposalFileSchema", () => {
  it("accepts a PDF under 10 MB", () => {
    expect(proposalFileSchema.safeParse({ fileName: "plan.PDF", sizeBytes: 2_000_000 }).success).toBe(true);
  });

  it("rejects other types, empty files and files over 10 MB", () => {
    expect(proposalFileSchema.safeParse({ fileName: "plan.docx", sizeBytes: 1000 }).success).toBe(false);
    expect(proposalFileSchema.safeParse({ fileName: "plan.pdf", sizeBytes: 0 }).success).toBe(false);
    expect(proposalFileSchema.safeParse({ fileName: "plan.pdf", sizeBytes: 10 * 1024 * 1024 + 1 }).success).toBe(false);
  });
});

describe("hasPdfHeader", () => {
  it("checks for %PDF-", () => {
    expect(hasPdfHeader(new TextEncoder().encode("%PDF-1.7\n..."))).toBe(true);
    expect(hasPdfHeader(new TextEncoder().encode("PK\u0003\u0004"))).toBe(false);
    expect(hasPdfHeader(new Uint8Array())).toBe(false);
  });
});

describe("parseYoutubeId", () => {
  const id = "dQw4w9WgXcQ";

  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=30s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `http://youtube.com/watch?v=${id}`,
  ])("reads %s", (url) => {
    expect(parseYoutubeId(url)).toBe(id);
  });

  it.each([
    "not a url",
    "https://vimeo.com/12345678901",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx",
    "https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
  ])("rejects %s", (url) => {
    expect(parseYoutubeId(url)).toBeNull();
  });

  it("prototypeLinkSchema normalises to the watch URL", () => {
    expect(prototypeLinkSchema.parse(`https://youtu.be/${id}`)).toEqual({
      youtubeId: id,
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    });
  });
});
