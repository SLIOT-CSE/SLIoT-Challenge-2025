import { describe, expect, it } from "vitest";
import { deadlines } from "./deadlines";
import { faqsFor } from "./faq";
import { resolveStepDate, steps } from "./steps";
import { timelineFor } from "./timeline";

// The public page's dated copy follows the deadlines it is given (the ones saved in admin)
const moved = { ...deadlines, proposalDue: "2027-01-25T17:00:00+05:30" };

describe("content built from the deadlines", () => {
  it("moves the timeline entry and keeps the list in date order", () => {
    const events = timelineFor(moved);
    const due = events.find((e) => e.title === "Proposals due")!;
    expect(due.at).toBe(moved.proposalDue);
    expect(due.body).toContain("5:00 pm");
    const times = events.map((e) => Date.parse(e.at));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    // Now after the video round opens (21 January)
    expect(events.indexOf(due)).toBeGreaterThan(events.findIndex((e) => e.title === "Video submissions open"));
  });

  it("shows the new date in the FAQ", () => {
    const answer = faqsFor(moved).find((f) => f.q === "How do we submit the proposal?")!.a;
    expect(answer).toContain("25 January, 5:00 pm");
  });

  it("shows the new date on the step", () => {
    const step = steps.find((s) => s.title === "Submit your proposal")!;
    expect(resolveStepDate(step.date, moved)).toBe(moved.proposalDue);
  });
});
