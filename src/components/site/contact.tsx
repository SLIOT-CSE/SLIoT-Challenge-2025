import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { address, contacts, type Person } from "@/content/people";
import { socials, whatsappChannel } from "@/content/socials";
import { SocialIcon } from "@/components/site/social-icon";
import { cn } from "@/lib/utils";

// A framed surface: a faint outer tray holding a solid inner plate, with matching curves
const SHELL = "rounded-2xl bg-foam/[0.04] p-1.5 ring-1 ring-foam/10";
const PLATE = "h-full rounded-photo bg-night shadow-[inset_0_1px_0_rgb(221_247_239/0.08)]";

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

        {/* Where to find the department, and the official channels with WhatsApp first */}
        <div className={`${SHELL} mt-4 lg:mt-6`}>
          <div className={`${PLATE} flex flex-col gap-6 p-4 sm:p-8 md:flex-row md:items-center md:justify-between`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foam/5 text-mint ring-1 ring-foam/15 sm:size-11">
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
                  className="group inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-small font-semibold text-mint underline-offset-4 hover:underline"
                >
                  Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                  <ArrowUpRight
                    className="size-4 shrink-0 transition-transform duration-300 ease-out-quart group-hover:-translate-y-px group-hover:translate-x-0.5 motion-reduce:transition-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </a>
              </div>
            </div>

            <ul
              className="grid w-fit shrink-0 grid-cols-3 gap-2 min-[360px]:flex min-[360px]:flex-wrap min-[360px]:gap-1 sm:gap-2"
              aria-label="Follow SLIoT"
            >
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} (opens in a new tab)`}
                    title={s.label}
                    className={cn(
                      "grid size-11 place-items-center rounded-full ring-1 transition-colors duration-200",
                      s.id === whatsappChannel.id
                        ? "bg-mint text-abyss ring-mint hover:bg-aqua"
                        : "bg-foam/5 text-foam ring-foam/15 hover:bg-foam/10 hover:text-mint",
                    )}
                  >
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
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

  return (
    <li className={`${SHELL} group min-w-0 transition-[box-shadow] duration-500 ease-out-quart hover:ring-mint/35`}>
      <div
        className={`${PLATE} grid grid-cols-[5.25rem_minmax(0,1fr)] content-start items-center gap-x-3.5 p-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-4 lg:flex lg:flex-col lg:items-stretch lg:gap-0 lg:p-0`}
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
                  sizes={`(min-width: 1024px) ${Math.ceil(19 * zoom)}rem, ${Math.ceil(6 * zoom)}rem`}
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

        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 md:pr-2 lg:relative lg:-mt-5 lg:flex-col lg:items-stretch lg:gap-4 lg:px-4 lg:pb-4 lg:pr-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-pretty text-body-lg font-semibold text-foam lg:text-title">{p.name}</h3>
            <p className="text-small text-haze">{p.role}</p>
          </div>

          <div className="flex shrink-0 gap-2">
            {p.whatsapp && (
              <ContactIcon
                href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`}
                label={`WhatsApp ${p.name} (opens in a new tab)`}
                external
                className="bg-mint text-abyss ring-mint hover:bg-aqua"
              >
                <SocialIcon id="whatsapp" />
              </ContactIcon>
            )}
            <ContactIcon
              href={`mailto:${p.email}`}
              label={`Email ${p.name}`}
              className="bg-foam/5 text-mint ring-foam/15 hover:bg-foam/10 hover:ring-mint/40"
            >
              <Mail className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </ContactIcon>
          </div>
        </div>
      </div>
    </li>
  );
}

/** One way to reach a person, as a round icon. The label names it for screen readers and on hover */
function ContactIcon({
  href,
  label,
  external = false,
  className,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full ring-1 transition-[background-color,scale,box-shadow] duration-300 ease-out-quart active:scale-[0.96] motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </a>
  );
}
