import { describe, expect, it } from "vitest";
import {
  computeMenuPlacement,
  filterSelectOptions,
  findTypeaheadMatch,
  moveHighlightIndex,
  type SelectOption,
} from "./select-logic";

const SAMPLE_OPTIONS: SelectOption[] = [
  { value: "", label: "Choose a university" },
  { value: "University of Colombo", label: "University of Colombo" },
  { value: "University of Moratuwa", label: "University of Moratuwa" },
  { value: "University of Peradeniya", label: "University of Peradeniya", disabled: true },
  { value: "SLIIT", label: "SLIIT" },
  { value: "__other", label: "Other (type the name)" },
];

describe("filterSelectOptions", () => {
  it("returns all options when query is blank", () => {
    expect(filterSelectOptions(SAMPLE_OPTIONS, "   ", ["__other"])).toEqual(SAMPLE_OPTIONS);
  });

  it("matches case-insensitively, hides blank placeholder, and keeps pinned options", () => {
    const filtered = filterSelectOptions(SAMPLE_OPTIONS, "moratuwa", ["__other"]);
    expect(filtered.map((o) => o.value)).toEqual(["University of Moratuwa", "__other"]);
  });

  it("keeps pinned fallback even when no regular option matches", () => {
    const filtered = filterSelectOptions(SAMPLE_OPTIONS, "nonexistent", ["__other"]);
    expect(filtered.map((o) => o.value)).toEqual(["__other"]);
  });
});

describe("moveHighlightIndex", () => {
  it("skips disabled options and wraps cleanly", () => {
    expect(moveHighlightIndex(SAMPLE_OPTIONS, -1, "next")).toBe(0);
    // From index 2 (Moratuwa), next skips disabled index 3 (Peradeniya) -> index 4 (SLIIT)
    expect(moveHighlightIndex(SAMPLE_OPTIONS, 2, "next")).toBe(4);
    // From last index (5), next wraps to 0
    expect(moveHighlightIndex(SAMPLE_OPTIONS, 5, "next")).toBe(0);
    // From index 4 (SLIIT), prev skips disabled index 3 -> index 2
    expect(moveHighlightIndex(SAMPLE_OPTIONS, 4, "prev")).toBe(2);
    expect(moveHighlightIndex(SAMPLE_OPTIONS, 0, "prev")).toBe(5);
  });

  it("supports jumping to first and last enabled option", () => {
    const firstDisabled: SelectOption[] = [
      { value: "a", label: "A", disabled: true },
      { value: "b", label: "B" },
      { value: "c", label: "C", disabled: true },
    ];
    expect(moveHighlightIndex(firstDisabled, -1, "first")).toBe(1);
    expect(moveHighlightIndex(firstDisabled, -1, "last")).toBe(1);
  });

  it("returns -1 when every option is disabled", () => {
    expect(moveHighlightIndex([{ value: "a", label: "A", disabled: true }], 0, "next")).toBe(-1);
  });
});

describe("findTypeaheadMatch", () => {
  it("finds prefix matches starting after the current index and skips disabled options", () => {
    expect(findTypeaheadMatch(SAMPLE_OPTIONS, "sl", 0)).toBe(4);
    expect(findTypeaheadMatch(SAMPLE_OPTIONS, "university of p", 0)).toBe(-1);
    expect(findTypeaheadMatch(SAMPLE_OPTIONS, "university", 1)).toBe(2);
    expect(findTypeaheadMatch(SAMPLE_OPTIONS, "university", 2)).toBe(1);
  });
});

describe("computeMenuPlacement", () => {
  it("places below trigger when space below is sufficient", () => {
    const pos = computeMenuPlacement(
      { top: 120, bottom: 168, left: 24, width: 320 },
      { width: 390, height: 844 },
    );
    expect(pos).toEqual({
      left: 24,
      width: 320,
      maxHeight: 300,
      placement: "bottom",
      top: 174,
    });
  });

  it("flips above trigger and anchors bottom when near the viewport bottom", () => {
    const pos = computeMenuPlacement(
      { top: 700, bottom: 748, left: 24, width: 320 },
      { width: 390, height: 844 },
    );
    expect(pos.placement).toBe("top");
    expect(pos.bottom).toBe(844 - (700 - 6));
    expect(pos.maxHeight).toBe(300);
  });

  it("clamps width and horizontal position on 320px viewports and offsets for Dialog containers", () => {
    const pos = computeMenuPlacement(
      { top: 200, bottom: 248, left: 260, width: 100 },
      { width: 320, height: 640 },
      { top: 64, left: 16, height: 500 },
    );
    // width becomes min(240, 320 - 24 = 296) = 240; clamped viewport left = 320 - 12 - 240 = 68; minus container.left (16) = 52
    expect(pos.width).toBe(240);
    expect(pos.left).toBe(52);
    expect(pos.top).toBe(248 + 6 - 64);
    expect(pos.placement).toBe("bottom");
  });
});
