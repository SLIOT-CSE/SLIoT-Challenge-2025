// "How to take part": the six stages of the competition, in ascending order.

export type Step = {
  title: string;
  body: string;
};

export const steps: Step[] = [
  {
    title: "Register your team",
    body: "Form a team of 1 to 5, pick your category and register. The team leader gets a team code by email.",
  },
  {
    title: "Submit your proposal",
    body: "Describe the problem and your IoT solution in the proposal template, then upload it as a PDF from the team portal.",
  },
  {
    title: "Get shortlisted",
    body: "Judges score every proposal on creativity, value, impact and technology. Shortlisted teams get an email.",
  },
  {
    title: "Build your prototype",
    body: "Build it, record a demo video and submit the YouTube link from the team portal, with technical sessions along the way.",
  },
  {
    title: "Compete in the semi-finals",
    body: "Shortlisted semi-finalists demonstrate their working prototypes live to the judges, with Grand Finalists chosen and announced at the end of that day.",
  },
  {
    title: "Pitch at the finale",
    body: "Grand Finalists present their finished IoT systems to the judging panel before the winners are recognized at the awarding ceremony.",
  },
];
