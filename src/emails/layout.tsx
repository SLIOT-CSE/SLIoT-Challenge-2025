import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "react-email";
import { socials } from "@/content/socials";

// The layout every SLIoT email shares (docs/architecture.md, section 7): logo, heading, message,
// one clear button and a footer. Inline styles from the site's aurora palette, since email
// clients ignore most CSS.

export const colors = {
  abyss: "#010610",
  night: "#011225",
  deep: "#023649",
  mint: "#73dabe",
  aqua: "#85fff0",
  foam: "#ddf7ef",
  haze: "#a9c7cc",
};

const font = "Montserrat, 'Segoe UI', Helvetica, Arial, sans-serif";

/** What every template receives besides its own props, filled in at send time */
export interface EmailContext {
  /** e.g. https://sliot.cse.mrt.ac.lk */
  siteUrl: string;
}

export function Layout({
  preview,
  heading,
  siteUrl,
  action,
  children,
}: {
  preview: string;
  heading: string;
  siteUrl: string;
  action?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.abyss, margin: 0, padding: "24px 12px", fontFamily: font }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: colors.night, borderRadius: 16, padding: "32px 28px" }}>
          {/* PNG, not the SVG wordmark: Gmail and Outlook don't show SVG */}
          <Img src={`${siteUrl}/icon.png`} alt="SLIoT Challenge" width={48} height={48} style={{ borderRadius: 12 }} />
          <Text style={{ color: colors.mint, fontSize: 13, fontWeight: 700, lineHeight: "18px", margin: "16px 0 2px" }}>
            SLIoT Challenge 2027
          </Text>
          <Text style={{ color: colors.haze, fontSize: 12, lineHeight: "18px", margin: 0 }}>
            Department of Computer Science &amp; Engineering, University of Moratuwa
          </Text>
          <Heading as="h1" style={{ color: colors.foam, fontSize: 24, lineHeight: "32px", margin: "20px 0 16px" }}>
            {heading}
          </Heading>
          <Section style={{ color: colors.foam, fontSize: 16, lineHeight: "26px" }}>{children}</Section>
          {action && (
            <Section style={{ margin: "28px 0 8px" }}>
              <Button
                href={action.href}
                style={{
                  backgroundColor: colors.mint,
                  color: colors.abyss,
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 999,
                  padding: "14px 28px",
                  textDecoration: "none",
                }}
              >
                {action.label}
              </Button>
            </Section>
          )}
          <Hr style={{ borderColor: colors.deep, margin: "32px 0 20px" }} />
          <Text style={{ color: colors.haze, fontSize: 13, lineHeight: "20px", margin: 0 }}>
            SLIoT Challenge · Department of Computer Science &amp; Engineering, University of Moratuwa.
          </Text>
          <Text style={{ color: colors.haze, fontSize: 13, lineHeight: "20px", margin: "4px 0 0" }}>
            Questions? Reply to this email and we&rsquo;ll be happy to help.
          </Text>
          <Text style={{ color: colors.haze, fontSize: 13, lineHeight: "20px", margin: "8px 0 0" }}>
            {socials.map((s, i) => (
              <span key={s.id}>
                {i > 0 && " · "}
                <Link href={s.url} style={{ color: colors.mint }}>
                  {s.label}
                </Link>
              </span>
            ))}
          </Text>
          <Text style={{ color: colors.mint, fontSize: 12, lineHeight: "18px", margin: "12px 0 0" }}>
            Reconnecting ideas. Rebuilding the Grid
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const p = { margin: "0 0 16px" };

/** The team code, large and easy to copy */
export function CodeBox({ code }: { code: string }) {
  return (
    <Text
      style={{
        backgroundColor: colors.deep,
        color: colors.aqua,
        fontFamily: "'Courier New', monospace",
        fontSize: 28,
        letterSpacing: 2,
        fontWeight: 700,
        textAlign: "center",
        borderRadius: 12,
        padding: "16px 8px",
        margin: "8px 0 20px",
      }}
    >
      {code}
    </Text>
  );
}
