import type { Metadata } from "next";
import { EmailsScreen } from "@/components/admin/emails/emails-screen";

export const metadata: Metadata = { title: "Emails" };

export default function Page() {
  return <EmailsScreen />;
}
