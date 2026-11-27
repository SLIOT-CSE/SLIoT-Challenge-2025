import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A grey block that stands where content will be. It pulses slowly (still under reduced
 * motion). Size it to match the real content so the page doesn't jump when data arrives.
 * Hidden from screen readers: give the loading region itself `aria-busy` and a label.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-deep motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
