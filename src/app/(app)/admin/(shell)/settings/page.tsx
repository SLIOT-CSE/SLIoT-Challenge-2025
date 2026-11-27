import type { Metadata } from "next";
import { SuperOnly } from "@/components/admin/super-only";
import { SettingsScreen } from "@/components/admin/settings/settings-screen";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <SuperOnly>
      <SettingsScreen />
    </SuperOnly>
  );
}
