import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CategoryId } from "@/lib/team-rules";
import { asksNic, type MemberValues } from "./form";
import { SchoolField, UniversityField } from "./institution-fields";
import { Segmented } from "./segmented";

/** One member: the leader first (with the reason their email matters), then up to four more */
export function MemberCard({
  index,
  member,
  category,
  error,
  touch,
  onChange,
  onRemove,
}: {
  index: number;
  member: MemberValues;
  category: "" | CategoryId;
  error: (field: string) => string | undefined;
  touch: (field: string) => void;
  onChange: (patch: Partial<MemberValues>) => void;
  onRemove?: () => void;
}) {
  const isLeader = index === 0;
  const open = category === "open";

  return (
    <fieldset data-member={index} className="flex flex-col gap-5 rounded-panel bg-deep/40 p-5 ring-1 ring-edge ring-inset sm:p-6">
      <legend className="sr-only">{isLeader ? "Member 1, team leader" : `Member ${index + 1}`}</legend>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 text-title font-semibold text-foam">
          Member {index + 1}
          {isLeader && (
            <span className="rounded-full bg-mint/15 px-3 py-1 text-caption font-semibold text-mint ring-1 ring-mint/30 ring-inset">
              Team leader
            </span>
          )}
        </h3>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X aria-hidden="true" className="size-4" />
            Remove
            <span className="sr-only"> member {index + 1}</span>
          </Button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={error("fullName")} required className="sm:col-span-2">
          {(control) => (
            <Input
              {...control}
              value={member.fullName}
              maxLength={80}
              autoComplete={isLeader ? "name" : "off"}
              onChange={(e) => onChange({ fullName: e.target.value })}
              onBlur={() => touch("fullName")}
            />
          )}
        </Field>

        <Field label="WhatsApp number" helper="Like 077 123 4567 or +94 77 123 4567" error={error("whatsapp")} required>
          {(control) => (
            <Input
              {...control}
              type="tel"
              inputMode="tel"
              value={member.whatsapp}
              autoComplete={isLeader ? "tel" : "off"}
              onChange={(e) => onChange({ whatsapp: e.target.value })}
              onBlur={() => touch("whatsapp")}
            />
          )}
        </Field>

        <Field
          label="Email"
          helper={isLeader ? "We email the team code here, so use an address you check" : "Each person can only be in one team"}
          error={error("email")}
          required
        >
          {(control) => (
            <Input
              {...control}
              type="email"
              inputMode="email"
              value={member.email}
              autoComplete={isLeader ? "email" : "off"}
              onChange={(e) => onChange({ email: e.target.value })}
              onBlur={() => touch("email")}
            />
          )}
        </Field>
      </div>

      {open && (
        <div className="flex flex-col gap-5">
          <Segmented
            legend="This member is a"
            value={member.institutionType}
            options={[
              { value: "school", label: "School student" },
              { value: "university", label: "University student" },
            ]}
            error={error("institutionType")}
            onChange={(type) =>
              onChange({ institutionType: type, institutionName: "", institutionIsOther: false })
            }
            onBlur={() => touch("institutionType")}
          />
          {member.institutionType === "school" && (
            <SchoolField
              value={member.institutionName}
              error={error("institutionName")}
              onChange={(name) => onChange({ institutionName: name, institutionIsOther: false })}
              onBlur={() => touch("institutionName")}
            />
          )}
          {member.institutionType === "university" && (
            <UniversityField
              name={member.institutionName}
              isOther={member.institutionIsOther}
              error={error("institutionName")}
              onChange={({ name, isOther }) => onChange({ institutionName: name, institutionIsOther: isOther })}
              onBlur={() => touch("institutionName")}
            />
          )}
        </div>
      )}

      {asksNic(category, member) && (
        <Field
          label="NIC"
          helper="Old format 123456789V or the 12-digit number. Only university students are asked."
          error={error("nic")}
          required
        >
          {(control) => (
            <Input
              {...control}
              value={member.nic}
              maxLength={12}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => onChange({ nic: e.target.value })}
              onBlur={() => touch("nic")}
            />
          )}
        </Field>
      )}
    </fieldset>
  );
}
