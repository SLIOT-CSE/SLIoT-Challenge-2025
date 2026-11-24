import { SchoolField, UniversityField } from "./institution-fields";
import type { StepProps } from "./step-props";

/** School and University teams: one institution for the whole team (Open teams skip this step) */
export function InstitutionStep({ values, error, touch, update }: StepProps) {
  const clear = ["institutionName"];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-haze">
        Every member of a {values.category} team belongs to the same {values.category}, so you only say it once.
      </p>
      {values.category === "university" ? (
        <UniversityField
          name={values.institutionName}
          isOther={values.institutionIsOther}
          error={error("institutionName")}
          onChange={({ name, isOther }) =>
            update((v) => ({ ...v, institutionName: name, institutionIsOther: isOther }), clear)
          }
          onBlur={() => touch("institutionName")}
        />
      ) : (
        <SchoolField
          value={values.institutionName}
          error={error("institutionName")}
          onChange={(name) => update((v) => ({ ...v, institutionName: name, institutionIsOther: false }), clear)}
          onBlur={() => touch("institutionName")}
        />
      )}
    </div>
  );
}
