"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { photoAlt, type Photo } from "@/content/memories";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { EASE_OUT_QUART } from "@/lib/motion/ease";

/**
 * Full-screen photo viewer: arrows, arrow keys and swipe move between photos, Esc closes,
 * focus is trapped inside and returns to the photo that opened it.
 */
export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (open) lenis.current?.stop();
    else lenis.current?.start();
  }, [open, lenis]);

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  const photo = index !== null ? photos[index] : null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && photo && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-overlay bg-abyss/92 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              aria-describedby={undefined}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") step(1);
                if (e.key === "ArrowLeft") step(-1);
              }}
              className="fixed inset-0 z-dialog flex flex-col outline-hidden"
            >
              <Dialog.Title className="sr-only">Photos from past editions</Dialog.Title>

              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
                <p className="text-small text-haze" aria-live="polite">
                  <span className="font-semibold text-foam">
                    {photo.event}, SLIoT {photo.year}
                  </span>
                  <span className="ml-3 tabular-nums">
                    {index + 1} / {photos.length}
                  </span>
                </p>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close photos"
                    className="grid size-11 place-items-center rounded-full text-foam ring-1 ring-foam/20 transition-colors hover:bg-foam/10"
                  >
                    <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <div
                className="relative flex-1 select-none"
                onPointerDown={(e) => (touchStart.current = e.clientX)}
                onPointerUp={(e) => {
                  if (touchStart.current === null) return;
                  const dx = e.clientX - touchStart.current;
                  touchStart.current = null;
                  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                }}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={photo.src}
                    className="absolute inset-x-4 inset-y-2 sm:inset-x-24"
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.3, ease: EASE_OUT_QUART }}
                  >
                    <Image
                      src={photo.src}
                      alt={photoAlt(photo)}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-night/80 text-foam ring-1 ring-foam/15 backdrop-blur transition-colors hover:bg-deep sm:left-6"
                >
                  <ChevronLeft className="size-6" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-night/80 text-foam ring-1 ring-foam/15 backdrop-blur transition-colors hover:bg-deep sm:right-6"
                >
                  <ChevronRight className="size-6" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>

              <p className="px-4 py-4 text-center text-caption text-haze sm:hidden">Swipe for more photos</p>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
