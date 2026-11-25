import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { address, contacts, type Person } from "@/content/people";
import { socials, whatsappChannel } from "@/content/socials";
import { SocialIcon } from "@/components/site/social-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A framed surface: a faint outer tray holding a solid inner plate, with matching curves
const SHELL = "rounded-2xl bg-foam/[0.04] p-1.5 ring-1 ring-foam/10";
const PLATE = "h-full rounded-photo bg-night shadow-[inset_0_1px_0_rgb(221_247_239/0.08)]";

const otherSocials = socials.filter((s) => s.id !== whatsappChannel.id);

/** Contact: the organizers to reach, the department's address and the official channels */
export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-hidden py-20 md:py-32">
      {/* Aurora light behind the portraits and a fine grain, both fading out before the edges */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_18%_30%,rgb(31_150_150/0.24),transparent_100%),radial-gradient(50%_45%_at_84%_58%,rgb(16_82_140/0.34),transparent_100%)]" />
        <div className="grain absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <header className="flex max-w-3xl flex-col gap-4">
          <h2 id="contact-title" className="text-balance font-display text-display-lg text-foam">
            Talk to the organizers
          </h2>
          <p className="max-w-[54ch] text-pretty text-body-lg text-haze">
            Questions about your team, the rules or a submission? Message or email one of the organizers below.
          </p>
        </header>

        <ul className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-6">
          {contacts.map((p) => (
            <PersonCard key={p.email} person={p} />
          ))}
        </ul>

        <FollowBanner />

        {/* Where to find the department, and the other channels: quiet, on the page itself */}
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-foam/5 text-mint ring-1 ring-foam/15">
              <MapPin className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <address className="text-small not-italic text-haze">
                <span className="block text-pretty font-semibold text-foam">{address.lines[0]}</span>
                <span className="block text-pretty">{address.lines.slice(1).join(", ")}</span>
              </address>
              <a
                href={address.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-mint underline-offset-4 hover:underline"
              >
                Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 ease-out-quart group-hover:-translate-y-px group-hover:translate-x-0.5 motion-reduce:transition-none"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          <ul className="flex shrink-0 flex-wrap gap-2" aria-label="More SLIoT channels">
            {otherSocials.map((s) => (
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
        </div>
      </div>
    </section>
  );
}

/** The one loud thing under the cards: announcements land on the WhatsApp channel first */
function FollowBanner() {
  return (
    <div className={`${SHELL} mt-4 lg:mt-6`}>
      <div className="relative isolate overflow-hidden rounded-photo bg-night bg-[radial-gradient(70%_130%_at_85%_50%,rgb(31_150_150/0.5),rgb(11_90_109/0.18)_55%,transparent_100%)] shadow-[inset_0_1px_0_rgb(221_247_239/0.1)]">
        {/* A signal going out: rings spreading from one node at the right edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-1/2 -z-10 hidden size-80 -translate-y-1/2 place-items-center sm:right-6 sm:grid"
        >
          <span className="absolute size-full rounded-full border border-mint/10" />
          <span className="absolute size-3/4 rounded-full border border-mint/20" />
          <span className="absolute size-1/2 rounded-full border border-mint/30" />
          <span className="absolute size-1/4 rounded-full border border-aqua/45" />
          <span className="grid size-14 place-items-center rounded-full bg-mint text-abyss shadow-signal">
            <SocialIcon id={whatsappChannel.id} />
          </span>
        </div>

        <div className="flex flex-col items-start gap-6 p-5 sm:max-w-[34rem] sm:p-10">
          <div className="flex flex-col gap-3">
            <h3 className="text-balance font-display text-display-md text-foam">Follow SLIoT</h3>
            <p className="max-w-[38ch] text-pretty text-body text-haze">
              Announcements land on the WhatsApp channel first.
            </p>
          </div>
          <Button asChild size="sm" trailingIcon={<ArrowUpRight className="size-4" strokeWidth={1.5} />}>
            <a href={whatsappChannel.url} target="_blank" rel="noopener noreferrer">
              Follow on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** A compact row on phones and tablets, a portrait card from the lg breakpoint */
function PersonCard({ person: p }: { person: Person }) {
  const initials = p.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const zoom = p.framing?.zoom ?? 1;
  const [user, domain] = p.email.split("@");

  return (
    <li className={`${SHELL} group min-w-0 transition-[box-shadow] duration-500 ease-out-quart hover:ring-mint/35`}>
      <div
        className={`${PLATE} grid grid-cols-[5rem_minmax(0,1fr)] content-start items-center gap-x-4 gap-y-3 p-3 lg:flex lg:flex-col lg:items-stretch lg:gap-0 lg:p-0`}
      >
        <div className="relative aspect-square overflow-hidden rounded-photo lg:aspect-[5/4] lg:rounded-b-none">
          {p.photo ? (
            <>
              <div
                className="absolute inset-0"
                style={p.framing && { scale: String(zoom), transformOrigin: p.framing.origin }}
              >
                <Image
                  src={p.photo}
                  alt=""
                  fill
                  // A zoomed photo needs a larger source to stay sharp
                  sizes={`(min-width: 1024px) ${Math.ceil(19 * zoom)}rem, ${Math.ceil(5 * zoom)}rem`}
                  className="object-cover object-top saturate-[0.82] transition-[scale,filter] duration-700 ease-out-quart group-hover:scale-[1.04] group-hover:saturate-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              {/* The foot of the portrait melts into the plate */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-night to-transparent lg:block"
              />
            </>
          ) : (
            <span
              aria-hidden="true"
              className="grid size-full place-items-center bg-gradient-to-br from-reef to-deep font-display text-[2rem] text-foam lg:text-[5rem]"
            >
              {initials}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1 lg:relative lg:-mt-5 lg:px-4">
          <h3 className="text-pretty text-body-lg font-semibold text-foam lg:text-title">{p.name}</h3>
          <p className="text-small text-haze">{p.role}</p>
        </div>

        <div className="col-span-2 flex min-w-0 flex-col gap-2 lg:mt-auto lg:p-3 lg:pt-4">
          {p.whatsapp && (
            <ContactLink
              href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`}
              label={`WhatsApp ${p.name}`}
              external
              icon={<SocialIcon id="whatsapp" />}
              iconClassName="bg-mint text-abyss"
            >
              {p.whatsapp}
            </ContactLink>
          )}
          <ContactLink
            href={`mailto:${p.email}`}
            label={`Email ${p.name}`}
            icon={<Mail className="size-4" strokeWidth={1.5} />}
            iconClassName="bg-foam/10 text-mint"
          >
            {/* If it has to wrap, it wraps at the @ */}
            {user}
            <wbr />@{domain}
          </ContactLink>
        </div>
      </div>
    </li>
  );
}

/** One way to reach a person: the whole pill is the link, and it shows the number or address */
function ContactLink({
  href,
  label,
  external = false,
  icon,
  iconClassName,
  children,
}: {
  href: string;
  /** What the link does, read before the number or address */
  label: string;
  external?: boolean;
  icon: ReactNode;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-12 min-w-0 items-center gap-3 rounded-full bg-foam/5 py-1.5 pl-1.5 pr-3 text-caption font-semibold text-foam ring-1 ring-foam/15 transition-[background-color,scale,box-shadow] duration-300 ease-out-quart hover:bg-foam/10 hover:ring-mint/40 active:scale-[0.98] motion-reduce:transition-none"
    >
      <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-full", iconClassName)}>
        {icon}
      </span>
      <span className="sr-only">{label}: </span>
      <span className="min-w-0 break-words">{children}</span>
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
