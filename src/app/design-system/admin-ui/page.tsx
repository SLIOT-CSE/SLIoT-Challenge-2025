import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminUiGallery } from "./gallery";

export const metadata: Metadata = { title: "Admin UI", robots: { index: false, follow: false } };

// Dev-only: every primitive the admin screens use, in each state, to check them in the
// browser before the screens exist.
export default function AdminUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 sm:px-8">
      <h1 className="font-display text-display-md">Admin UI</h1>
      <AdminUiGallery />
    </main>
  );
}
