import { universities } from "@/content/universities";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const OTHER = "__other";

/** A school's name, typed in */
export function SchoolField({
  value,
  onChange,
  onBlur,
  error,
  label = "School name",
}: {
  value: string;
  onChange: (name: string) => void;
  onBlur: () => void;
  error?: string;
  label?: string;
}) {
  return (
    <Field label={label} error={error} helper="As it is on your school ID, for example Central College, Kandy" required>
      {(control) => (
        <Input
          {...control}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete="organization"
        />
      )}
    </Field>
  );
}

/** A university from the list, or Other with the name typed in */
export function UniversityField({
  name,
  isOther,
  onChange,
  onBlur,
  error,
  label = "University",
}: {
  name: string;
  isOther: boolean;
  onChange: (next: { name: string; isOther: boolean }) => void;
  onBlur: () => void;
  error?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label={label} error={isOther ? undefined : error} required>
        {(control) => (
          <Select
            {...control}
            searchable
            searchPlaceholder="Search universities…"
            pinnedValues={[OTHER]}
            value={isOther ? OTHER : name}
            onChange={(e) =>
              e.target.value === OTHER
                ? onChange({ name: "", isOther: true })
                : onChange({ name: e.target.value, isOther: false })
            }
            onBlur={onBlur}
          >
            <option value="">Choose a university</option>
            {universities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value={OTHER}>Other (type the name)</option>
          </Select>
        )}
      </Field>
      {isOther && (
        <Field label="University name" error={error} helper="The full name of your university or institute" required>
          {(control) => (
            <Input
              {...control}
              value={name}
              onChange={(e) => onChange({ name: e.target.value, isOther: true })}
              onBlur={onBlur}
              autoComplete="organization"
            />
          )}
        </Field>
      )}
    </div>
  );
}
