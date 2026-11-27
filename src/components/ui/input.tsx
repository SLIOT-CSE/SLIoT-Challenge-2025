import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Shared look for text controls: deep surface, edge border (3:1), aqua ring on focus, soft red when invalid
export const controlClasses = [
  "w-full rounded-control bg-deep/60 font-body text-body text-foam ring-1 ring-edge ring-inset",
  "placeholder:text-haze",
  "transition-[box-shadow,background-color] duration-200 ease-out-quart motion-reduce:transition-none",
  "hover:ring-lagoon",
  "focus-visible:bg-deep focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-aqua",
  "aria-invalid:ring-2 aria-invalid:ring-danger",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return <input ref={ref} type={type} className={cn(controlClasses, "h-12 px-4", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(controlClasses, "min-h-28 px-4 py-3", className)} {...props} />;
});
