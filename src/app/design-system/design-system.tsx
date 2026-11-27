"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";

const COLORS = [
  ["abyss", "Page background"],
  ["night", "Raised surfaces, app background"],
  ["deep", "Panels, inputs, table header"],
  ["ocean", "Decorative borders, hover surfaces"],
  ["reef", "Secondary fills"],
  ["edge", "Input and control borders"],
  ["lagoon", "Inactive nodes, secondary accents"],
  ["mint", "Primary accent: CTAs, active, links"],
  ["aqua", "Live signal, focus ring"],
  ["foam", "Primary text"],
  ["haze", "Secondary text"],
  ["success", "Saved, submitted"],
  ["warning", "Form warnings (app only)"],
  ["danger", "Errors, destructive actions"],
] as const;

// Every text/background pair the design uses, with the WCAG level it must reach:
// text = 4.5:1 (body text), large = 3:1 (24px+ or 19px bold+), graphic = 3:1 (non-text UI),
// decorative = no requirement (WCAG 1.4.11 exempts borders that do not identify a control)
type Need = "text" | "large" | "graphic" | "decorative";
const PAIRS: [fg: string, bg: string, need: Need, use: string][] = [
  ["foam", "abyss", "text", "Body text on the page"],
  ["foam", "night", "text", "Body text on raised surfaces"],
  ["foam", "deep", "text", "Text in panels and inputs"],
  ["foam", "ocean", "text", "Text on hover surfaces"],
  ["haze", "abyss", "text", "Secondary text on the page"],
  ["haze", "night", "text", "Secondary text on surfaces"],
  ["haze", "deep", "text", "Helper text, placeholders in inputs"],
  ["mint", "abyss", "text", "Links, active nav on the page"],
  ["mint", "night", "text", "Links on surfaces"],
  ["mint", "deep", "text", "Links in panels"],
  ["aqua", "abyss", "text", "Live chip, countdown"],
  ["aqua", "night", "text", "Live states on surfaces"],
  ["abyss", "mint", "text", "Primary button label"],
  ["abyss", "aqua", "text", "Primary button label (hover)"],
  ["abyss", "danger", "text", "Danger button label"],
  ["danger", "night", "text", "Error messages"],
  ["danger", "deep", "text", "Error messages in panels"],
  ["warning", "night", "text", "Warnings"],
  ["success", "night", "text", "Success messages"],
  ["lagoon", "abyss", "graphic", "Inactive nodes, rails"],
  ["edge", "abyss", "graphic", "Control borders on the page"],
  ["edge", "night", "graphic", "Control borders on surfaces"],
  ["edge", "deep", "graphic", "Control borders in panels"],
  ["ocean", "abyss", "decorative", "Panel borders, dividers (exempt)"],
  ["ocean", "night", "decorative", "Panel borders on surfaces (exempt)"],
  ["aqua", "deep", "graphic", "Focus ring on inputs"],
];

// Literal class names, so Tailwind generates them
const TYPE = [
  ["display-xl", "font-display text-display-xl", "Build the connected island"],
  ["display-lg", "font-display text-display-lg", "The road to the finale"],
  ["display-md", "font-display text-display-md", "Moments from past editions"],
  ["title", "font-body font-semibold text-title", "Proposal round is live"],
  ["body-lg", "font-body text-body-lg", "National IoT competition for school students, undergraduates and innovators."],
  ["body", "font-body text-body", "Teams of one to five design an IoT solution for a real problem, then build it if shortlisted."],
  ["small", "font-body text-small", "Proposals can be up to 10 MB. Compress the PDF and try again."],
  ["caption", "font-body text-caption", "Due 30 July, 11:59 PM Sri Lanka time"],
] as const;

export function DesignSystem() {
  // Read the colours from the CSS variables, so this page always shows what the site uses
  const snapshot = useSyncExternalStore(subscribeNever, readColors, () => "{}");
  const hex = useMemo(() => JSON.parse(snapshot) as Record<string, string>, [snapshot]);

  const results = PAIRS.map(([fg, bg, need, use]) => {
    const ratio = hex[fg] && hex[bg] ? contrast(hex[fg], hex[bg]) : 0;
    const min = need === "text" ? 4.5 : need === "decorative" ? 1 : 3;
    return { fg, bg, need, use, ratio, pass: ratio >= min, min };
  });
  const failures = results.filter((r) => r.ratio > 0 && !r.pass).length;

  return (
    <main className="min-h-dvh bg-abyss font-body text-foam">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-8">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-display-lg text-foam">SLIoT 2027 design system</h1>
          <p className="max-w-[65ch] text-body-lg text-haze">
            Tokens from <code className="text-mint">src/app/globals.css</code> and the shared primitives. Development
            only; this page returns 404 in production.
          </p>
        </header>

        <section aria-labelledby="colours" className="flex flex-col gap-6">
          <h2 id="colours" className="font-display text-display-md">Colour</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
            {COLORS.map(([name, role]) => (
              <li key={name} className="flex flex-col gap-2">
                <span className="h-20 rounded-panel ring-1 ring-foam/10" style={{ background: `var(--color-${name})` }} />
                <span className="text-small font-semibold">{name}</span>
                <span className="text-caption text-haze">
                  {hex[name] || "…"} · {role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contrast" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="contrast" className="font-display text-display-md">Contrast (WCAG 2.2 AA)</h2>
            <p className={failures ? "text-danger" : "text-success"} data-testid="contrast-summary">
              {Object.keys(hex).length === 0
                ? "Measuring…"
                : failures
                  ? `${failures} of ${results.length} pairs fail`
                  : `All ${results.length} pairs pass`}
            </p>
          </div>
          <div className="overflow-x-auto rounded-panel ring-1 ring-ocean">
            <table className="w-full min-w-[40rem] border-collapse text-left text-small">
              <thead className="bg-deep text-foam">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Sample</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Pair</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Used for</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Needs</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`${r.fg}-${r.bg}`} className="border-t border-ocean/60">
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-md px-3 py-1.5 font-semibold"
                        style={{ background: `var(--color-${r.bg})`, color: `var(--color-${r.fg})` }}
                      >
                        {r.need === "graphic" || r.need === "decorative" ? "■ ■ ■" : "Aa Sample"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-haze">
                      {r.fg} on {r.bg}
                    </td>
                    <td className="px-4 py-3 text-haze">{r.use}</td>
                    <td className="px-4 py-3 text-haze">
                      {r.need === "decorative" ? "Exempt" : `${r.min}:1 ${r.need === "graphic" ? "(graphic)" : r.need === "large" ? "(large)" : ""}`}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${r.pass ? "text-success" : "text-danger"}`}>
                      {r.ratio ? `${r.ratio.toFixed(2)}:1 ${r.pass ? "pass" : "FAIL"}` : "…"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="type" className="flex flex-col gap-6">
          <h2 id="type" className="font-display text-display-md">Type</h2>
          <ul className="flex flex-col gap-6">
            {TYPE.map(([size, classes, sample]) => (
              <li key={size} className="flex flex-col gap-1 border-t border-ocean/60 pt-4">
                <span className="text-caption text-haze">text-{size}</span>
                <span className={`${classes} max-w-[65ch] text-balance`}>{sample}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="buttons" className="flex flex-col gap-6">
          <h2 id="buttons" className="font-display text-display-md">Buttons</h2>
          <div className="flex flex-col gap-6">
            {(["sm", "md", "lg"] as const).map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-4">
                <Button size={size} trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}>
                  Register your team
                </Button>
                <Button size={size} variant="secondary">
                  How it works
                </Button>
                <Button size={size} variant="ghost">
                  Team login
                </Button>
                <Button size={size} variant="danger">
                  Disable account
                </Button>
                <Button size={size} loading>
                  Submitting…
                </Button>
                <Button size={size} disabled>
                  Registration closed
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="secondary" trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}>
                <a href="#type">Link styled as a button</a>
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="fields" className="flex flex-col gap-6">
          <h2 id="fields" className="font-display text-display-md">Fields</h2>
          <form className="grid max-w-3xl gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <Field label="Full name" required>
              {(control) => <Input autoComplete="name" placeholder="Nethmi Perera" {...control} />}
            </Field>
            <Field label="WhatsApp number" helper="A Sri Lankan mobile, e.g. 077 123 4567" required>
              {(control) => <Input type="tel" inputMode="tel" autoComplete="tel" {...control} />}
            </Field>
            <Field
              label="Email"
              error="This email is already in team SL27-7KQ4-M9XD. Use a different email for Member 3."
              required
            >
              {(control) => <Input type="email" defaultValue="nethmi@example.com" {...control} />}
            </Field>
            <Field label="NIC" optional helper="Old format 123456789V or the new 12-digit number">
              {(control) => <Input {...control} />}
            </Field>
            <Field label="Anything else we should know?" optional className="sm:col-span-2">
              {(control) => <Textarea {...control} />}
            </Field>
            <Field label="Disabled field">
              {(control) => <Input disabled defaultValue="Registration closed" {...control} />}
            </Field>
          </form>
        </section>
      </div>
    </main>
  );
}

// The CSS variables never change while the page is open; serialised so the snapshot is stable
function subscribeNever() {
  return () => {};
}

function readColors() {
  const styles = getComputedStyle(document.documentElement);
  return JSON.stringify(
    Object.fromEntries(COLORS.map(([name]) => [name, styles.getPropertyValue(`--color-${name}`).trim()])),
  );
}

// WCAG 2.x contrast ratio between two #rrggbb colours
function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function luminance(hex: string) {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.replace(/./g, (c) => c + c) : v;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
