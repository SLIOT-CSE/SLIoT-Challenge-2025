"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion/ease";

/** The team code in large display type, revealed one character at a time, with a copy button */
export function CodeReveal({ code }: { code: string }) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied("copied");
      setTimeout(() => setCopied("idle"), 2500);
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <p className="font-display text-[clamp(2.5rem,11vw,5.5rem)] leading-none tracking-wide text-mint">
        <span className="sr-only">{code}</span>
        <span aria-hidden="true" className="flex flex-wrap">
          {[...code].map((char, i) => (
            <motion.span
              key={i}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.25 + i * 0.07, ease: EASE_OUT_EXPO }}
              className={char === "-" ? "px-1 text-haze" : undefined}
            >
              {char}
            </motion.span>
          ))}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={copy}
          trailingIcon={copied === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        >
          {copied === "copied" ? "Copied" : "Copy code"}
        </Button>
        <p role="status" className="text-small text-haze">
          {copied === "copied" && "Team code copied to your clipboard."}
          {copied === "failed" && "Couldn't copy. Select the code and copy it by hand."}
        </p>
      </div>
    </div>
  );
}
