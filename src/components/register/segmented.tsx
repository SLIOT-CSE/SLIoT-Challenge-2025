import { useId } from "react";
import { cn } from "@/lib/utils";

/** Two or three exclusive choices as one row of buttons, for short answers like School / University */
export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
  onBlur,
  error,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: "" | T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-2">
      <legend className="mb-2 text-small font-semibold text-foam">{legend}</legend>
      <div className="flex gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-control px-4 text-small font-semibold ring-1 ring-inset transition-colors duration-200 motion-reduce:transition-none",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint",
                selected ? "bg-mint/15 text-mint ring-2 ring-mint" : "bg-deep/60 text-haze ring-edge hover:ring-lagoon",
                error && !selected && "ring-danger",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                onBlur={onBlur}
                data-invalid={error ? true : undefined}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
      <p id={errorId} aria-live="polite" className={cn("text-caption text-danger", !error && "sr-only")}>
        {error}
      </p>
    </fieldset>
  );
}
