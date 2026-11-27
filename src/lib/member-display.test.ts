import { describe, expect, it } from "vitest";
import { formatMemberAffiliation, formatWhatsappDisplay } from "./member-display";

describe("formatWhatsappDisplay", () => {
  it("formats normalized +94 numbers into readable groups", () => {
    expect(formatWhatsappDisplay("+94741214833")).toBe("+94 74 121 4833");
    expect(formatWhatsappDisplay("  +94771234567 ")).toBe("+94 77 123 4567");
  });

  it("leaves non-normalized or partial inputs intact", () => {
    expect(formatWhatsappDisplay("0771234567")).toBe("0771234567");
    expect(formatWhatsappDisplay("+9477123")).toBe("+9477123");
    expect(formatWhatsappDisplay("")).toBe("");
  });
});

describe("formatMemberAffiliation", () => {
  it("combines type and institution name when present", () => {
    expect(formatMemberAffiliation("university", "University of Moratuwa")).toBe(
      "University student · University of Moratuwa",
    );
    expect(formatMemberAffiliation("school", "Royal College")).toBe("School student · Royal College");
  });

  it("shows role alone for independent members without an institution name", () => {
    expect(formatMemberAffiliation("independent", null)).toBe("Independent / Other");
    expect(formatMemberAffiliation("independent", "")).toBe("Independent / Other");
  });
});
