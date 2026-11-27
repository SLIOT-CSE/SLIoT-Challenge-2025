import type { Metadata } from "next";
import { AppHeader } from "@/components/app/app-header";
import { TeamPortal } from "@/components/team/team-portal";

export const metadata: Metadata = {
  title: "Team portal",
  description: "Log in with your team code to submit your SLIoT Challenge 2027 proposal and prototype.",
  robots: { index: false, follow: true },
};

export default function TeamPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-24 sm:px-8 sm:pt-8">
        <TeamPortal />
      </main>
    </>
  );
}
