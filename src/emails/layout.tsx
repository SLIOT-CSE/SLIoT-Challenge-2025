import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "react-email";
import { socials } from "@/content/socials";

// Shared Double-Bezel dark-aurora email layout (lightweight inline tables & PNG icons for
// universal Gmail/Outlook rendering without client-stripped SVG tags or webfont bloat).

export const colors = {
  abyss: "#010610",
  shell: "#041224",
  night: "#011225",
  surface: "#062036",
  deep: "#022c3d",
  borderOuter: "#0c4f63",
  borderInner: "#14495e",
  codeBorder: "#1c657a",
  divider: "#0b3d50",
  mint: "#73dabe",
  aqua: "#85fff0",
  foam: "#ddf7ef",
  body: "#cde6e4",
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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.abyss, margin: 0, padding: "16px 8px", fontFamily: font }}>
        {/* Double-Bezel outer tray */}
        <Container
          style={{
            maxWidth: 580,
            margin: "0 auto",
            backgroundColor: colors.shell,
            border: `1px solid ${colors.borderOuter}`,
            borderRadius: 18,
            padding: 4,
          }}
        >
          {/* Inner machined plate wrapped in rounded overflow-hidden container so top bar clips cleanly */}
          <div
            style={{
              backgroundColor: colors.night,
              border: `1px solid ${colors.borderInner}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
              <tbody>
                {/* Top aurora hairline accent */}
                <tr>
                  <td
                    style={{
                      height: 3,
                      fontSize: 0,
                      lineHeight: 0,
                      backgroundColor: colors.mint,
                      backgroundImage: `linear-gradient(90deg, ${colors.deep} 0%, ${colors.mint} 35%, ${colors.aqua} 50%, ${colors.mint} 65%, ${colors.deep} 100%)`,
                    }}
                  >
                    &nbsp;
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "22px 18px 20px" }}>
                    {/* Header: full SLIoT wordmark badge + organizer title */}
                    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                      <tbody>
                        <tr>
                          <td style={{ width: 126, verticalAlign: "middle" }}>
                            <div
                              style={{
                                display: "inline-block",
                                backgroundColor: colors.surface,
                                border: `1px solid ${colors.borderInner}`,
                                borderRadius: 10,
                                padding: "7px 8px",
                              }}
                            >
                              <Img
                                src={`${siteUrl}/images/email/sliot-logo.png`}
                                alt="SLIoT Challenge 2027"
                                width={108}
                                height={36}
                                style={{ display: "block", width: 108, height: "auto" }}
                              />
                            </div>
                          </td>
                          <td style={{ paddingLeft: 12, verticalAlign: "middle" }}>
                            <Text
                              style={{
                                color: colors.mint,
                                fontSize: 13,
                                fontWeight: 700,
                                lineHeight: "17px",
                                margin: 0,
                              }}
                            >
                              SLIoT Challenge 2027
                            </Text>
                            <Text style={{ color: colors.haze, fontSize: 11, lineHeight: "15px", margin: "2px 0 0" }}>
                              Department of Computer Science &amp; Engineering
                            </Text>
                            <Text style={{ color: colors.haze, fontSize: 11, lineHeight: "15px", margin: 0 }}>
                              University of Moratuwa
                            </Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <Hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "18px 0 20px" }} />

                    <Heading
                      as="h1"
                      style={{
                        color: colors.foam,
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: "29px",
                        letterSpacing: "-0.01em",
                        margin: "0 0 14px",
                      }}
                    >
                      {heading}
                    </Heading>

                    <Section style={{ color: colors.body, fontSize: 15, lineHeight: "24px" }}>{children}</Section>

                    {action && (
                      <Section style={{ margin: "22px 0 4px" }}>
                        <Button
                          href={action.href}
                          style={{
                            display: "inline-block",
                            backgroundColor: colors.mint,
                            color: colors.abyss,
                            fontWeight: 700,
                            fontSize: 14,
                            lineHeight: "20px",
                            textAlign: "center",
                            borderRadius: 999,
                            padding: "12px 20px",
                            textDecoration: "none",
                          }}
                        >
                          {action.label}
                        </Button>
                      </Section>
                    )}

                    <Hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "24px 0 18px" }} />

                    {/* Footer */}
                    <Text style={{ color: colors.haze, fontSize: 12, lineHeight: "19px", margin: 0 }}>
                      SLIoT Challenge · Department of Computer Science &amp; Engineering, University of Moratuwa.
                    </Text>
                    <Text style={{ color: colors.haze, fontSize: 12, lineHeight: "19px", margin: "3px 0 14px" }}>
                      Questions? Reply to this email and we&rsquo;ll be happy to help.
                    </Text>

                    {/* Circular social icon buttons matching site footer */}
                    <table cellPadding={0} cellSpacing={0} role="presentation">
                      <tbody>
                        <tr>
                          {socials.map((s, i) => (
                            <td key={s.id} style={{ paddingLeft: i > 0 ? 7 : 0 }}>
                              <table cellPadding={0} cellSpacing={0} role="presentation">
                                <tbody>
                                  <tr>
                                    <td
                                      style={{
                                        width: 34,
                                        height: 34,
                                        textAlign: "center",
                                        verticalAlign: "middle",
                                        backgroundColor: colors.surface,
                                        border: `1px solid ${colors.borderOuter}`,
                                        borderRadius: 999,
                                      }}
                                    >
                                      <Link
                                        href={s.url}
                                        title={s.label}
                                        style={{
                                          display: "block",
                                          width: 34,
                                          padding: "9px 0",
                                          lineHeight: 0,
                                          textDecoration: "none",
                                        }}
                                      >
                                        <Img
                                          src={`${siteUrl}/images/email/social-${s.id}.png`}
                                          alt={s.label}
                                          width={16}
                                          height={16}
                                          style={{ display: "block", margin: "0 auto", width: 16, height: 16 }}
                                        />
                                      </Link>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>

                    <Text
                      style={{
                        color: colors.mint,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        lineHeight: "16px",
                        margin: "14px 0 0",
                      }}
                    >
                      Reconnecting ideas. Rebuilding the Grid
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      </Body>
    </Html>
  );
}

export const p = { margin: "0 0 14px" };

/** The team code inside a nested Double-Bezel telemetry readout (stays single-line down to 320 px) */
export function CodeBox({ code }: { code: string }) {
  return (
    <div
      style={{
        backgroundColor: colors.shell,
        border: `1px solid ${colors.borderOuter}`,
        borderRadius: 14,
        padding: 4,
        margin: "8px 0 18px",
      }}
    >
      <div
        style={{
          backgroundColor: colors.deep,
          border: `1px solid ${colors.codeBorder}`,
          borderRadius: 10,
          padding: "14px 8px 16px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            color: colors.mint,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            lineHeight: "14px",
            margin: "0 0 6px",
            textTransform: "uppercase",
          }}
        >
          Team access code
        </Text>
        <Text
          style={{
            color: colors.aqua,
            fontFamily: "'Courier New', Consolas, monospace",
            fontSize: 21,
            letterSpacing: 1.5,
            fontWeight: 700,
            lineHeight: "28px",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {code}
        </Text>
      </div>
    </div>
  );
}
