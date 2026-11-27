import { describe, expect, it } from "vitest";
import { formatWhatsappDisplay } from "./member-display";

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
