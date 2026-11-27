"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import { highlights, photoAlt, type Photo } from "@/content/memories";
import { AuroraSignalBackdrop } from "@/components/site/aurora-signal-backdrop";
import { PhotoViewer } from "@/components/site/photo-viewer";
import { cn } from "@/lib/utils";

/**
 * Memories: curated eight-shot asymmetric bento grid across past editions
 * over the aurora and glowing sensor-node backdrop, paired with a lightbox viewer.
 */
export function Memories() {
  const [viewer, setViewer] = useState<number | null>(null);

  return (
    <section id="memories" aria-labelledby="memories-title" className="relative isolate overflow-x-clip py-20 md:py-28">
      <AuroraSignalBackdrop />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* Left editorial column */}
        <header className="flex flex-col items-start gap-5 lg:sticky lg:top-28 lg:self-start">
          <h2 id="memories-title" className="text-balance font-display text-display-lg text-foam">
            Moments from past editions
          </h2>
          <p className="max-w-[34ch] text-pretty text-body text-haze">
            Finales, semi-finals and workshops since 2019. Tap any shot to see it full size.
          </p>

          <button
            type="button"
            onClick={() => setViewer(0)}
            className="group mt-1 inline-flex min-h-11 items-center gap-3 text-left text-caption font-semibold uppercase tracking-[0.14em] text-foam transition-colors hover:text-mint"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-night text-mint ring-1 ring-foam/15 transition-colors duration-200 group-hover:bg-mint group-hover:text-abyss group-hover:ring-mint">
              <Images className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span aria-hidden="true" className="h-px w-8 bg-edge/70 transition-all duration-300 ease-out-quart group-hover:w-11 group-hover:bg-mint motion-reduce:transition-none" />
            <span>View all moments</span>
          </button>
        </header>

        {/* Right 8-photo asymmetric bento */}
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4" aria-label="Highlight photos">
          {highlights.map((photo, i) => {
            const isHero = i === 0;
            const isClosing = i === highlights.length - 1;
            return (
              <li
                key={photo.src}
                className={cn(
                  isHero
                    ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:row-span-2 lg:aspect-auto lg:h-full"
                    : isClosing
                      ? "col-span-2 aspect-[16/9] sm:aspect-[16/8] lg:col-span-1 lg:aspect-[4/3]"
                      : "aspect-[4/3]",
                )}
              >
                <HighlightTile
                  photo={photo}
                  number={String(i + 1).padStart(2, "0")}
                  onOpen={() => setViewer(i)}
                  sizes={
                    isHero
                      ? "(min-width: 1024px) 28vw, 100vw"
                      : isClosing
                        ? "(min-width: 1024px) 24vw, 100vw"
                        : "(min-width: 1024px) 24vw, 50vw"
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>

      <PhotoViewer photos={highlights} index={viewer} onIndexChange={setViewer} onClose={() => setViewer(null)} />
    </section>
  );
}

function HighlightTile({
  photo,
  number,
  onOpen,
  sizes,
}: {
  photo: Photo;
  number: string;
  onOpen: () => void;
  sizes: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open photo ${number}: ${photoAlt(photo)}`}
      className="group relative block size-full overflow-hidden rounded-photo bg-night ring-1 ring-foam/12 transition-[ring-color] duration-300 hover:ring-mint/40"
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes={sizes}
        quality={70}
        className="object-cover transition-transform duration-500 ease-out-quart group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-abyss/95 via-abyss/65 to-transparent px-3 pb-2.5 pt-10 text-left text-caption sm:px-3.5 sm:pb-3"
      >
        <span className="font-semibold tabular-nums text-mint">{number}</span>
        <span className="text-edge">—</span>
        <span className="truncate font-semibold uppercase tracking-[0.06em] text-foam">{photo.event}</span>
      </span>
    </button>
  );
}
