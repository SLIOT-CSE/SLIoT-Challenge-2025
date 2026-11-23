"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { navigation, routes } from "@/content/navigation";
import { socials } from "@/content/socials";
import { logo } from "@/assets";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/site/social-icon";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";

/**
 * Floating pill navigation for the one-page site.
 * - Highlights the section in view (a mint pill slides between links).
 * - Slides away while scrolling down, returns on scroll up.
 * - Below 1280px the links move into a full-screen menu.
 */
export function SiteNav() {
  const active = useActiveSection();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    // React skips the re-render when the value does not change
    setHidden(y > previous && y > 160);
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-nav flex justify-center px-3 sm:top-4 sm:px-4">
      <motion.nav
        aria-label="Main"
        initial={false}
        animate={{ y: hidden && !menuOpen ? "-140%" : "0%" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT_EXPO }}
        className="pointer-events-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-full bg-night/70 p-1.5 pl-4 shadow-lift ring-1 ring-foam/10 backdrop-blur-xl sm:pl-5"
      >
        <a href="#top" className="flex shrink-0 items-center rounded-full py-1" aria-label="SLIoT Challenge, back to top">
          <img src={logo} alt="" width={1518} height={813} className="h-7 w-auto sm:h-8" />
        </a>

        <ul className="hidden items-center gap-0.5 xl:flex">
          {navigation.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className="relative">
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative z-10 block rounded-full px-3.5 py-2 text-small font-medium transition-colors duration-200 ease-out-quart",
                    isActive ? "text-mint" : "text-haze hover:text-foam",
                  )}
                >
                  {item.label}
                </a>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-mint/12 ring-1 ring-mint/25"
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT_EXPO }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href={routes.teamPortal}>Team login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={routes.register}>
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Register your team</span>
            </Link>
          </Button>
          <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} active={active} />
        </div>
      </motion.nav>
    </header>
  );
}

/** The section currently in the middle of the screen, from IntersectionObserver */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = navigation
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // A thin band across the middle of the screen decides which section is "in view"
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    // Above the first section nothing is active
    const onScroll = () => {
      if (window.scrollY < sections[0].offsetTop - window.innerHeight / 2) setActive(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return active;
}

function MobileMenu({
  open,
  onOpenChange,
  active,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: string | null;
}) {
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();

  // Freeze smooth scrolling behind the menu
  useEffect(() => {
    if (open) lenis.current?.stop();
    else lenis.current?.start();
  }, [open, lenis]);

  const goTo = (id: string) => {
    onOpenChange(false);
    // Wait for the menu to close (and scrolling to resume) before moving
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      if (lenis.current) lenis.current.scrollTo(target, { offset: -96 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }, 60);
  };

  const linkMotion = (i: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { y: "110%" },
          animate: { y: "0%" },
          transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.08 + i * 0.05 },
        };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="relative grid size-11 place-items-center rounded-full text-foam transition-colors duration-200 ease-out-quart hover:bg-foam/10 xl:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-overlay bg-abyss/80 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT_QUART }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <motion.div
                className="fixed inset-0 z-dialog flex flex-col overflow-y-auto px-5 pb-8 pt-4 sm:px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT_QUART }}
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex items-center justify-between pl-1">
                  <img src={logo} alt="SLIoT Challenge" width={1518} height={813} className="h-8 w-auto" />
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="grid size-11 place-items-center rounded-full text-foam ring-1 ring-foam/15 transition-colors duration-200 hover:bg-foam/10"
                    >
                      <MenuIcon open />
                    </button>
                  </Dialog.Close>
                </div>

                <nav aria-label="Sections" className="mt-10 flex-1">
                  <ul className="flex flex-col gap-1">
                    {navigation.map((item, i) => (
                      <li key={item.id} className="overflow-hidden">
                        <motion.a
                          href={`#${item.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            goTo(item.id);
                          }}
                          aria-current={active === item.id ? "true" : undefined}
                          className={cn(
                            "block py-1 font-display text-[clamp(2.75rem,12vw,4.5rem)] leading-none transition-colors duration-200",
                            active === item.id ? "text-mint" : "text-foam hover:text-mint",
                          )}
                          {...linkMotion(i)}
                        >
                          {item.label}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </nav>

                <motion.div
                  className="mt-10 flex flex-col gap-6"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: reduceMotion ? 0 : 0.35 }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}>
                      <Link href={routes.register}>Register your team</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                      <Link href={routes.teamPortal}>Team login</Link>
                    </Button>
                  </div>
                  <ul className="flex flex-wrap gap-2" aria-label="Follow SLIoT">
                    {socials.map((s) => (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${s.label} (opens in a new tab)`}
                          className="grid size-11 place-items-center rounded-full bg-foam/5 text-foam ring-1 ring-foam/15 transition-colors duration-200 hover:bg-foam/10 hover:text-mint"
                        >
                          <SocialIcon id={s.id} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Two bars that turn into an X */
function MenuIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out-expo motion-reduce:transition-none";
  return (
    <span aria-hidden="true" className="relative block h-3 w-5">
      <span className={cn(bar, "top-0", open && "translate-y-[5px] rotate-45")} />
      <span className={cn(bar, "bottom-0", open && "-translate-y-[5px] -rotate-45")} />
    </span>
  );
}
