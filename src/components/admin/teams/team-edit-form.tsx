"use client";

import { useState, type FormEvent } from "react";
import { MemberCard } from "@/components/register/member-card";
import { SchoolField, UniversityField } from "@/components/register/institution-fields";
import type { ErrorMap, FormValues, MemberValues } from "@/components/register/form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * The fields of a team an organizer may fix: name, institution and each member's details. The
 * category and the number of members are fixed. Errors show once a field has been left or a
 * save was tried, the same as on the registration form.
 */
export function TeamEditForm({
  id,
  values,
  errors,
  submitted,
  onChange,
  onSubmit,
}: {
  id: string;
  values: FormValues;
  /** Local and server errors by path, e.g. `members.1.email` */
  errors: ErrorMap;
  /** A save was tried: show every error */
  submitted: boolean;
  onChange: (next: FormValues) => void;
  onSubmit: () => void;
}) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const touch = (path: string) => setTouched((prev) => new Set(prev).add(path));
  const shown = (path: string) => (submitted || touched.has(path) ? errors[path] : undefined);

  const category = values.category;
  const sharedInstitution = category === "school" || category === "university";

  const patchMember = (index: number, patch: Partial<MemberValues>) =>
    onChange({ ...values, members: values.members.map((m, i) => (i === index ? { ...m, ...patch } : m)) });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form id={id} noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="Team name" error={shown("name")} required>
        {(control) => (
          <Input
            {...control}
            value={values.name}
            maxLength={60}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            onBlur={() => touch("name")}
          />
        )}
      </Field>

      {category === "school" && (
        <SchoolField
          value={values.institutionName}
          error={shown("institutionName")}
          onChange={(name) => onChange({ ...values, institutionName: name, institutionIsOther: false })}
          onBlur={() => touch("institutionName")}
        />
      )}
      {category === "university" && (
        <UniversityField
          name={values.institutionName}
          isOther={values.institutionIsOther}
          error={shown("institutionName")}
          onChange={({ name, isOther }) => onChange({ ...values, institutionName: name, institutionIsOther: isOther })}
          onBlur={() => touch("institutionName")}
        />
      )}
      {sharedInstitution && (
        <p className="-mt-3 text-caption text-haze">Every member&apos;s institution follows the team&apos;s.</p>
      )}

      {values.members.map((member, index) => (
        <MemberCard
          key={index}
          index={index}
          member={member}
          category={category}
          error={(field) => shown(`members.${index}.${field}`)}
          touch={(field) => touch(`members.${index}.${field}`)}
          onChange={(patch) => patchMember(index, patch)}
        />
      ))}
    </form>
  );
}
