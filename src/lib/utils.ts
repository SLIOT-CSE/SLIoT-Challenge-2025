import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's default scale names. Without these, a custom size
// like text-small is read as a colour and cn("text-small text-foam") drops one of them.
// Keep in sync with the @theme tokens in src/app/globals.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-xl", "display-lg", "display-md", "title", "body-lg", "body", "small", "caption"],
      shadow: ["lift", "signal"],
      radius: ["panel", "photo", "control"],
      ease: ["out-expo", "out-quart"],
    },
  },
});

/** Join class names, letting later Tailwind classes override earlier conflicting ones */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
