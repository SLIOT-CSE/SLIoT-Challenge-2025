import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { controlClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// A native <select> in the same look as Input: native means the phone's own picker, full
// keyboard and screen reader support, and nothing to maintain.
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlClasses, "h-12 appearance-none pr-11 pl-4 [color-scheme:dark]", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-haze"
      />
    </div>
  );
});
