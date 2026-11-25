// Photos from past editions (files in public/images/gallery/). Numbered 1..count with no gaps.

export type Album = { event: string; folder: string; count: number; ext: "jpg" | "jpeg" };
export type Edition = { year: number; albums: Album[] };
export type Photo = { src: string; year: number; event: string; n: number };

export const editions: Edition[] = [
  {
    year: 2025,
    albums: [
      { event: "Grand finale", folder: "SLIoT2025/finals", count: 7, ext: "jpeg" },
      { event: "Semi-finals", folder: "SLIoT2025/semi", count: 24, ext: "jpg" },
      { event: "University workshop", folder: "SLIoT2025/uniworkshop", count: 23, ext: "jpg" },
      { event: "School workshop", folder: "SLIoT2025/schoolworkshop", count: 30, ext: "jpg" },
    ],
  },
  { year: 2023, albums: [{ event: "Highlights", folder: "SLIoT2023", count: 10, ext: "jpg" }] },
  { year: 2022, albums: [{ event: "Highlights", folder: "SLIoT2022", count: 11, ext: "jpg" }] },
  { year: 2019, albums: [{ event: "Highlights", folder: "SLIoT2019", count: 11, ext: "jpg" }] },
];

/** Curated seven-shot bento highlights shown in the Memories section and lightbox */
export const highlights: Photo[] = [
  { src: "/images/gallery/SLIoT2025/finals/1.jpeg", year: 2025, event: "Grand finale", n: 1 },
  { src: "/images/gallery/SLIoT2025/finals/4.jpeg", year: 2025, event: "Champions", n: 4 },
  { src: "/images/gallery/SLIoT2025/schoolworkshop/1.jpg", year: 2025, event: "School workshop", n: 1 },
  { src: "/images/gallery/SLIoT2025/semi/1.jpg", year: 2025, event: "Semi-finals", n: 1 },
  { src: "/images/gallery/SLIoT2025/uniworkshop/1.jpg", year: 2025, event: "University workshop", n: 1 },
  { src: "/images/gallery/SLIoT2023/1.jpg", year: 2023, event: "SLIoT 2023", n: 1 },
  { src: "/images/gallery/SLIoT2019/1.jpg", year: 2019, event: "SLIoT 2019", n: 1 },
];

export const albumBackdropSrc = "/images/gallery/SLIoT2022/1.jpg";

export function editionPhotos(edition: Edition): Photo[] {
  return edition.albums.flatMap((a) =>
    Array.from({ length: a.count }, (_, i) => ({
      src: `/images/gallery/${a.folder}/${i + 1}.${a.ext}`,
      year: edition.year,
      event: a.event,
      n: i + 1,
    })),
  );
}

/** "All": a mix that leads with the most recent finale, then a few from every edition */
export function mixedPhotos(): Photo[] {
  const lists = editions.map(editionPhotos);
  const mixed: Photo[] = [];
  const longest = Math.max(...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) for (const list of lists) if (list[i]) mixed.push(list[i]);
  return mixed;
}

export function photoAlt(p: Photo): string {
  return `${p.event}, SLIoT ${p.year} (photo ${p.n})`;
}
