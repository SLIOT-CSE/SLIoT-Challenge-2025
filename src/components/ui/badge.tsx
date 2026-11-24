import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// A small status pill. Always carries text, so colour is never the only signal.
const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-body text-caption font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-foam/10 text-haze",
        mint: "bg-mint/15 text-mint",
        aqua: "bg-aqua/15 text-aqua",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    /** A small dot before the label, for live or active states */
    dot?: boolean;
  };

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
