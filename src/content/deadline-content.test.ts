import { describe, expect, it } from "vitest";
import { deadlines } from "./deadlines";
import { faqsFor } from "./faq";
import { timelineFor } from "./timeline";

// The public page's dated copy follows the deadlines it is given (the ones saved in admin)
const moved = { ...deadlines, proposalDue: "2027-01-25T17:00:00+05:30" };

describe("content built from the deadlines", () => {
  it("moves the timeline entry and keeps the list in date order", () => {
    const events = timelineFor(moved);
    const due = events.find((e) => e.title === "Proposal submissions close")!;
    expect(due.at).toBe(moved.proposalDue);
    expect(due.body).toContain("5:00 pm");
    const times = events.map((e) => Date.parse(e.at));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    // Now after the video round opens (21 January)
    expect(events.indexOf(due)).toBeGreaterThan(events.findIndex((e) => e.title === "Video submissions open"));
  });

  it("includes the 13 updated timeline milestones", () => {
    const events = timelineFor(deadlines);
    expect(events).toHaveLength(13);
    expect(events.some((e) => e.title === "Semi-finals" && e.body.includes("same day"))).toBe(true);
    expect(events.at(-1)).toMatchObject({ title: "SLIoT '27 Awarding Ceremony", dateTba: true });
    for (const removed of [
      "Proposal results announced",
      "Semi-finalist briefing",
      "Shark Tank coaching — Session 1",
      "Shark Tank coaching — Session 2",
      "SLIoT '27 Shark Tank",
    ]) {
      expect(events.some((e) => e.title === removed)).toBe(false);
    }
  });

  it("shows the new date in the FAQ", () => {
    const answer = faqsFor(moved).find((f) => f.q === "How do we submit the proposal?")!.a;
    expect(answer).toContain("25 January, 5:00 pm");
  });
});
