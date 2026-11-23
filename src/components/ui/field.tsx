"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props a Field hands to its control so label, helper and error are wired up */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

type FieldProps = {
  label: ReactNode;
  /** Shown under the control before anyone gets it wrong (formats, examples) */
  helper?: ReactNode;
  /** Shown under the control, replacing nothing: what went wrong and how to fix it */
  error?: string;
  required?: boolean;
  /** Marks the label "Optional" (use instead of asterisks on required fields) */
  optional?: boolean;
  id?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Form field: label above, control, helper text, then the error below.
 * The control gets its id, aria-describedby and aria-invalid from here:
 *   <Field label="Email" helper="We send your team code here" error={errors.email}>
 *     {(control) => <Input type="email" {...control} />}
 *   </Field>
 */
export function Field({ label, helper, error, required, optional, id, className, children }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? `field-${autoId}`;
  const helperId = helper ? `${controlId}-helper` : undefined;
  const errorId = `${controlId}-error`;
  const describedBy = [helperId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={controlId} className="flex items-baseline gap-2 font-body text-small font-semibold text-foam">
        {label}
        {optional && <span className="font-normal text-haze">Optional</span>}
      </label>
      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required,
      })}
      {helper && (
        <p id={helperId} className="font-body text-caption text-haze">
          {helper}
        </p>
      )}
      {/* Always rendered so screen readers announce errors as they appear */}
      <p id={errorId} aria-live="polite" className={cn("font-body text-caption text-danger", !error && "sr-only")}>
        {error}
      </p>
    </div>
  );
}
