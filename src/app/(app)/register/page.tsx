import type { Metadata } from "next";
import { AppHeader } from "@/components/app/app-header";
import { RegisterForm } from "@/components/register/register-form";
import { HeroNebula } from "@/components/site/hero-nebula";
import { categories } from "@/content/categories";
import type { CategoryId } from "@/lib/team-rules";

export const metadata: Metadata = {
  title: "Register your team",
  description: "Register your team for the SLIoT Challenge 2027, Sri Lanka's national IoT competition.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  // The home page's category cards link here with ?category=school (or university, open)
  const { category } = await searchParams;
  const asked = Array.isArray(category) ? category[0] : category;
  const initialCategory: "" | CategoryId = categories.find((c) => c.id === asked)?.id ?? "";

  return (
    // isolate: the particle layer sits at -z-10 inside this box, above the page background
    <div className="relative isolate">
      {/* The home hero's particle field, sparser and dimmer so the form stays the focus */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(44rem,100svh)] overflow-hidden">
        <HeroNebula density={0.7} intensity={0.75} />
      </div>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-4 pb-24 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-display-lg text-foam">Register your team</h1>
          <p className="max-w-[56ch] text-body-lg text-haze">
            Four short steps. You need each member&apos;s name, WhatsApp number and email, and a NIC for every
            university student.
          </p>
        </div>
        <RegisterForm initialCategory={initialCategory} />
      </main>
    </div>
  );
}
