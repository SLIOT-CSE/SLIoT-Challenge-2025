import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prizes } from "@/components/site/prizes";

export const metadata: Metadata = { title: "Prizes preview", robots: { index: false, follow: false } };

// Made-up amounts, only to review the count-up and layout. Never copy these into content.
const SAMPLE = {
  school: { first: 100000, second: 75000, third: 50000 },
  university: { first: 250000, second: 150000, third: 100000 },
  open: { first: 200000, second: 125000, third: 75000 },
};

export default function PrizesPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="pt-10">
      <p className="mx-auto max-w-7xl px-4 text-caption text-danger sm:px-8">Sample amounts for review only</p>
      <Prizes amounts={SAMPLE} />
    </main>
  );
}
