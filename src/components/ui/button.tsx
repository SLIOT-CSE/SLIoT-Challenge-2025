import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 2027 button. Full pill, Montserrat semibold, presses in slightly (scale 0.98).
// Primary: filled mint. Secondary: foam outline. Ghost: text only. Danger: soft red.
// Every size is at least 44px tall (touch target).
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full",
    "font-body font-semibold",
    "transition-[transform,background-color,color,box-shadow] duration-200 ease-out-quart",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "motion-reduce:transition-none motion-reduce:active:scale-100",
  ],
  {
    variants: {
      variant: {
        primary: "bg-mint text-abyss hover:bg-aqua",
        secondary: "text-foam ring-1 ring-foam/40 ring-inset hover:bg-foam/10 hover:ring-foam/70",
        ghost: "text-foam hover:bg-foam/10",
        danger: "bg-danger text-abyss hover:bg-[#ffb4b4]",
      },
      size: {
        sm: "h-11 px-5 text-small",
        md: "h-12 px-6 text-body",
        lg: "h-14 px-7 text-body-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

// The trailing icon sits in its own circle, flush with the button's right edge
const iconCircle = cva(
  "grid shrink-0 place-items-center rounded-full transition-transform duration-200 ease-out-quart group-hover/button:translate-x-0.5 group-hover/button:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover/button:transform-none",
  {
    variants: {
      variant: {
        primary: "bg-abyss text-mint",
        secondary: "bg-foam/10 text-foam",
        ghost: "bg-foam/10 text-foam",
        danger: "bg-abyss text-danger",
      },
      size: {
        sm: "size-8 -mr-3.5",
        md: "size-9 -mr-4",
        lg: "size-10 -mr-4.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styling instead of a <button> */
    asChild?: boolean;
    /** Icon shown in a circle at the right end */
    trailingIcon?: ReactNode;
    /** Shows progress and blocks clicks (no fading); keep the label meaningful, e.g. "Submitting…".
     *  Forms should also ignore submits while their own submitting state is on. */
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, trailingIcon, loading = false, disabled, children, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      // While loading the button blocks clicks but keeps full colour, so its label stays readable
      className={cn(buttonVariants({ variant, size }), loading && "pointer-events-none", className)}
      // A real <button> defaults to type="button" so it never submits a form by accident
      {...(asChild ? {} : { type: type ?? "button", disabled })}
      aria-busy={loading || undefined}
      {...props}
      onClick={loading ? (event) => event.preventDefault() : props.onClick}
    >
      {loading && <Spinner />}
      <Slottable>{children}</Slottable>
      {trailingIcon && (
        <span aria-hidden="true" className={iconCircle({ variant, size })}>
          {trailingIcon}
        </span>
      )}
    </Comp>
  );
});

function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 animate-spin motion-reduce:animate-none">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export { buttonVariants };
