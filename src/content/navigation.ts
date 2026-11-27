// Sections of the one-page site, in scroll order. `id` is the section's anchor (/#id).
// Sections that do not exist yet are simply skipped by the scroll spy.

export type NavItem = { id: string; label: string };

export const navigation: NavItem[] = [
  { id: "about", label: "About" },
  { id: "categories", label: "Categories" },
  { id: "timeline", label: "Timeline" },
  { id: "prizes", label: "Prizes" },
  { id: "memories", label: "Memories" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export const routes = {
  register: "/register",
  teamPortal: "/team",
};
