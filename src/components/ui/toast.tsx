"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { DURATION, EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

// Short messages that answer an action ("Shortlist finalised. 12 teams emailed."). One stack at
// the top right (the sample switcher owns the bottom right). They close by themselves after 5
// seconds, wait while hovered or focused, and can be closed by hand. Errors stay for 10.

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before it closes. Default 5000, errors 10000 */
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/** `const toast = useToast(); toast({ title: "Saved", tone: "success" })` */
export function useToast(): (toast: ToastInput) => void {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast needs a <ToastProvider> above it");
  return toast;
}

const MAX_TOASTS = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const reduceMotion = useReducedMotion();

  const toast = useCallback((input: ToastInput) => {
    const item: ToastItem = { ...input, id: nextId.current++ };
    // Newest last; the oldest go first when too many pile up
    setItems((list) => [...list, item].slice(-MAX_TOASTS));
  }, []);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Always mounted, so screen readers announce each message as it arrives */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 top-4 z-toast flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduceMotion ? DURATION.fade : DURATION.panel,
                ease: reduceMotion ? EASE_OUT_QUART : EASE_OUT_EXPO,
              }}
              className="pointer-events-auto w-full"
            >
              <ToastCard item={item} onDismiss={() => dismiss(item.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const TONE_ICON = { success: CircleCheck, error: CircleAlert, info: Info } as const;
const TONE_COLOUR = { success: "text-success", error: "text-danger", info: "text-aqua" } as const;

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const tone = item.tone ?? "info";
  const Icon = TONE_ICON[tone];
  const duration = item.durationMs ?? (tone === "error" ? 10_000 : 5_000);
  // Hovering or focusing the toast pauses its timer, so a long message can be read
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [paused, duration, onDismiss]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex items-start gap-3 rounded-panel border border-ocean bg-night p-4 font-body text-foam"
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", TONE_COLOUR[tone])} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold">{item.title}</p>
        {item.description && <p className="mt-0.5 text-caption text-haze">{item.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-2 grid size-11 shrink-0 place-items-center rounded-full text-haze transition-colors hover:bg-foam/10 hover:text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua motion-reduce:transition-none"
      >
        <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
