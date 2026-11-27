import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamsScreen } from "@/components/admin/teams/teams-screen";

export const metadata: Metadata = { title: "Teams" };

export default function AdminTeamsPage() {
  // The screen keeps its filters in the address (useSearchParams), which needs a Suspense boundary
  return (
    <Suspense fallback={null}>
      <TeamsScreen />
    </Suspense>
  );
}
