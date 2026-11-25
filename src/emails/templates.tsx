import { Text } from "react-email";
import { CodeBox, Layout, p, type EmailContext } from "./layout";

// The six emails (docs/architecture.md, section 7). Each takes the props stored in the outbox
// row plus the EmailContext added at send time, and has a subject.

type Props<T> = T & EmailContext;

const portal = (siteUrl: string) => `${siteUrl}/team`;

export function RegistrationConfirmed({ teamName, code, siteUrl }: Props<{ teamName: string; code: string }>) {
  return (
    <Layout
      preview={`You're registered. Your team code is ${code}`}
      heading="You're registered!"
      siteUrl={siteUrl}
      action={{ label: "Open the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>
        <strong>{teamName}</strong> is now registered for the SLIoT Challenge 2027. This is your team code:
      </Text>
      <CodeBox code={code} />
      <Text style={p}>
        Keep it safe and share it only with your team. You need it to log in to the team portal and upload your proposal.
      </Text>
    </Layout>
  );
}

export function CodeReminder({ teamName, code, siteUrl }: Props<{ teamName: string; code: string }>) {
  return (
    <Layout
      preview={`Your SLIoT team code is ${code}`}
      heading="Your team code"
      siteUrl={siteUrl}
      action={{ label: "Log in to the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>Here is the team code for {teamName}:</Text>
      <CodeBox code={code} />
      <Text style={p}>If you didn&rsquo;t ask for this, you can ignore this email. The code only goes to the team leader.</Text>
    </Layout>
  );
}

export function ProposalReceived({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview="We received your proposal"
      heading="Proposal received"
      siteUrl={siteUrl}
      action={{ label: "See it in the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>
        We received a proposal from <strong>{teamName}</strong>. You can replace it with a new version until the deadline;
        the newest one is the one judged.
      </Text>
      <Text style={p}>If nobody in your team uploaded this, reply to this email straight away.</Text>
    </Layout>
  );
}

export function Shortlisted({ teamName, prototypeDue, siteUrl }: Props<{ teamName: string; prototypeDue: string }>) {
  return (
    <Layout
      preview={`${teamName} is shortlisted for the SLIoT Challenge 2027`}
      heading="You're shortlisted!"
      siteUrl={siteUrl}
      action={{ label: "Submit your prototype", href: portal(siteUrl) }}
    >
      <Text style={p}>
        Congratulations: <strong>{teamName}</strong> made the shortlist. The next round is your prototype.
      </Text>
      <Text style={p}>
        Build it, record a short video, upload it to YouTube as public or unlisted, and paste the link in the team portal by{" "}
        <strong>{prototypeDue}</strong>.
      </Text>
    </Layout>
  );
}

export function PrototypeReceived({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview="We received your prototype video"
      heading="Prototype received"
      siteUrl={siteUrl}
      action={{ label: "See it in the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>
        We received the prototype video link from <strong>{teamName}</strong>. You can replace it until the deadline.
      </Text>
      <Text style={p}>If nobody in your team submitted this, reply to this email straight away.</Text>
    </Layout>
  );
}

export function Finalist({ teamName, finale, siteUrl }: Props<{ teamName: string; finale: string }>) {
  return (
    <Layout
      preview={`${teamName} is a finalist!`}
      heading="You're a finalist!"
      siteUrl={siteUrl}
      action={{ label: "Open the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>
        <strong>{teamName}</strong> is through to the grand finale on <strong>{finale}</strong>. We&rsquo;ll be in touch with the
        details soon.
      </Text>
    </Layout>
  );
}
