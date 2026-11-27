"use client";

import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange" | "size"> & {
  /** "indeterminate" is for a "select all" when only some rows are ticked */
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
};

/**
 * A native checkbox (keyboard, screen readers and the phone's own behaviour for free) drawn in
 * the aurora style. The control is 44px for touch, the drawn box 20px. It needs a label: use an
 * `aria-label` or wrap it in a <label>. Controlled only.
 */
export function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const indeterminate = checked === "indeterminate";

  // `indeterminate` can only be set as a property, not an attribute
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const on = checked === true || indeterminate;

  return (
    <span className={cn("relative inline-grid size-11 shrink-0 place-items-center", className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked === true}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer absolute inset-0 size-11 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none grid size-5 place-items-center rounded-[5px] ring-1 ring-inset transition-[background-color,box-shadow] duration-150 ease-out-quart motion-reduce:transition-none",
          on ? "bg-mint text-abyss ring-mint" : "bg-deep/60 ring-edge",
          "peer-hover:ring-lagoon peer-focus-visible:ring-2 peer-focus-visible:ring-aqua peer-disabled:opacity-50 peer-aria-invalid:ring-2 peer-aria-invalid:ring-danger",
        )}
      >
        {indeterminate ? (
          <Minus className="size-3.5" strokeWidth={3} />
        ) : checked ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : null}
      </span>
    </span>
  );
}
