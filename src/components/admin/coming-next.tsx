"use client";

import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SuperOnly } from "./super-only";

/** Stands in for a super-admin screen until its slice is built. Delete once all five exist. */
export function ComingNext({ title, slice }: { title: string; slice: string }) {
  return (
    <SuperOnly>
      <div className="flex flex-col gap-6">
        <PageHeader title={title} />
        <EmptyState icon={<Hammer />} title="Not built yet" description={`This screen arrives in ${slice} of the admin dashboard.`} />
      </div>
    </SuperOnly>
  );
}
