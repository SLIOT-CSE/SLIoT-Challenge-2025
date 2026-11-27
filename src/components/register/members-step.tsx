import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEAM_SIZE } from "@/lib/team-rules";
import { canAddMember, type MemberValues } from "./form";
import { MemberCard } from "./member-card";
import type { StepProps } from "./step-props";

export function MembersStep({
  values,
  error,
  touch,
  update,
  onAddMember,
  onRemoveMember,
}: StepProps & { onAddMember: () => void; onRemoveMember: (index: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const count = values.members.length;
  const previousCount = useRef(count);

  // A new card takes focus on its first field, so the keyboard lands where the work is
  useEffect(() => {
    if (count > previousCount.current) {
      root.current?.querySelector<HTMLInputElement>(`[data-member="${count - 1}"] input`)?.focus();
    }
    previousCount.current = count;
  }, [count]);

  return (
    <div ref={root} className="flex flex-col gap-5">
      <p className="text-body text-haze">
        Add {TEAM_SIZE.min} to {TEAM_SIZE.max} people. Member 1 is the team leader: team emails go to them.
      </p>

      {values.members.map((member, i) => (
        <MemberCard
          key={i}
          index={i}
          member={member}
          category={values.category}
          error={(field) => error(`members.${i}.${field}`)}
          touch={(field) => touch(`members.${i}.${field}`)}
          onChange={(patch: Partial<MemberValues>) =>
            update(
              (v) => ({ ...v, members: v.members.map((m, j) => (j === i ? { ...m, ...patch } : m)) }),
              Object.keys(patch).map((field) => `members.${i}.${field}`),
            )
          }
          onRemove={i === 0 ? undefined : () => onRemoveMember(i)}
        />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-haze" aria-live="polite">
          {count} of {TEAM_SIZE.max} members
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={onAddMember}
          disabled={!canAddMember(values)}
          trailingIcon={<Plus aria-hidden="true" className="size-4" />}
        >
          Add member
        </Button>
      </div>
    </div>
  );
}
