import { Pencil } from "lucide-react";
import { categories } from "@/content/categories";
import { registrationInputSchema } from "@/lib/schemas";
import { memberType, toInput, type FormValues, type StepId } from "./form";

/** Everything typed, read-only, with a way back to each part. Shows the values as they'll be saved. */
export function ReviewStep({ values, onEdit }: { values: FormValues; onEdit: (step: StepId) => void }) {
  const category = categories.find((c) => c.id === values.category);
  // Normalised (+94 numbers, lower-case emails, upper-case NICs) when valid, as typed otherwise
  const parsed = registrationInputSchema.safeParse(toInput(values));
  const members = values.members.map((m, i) => ({
    ...m,
    whatsapp: parsed.success ? parsed.data.members[i].whatsapp : m.whatsapp,
    email: parsed.success ? parsed.data.members[i].email : m.email,
    nic: parsed.success ? (parsed.data.members[i].nic ?? "") : m.nic,
  }));
  const leader = members[0];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-haze">
        Check everything before you register. We&apos;ll email the team code to{" "}
        <strong className="font-semibold text-foam">{leader.email}</strong>.
      </p>

      <Section title="Team" onEdit={() => onEdit("team")}>
        <Row label="Team name" value={values.name} />
        <Row label="Category" value={category?.name ?? ""} />
      </Section>

      {values.category !== "open" && (
        <Section title="Institution" onEdit={() => onEdit("institution")}>
          <Row label={values.category === "university" ? "University" : "School"} value={values.institutionName} />
        </Section>
      )}

      <Section title={`Members (${members.length})`} onEdit={() => onEdit("members")}>
        <ol className="flex flex-col divide-y divide-edge/60">
          {members.map((m, i) => {
            const type = memberType(values.category, m);
            return (
              <li key={i} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <p className="flex items-center gap-2 font-semibold text-foam">
                  {m.fullName}
                  {i === 0 && (
                    <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-caption text-mint ring-1 ring-mint/30 ring-inset">
                      Team leader
                    </span>
                  )}
                </p>
                <p className="text-small text-haze">
                  {m.whatsapp} · {m.email}
                </p>
                {values.category === "open" && (
                  <p className="text-small text-haze">
                    {type === "university" ? "University student" : "School student"}, {m.institutionName}
                  </p>
                )}
                {m.nic && <p className="text-small text-haze">NIC {m.nic}</p>}
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-panel bg-deep/40 p-5 ring-1 ring-edge ring-inset">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-small font-semibold tracking-wide text-haze uppercase">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-small font-semibold text-mint hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          <Pencil aria-hidden="true" className="size-4" />
          Edit
          <span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex flex-col gap-0.5 py-1 sm:flex-row sm:gap-4">
      <span className="text-small text-haze sm:w-32 sm:shrink-0">{label}</span>
      <span className="font-semibold text-foam">{value}</span>
    </p>
  );
}
