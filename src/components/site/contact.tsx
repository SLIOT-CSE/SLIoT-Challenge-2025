import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { address, contacts, type Person } from "@/content/people";
import { socials } from "@/content/socials";
import { SocialIcon } from "@/components/site/social-icon";

/** Contact: the organizers to reach, the department's address and the official channels */
export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="flex max-w-3xl flex-col gap-4">
          <h2 id="contact-title" className="font-display text-display-lg text-foam">
            Talk to the organizers
          </h2>
          <p className="max-w-[54ch] text-pretty text-body-lg text-haze">
            Questions about your team, the rules or a submission? Email one of the organizers below.
          </p>
        </header>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((p) => (
            <PersonCard key={p.email} person={p} />
          ))}
        </ul>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <a
            href={address.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-panel bg-night p-6 ring-1 ring-ocean transition-colors hover:bg-deep/60"
          >
            <MapPin className="mt-0.5 size-5 shrink-0 text-mint" strokeWidth={1.75} aria-hidden="true" />
            <address className="text-body not-italic text-haze">
              {address.lines.map((line, i) => (
                <span key={line} className={i === 0 ? "block font-semibold text-foam" : "block"}>
                  {line}
                </span>
              ))}
              <span className="mt-2 block text-small font-semibold text-mint group-hover:underline">
                Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
              </span>
            </address>
          </a>

          <div className="flex flex-col gap-4 rounded-panel bg-night p-6 ring-1 ring-ocean">
            <p className="text-body font-semibold text-foam">Follow SLIoT</p>
            <p className="text-small text-haze">Announcements land on the WhatsApp channel first.</p>
            <ul className="mt-auto flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonCard({ person: p }: { person: Person }) {
  const initials = p.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <li className="flex items-center gap-5 rounded-panel bg-night p-5 ring-1 ring-ocean">
      {p.photo ? (
        <Image
          src={p.photo}
          alt=""
          width={160}
          height={160}
          sizes="5rem"
          className="size-20 shrink-0 rounded-full object-cover ring-2 ring-ocean"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-reef to-deep font-display text-[2rem] text-foam ring-2 ring-ocean"
        >
          {initials}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-lg font-semibold text-foam">{p.name}</p>
        <p className="text-small text-haze">{p.role}</p>
        <a
          href={`mailto:${p.email}`}
          className="mt-1 inline-flex min-w-0 items-center gap-2 text-small font-semibold text-mint underline-offset-4 hover:underline"
        >
          <Mail className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">{p.email}</span>
        </a>
      </div>
    </li>
  );
}
