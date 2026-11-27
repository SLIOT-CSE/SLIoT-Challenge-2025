import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-4 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(115_218_190/0.16),transparent)]"
      />
      <div className="relative flex flex-col items-center gap-5">
        <p className="font-display text-[clamp(6rem,24vw,13rem)] leading-none text-foam">404</p>
        <h1 className="text-title font-semibold text-foam">This page does not exist</h1>
        <p className="max-w-[44ch] text-body text-haze">
          The link may be old: the SLIoT site is now a single page. Everything is on the home page.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/">Go to the home page</Link>
        </Button>
      </div>
    </main>
  );
}
