import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { logo } from "@/assets";
import { Button } from "@/components/ui/button";

/** Slim top bar for the app screens (/register, /team): the logo and a way back to the site */
export function AppHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6">
      <Link href="/" className="flex shrink-0 items-center rounded-full py-1" aria-label="SLIoT Challenge, home">
        <img src={logo} alt="" width={1518} height={813} className="h-8 w-auto sm:h-9" />
      </Link>
      <Button asChild variant="ghost" size="sm">
        <Link href="/">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to site
        </Link>
      </Button>
    </header>
  );
}
