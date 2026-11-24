import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SampleDataDemo } from "./demo";
import { SampleSwitcher } from "@/components/dev/sample-switcher";

export const metadata: Metadata = { title: "Sample data", robots: { index: false, follow: false } };

// Dev-only: a live readout of the sample store beside the switcher, to check the data layer
// before the app screens exist.
export default function SampleDataPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 sm:px-8">
      <h1 className="font-display text-display-md">Sample data</h1>
      <SampleDataDemo />
      <SampleSwitcher />
    </main>
  );
}
