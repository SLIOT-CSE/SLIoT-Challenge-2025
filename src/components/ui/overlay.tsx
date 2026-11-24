"use client";

import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { EASE_OUT_EXPO, EASE_OUT_QUART, DURATION } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

// The modal shell behind Dialog and Drawer, on Radix Dialog: focus is trapped inside, Esc and a
// click outside ask to close, focus returns to what opened it, and the page behind is locked.
// A parent can refuse a close request (unsaved changes, a request in flight) by leaving
// `open` true in its onOpenChange. Glass (backdrop blur) is allowed here, as on the nav.

export interface OverlayProps {
  open: boolean;
  /** Called with false when the person asks to close. Ignore it to keep the overlay open */
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Pinned under the content: the actions */
  footer?: ReactNode;
  /** false removes the close button and ignores Esc and outside clicks, for things that must be read */
  dismissible?: boolean;
  className?: string;
}

type Variant = "dialog" | "drawer";

export function ModalShell({
  variant,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className,
}: OverlayProps & { variant: Variant }) {
  const reduceMotion = useReducedMotion();
  const drawer = variant === "drawer";

  // Reduced motion keeps a short fade and drops every movement
  const initial = reduceMotion ? { opacity: 0 } : drawer ? { x: "100%" } : { opacity: 0, y: 12, scale: 0.98 };
  const animate = reduceMotion ? { opacity: 1 } : drawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 };
  const exit = reduceMotion ? { opacity: 0 } : drawer ? { x: "100%" } : { opacity: 0, y: 8 };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-overlay bg-abyss/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.ui, ease: EASE_OUT_QUART }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content
              forceMount
              asChild
              // With no description, say so explicitly, or Radix warns about a missing one
              {...(description ? {} : { "aria-describedby": undefined })}
              onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
              onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
              onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
            >
              <motion.div
                initial={initial}
                animate={animate}
                exit={exit}
                transition={{
                  duration: reduceMotion ? DURATION.fade : DURATION.panel,
                  ease: reduceMotion ? EASE_OUT_QUART : EASE_OUT_EXPO,
                }}
                className={cn(
                  "fixed z-dialog flex flex-col bg-night font-body text-foam outline-hidden",
                  drawer
                    ? "inset-y-0 right-0 w-full max-w-xl border-l border-ocean"
                    : // Centred with auto margins, not a transform, so Motion can move the panel freely
                      "inset-x-0 top-[10dvh] mx-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-lg rounded-panel border border-ocean",
                  className,
                )}
              >
                <div className="flex flex-col gap-1 border-b border-ocean px-6 py-5 pr-16">
                  <RadixDialog.Title className="text-title font-semibold text-foam">{title}</RadixDialog.Title>
                  {description ? (
                    <RadixDialog.Description asChild>
                      <div className="text-small text-haze">{description}</div>
                    </RadixDialog.Description>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

                {footer ? (
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ocean px-6 py-4">{footer}</div>
                ) : null}

                {dismissible && (
                  <RadixDialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close"
                      className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-haze transition-colors hover:bg-foam/10 hover:text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua motion-reduce:transition-none"
                    >
                      <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </RadixDialog.Close>
                )}
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
