import { Link, Text } from "react-email";
import { delegatesWhatsappByCategory } from "@/content/socials";
import type { CategoryId } from "@/lib/team-rules";
import { CodeBox, colors, Layout, p, type EmailContext } from "./layout";

// The eight templates (docs/SLIoT 2027 Email templates.md; docs/architecture.md, section 7).
// Each takes the props stored in the outbox row plus the EmailContext added at send time.

type Props<T> = T & EmailContext;

const portal = (siteUrl: string) => `${siteUrl}/team`;

export function RegistrationConfirmed({
  teamName,
  code,
  category = "open",
  siteUrl,
}: Props<{ teamName: string; code: string; category?: CategoryId }>) {
  return (
    <Layout
      preview={`${teamName} is now part of the SLIoT Challenge 2027.`}
      heading="Your journey begins!"
      siteUrl={siteUrl}
      action={{ label: "Join the WhatsApp Delegates Group", href: delegatesWhatsappByCategory[category] }}
    >
      <Text style={p}>
        Every journey begins with a first step. <strong>{teamName}</strong> is now officially registered for the SLIoT Challenge
        2027!
      </Text>
      <Text style={p}>Here is your team&rsquo;s access code:</Text>
      <CodeBox code={code} />
      <Text style={p}>
        <strong>Keep this code for future reference</strong> and share it only with your team members. It will serve as your
        login credential for the{" "}
        <Link href={portal(siteUrl)} style={{ color: colors.mint }}>
          team portal
        </Link>
        .
      </Text>
      <Text style={p}>Your journey starts here!</Text>
    </Layout>
  );
}

export function CodeReminder({ teamName, code, siteUrl }: Props<{ teamName: string; code: string }>) {
  return (
    <Layout
      preview="Your access code for the SLIoT Challenge 2027 team portal."
      heading="Your access to the network"
      siteUrl={siteUrl}
      action={{ label: "Return to the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>Need your way back into the network?</Text>
      <Text style={p}>
        Here is the team code for <strong>{teamName}</strong>:
      </Text>
      <CodeBox code={code} />
      <Text style={p}>
        <strong>Keep this code for future reference</strong> and share it only with your team members. It will serve as your
        login credential for the team portal.
      </Text>
      <Text style={p}>
        If you didn&rsquo;t request this email, you can safely ignore it. Your team code is sent only to the registered team
        leader.
      </Text>
    </Layout>
  );
}

export function ProposalReceived({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview={`We've received the proposal from ${teamName}.`}
      heading="Your idea has entered the network!"
      siteUrl={siteUrl}
      action={{ label: "View your submission", href: portal(siteUrl) }}
    >
      <Text style={p}>
        Every connection begins with a spark of innovation. This could be the beginning of something that brings the Grid one
        step closer to being rebuilt.
      </Text>
      <Text style={p}>
        We&rsquo;ve successfully received the proposal submitted by <strong>{teamName}</strong> for the SLIoT Challenge 2027.
      </Text>
      <Text style={p}>
        You can replace your proposal with a new version until the submission deadline. Only the latest version submitted will
        be considered for judging.
      </Text>
      <Text style={p}>
        If no one on your team submitted this proposal, please contact your assigned coordinator via WhatsApp immediately.
      </Text>
    </Layout>
  );
}

export function Shortlisted({ teamName, prototypeDue, siteUrl }: Props<{ teamName: string; prototypeDue: string }>) {
  return (
    <Layout
      preview={`${teamName} has made it to the next stage of the SLIoT Challenge 2027.`}
      heading="You've made the shortlist!"
      siteUrl={siteUrl}
      action={{ label: "Submit your prototype", href: portal(siteUrl) }}
    >
      <Text style={p}>One step closer to reconnecting the world!</Text>
      <Text style={p}>
        Congratulations! <strong>{teamName}</strong> has made it through the proposal evaluation stage and is officially
        shortlisted for the SLIoT Challenge 2027.
      </Text>
      <Text style={p}>Now it&rsquo;s time to bring your idea to life.</Text>
      <Text style={p}>
        Build your prototype, record a short demonstration video, upload it to YouTube as public or unlisted and submit the
        video link through your team portal by <strong>{prototypeDue}</strong>.
      </Text>
      <Text style={p}>The next chapter of your journey starts with your prototype.</Text>
    </Layout>
  );
}

export function PrototypeReceived({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview={`We've received the prototype video from ${teamName}.`}
      heading="Your prototype has arrived!"
      siteUrl={siteUrl}
      action={{ label: "View your prototype submission", href: portal(siteUrl) }}
    >
      <Text style={p}>The vision is taking shape, and your creation is coming to life!</Text>
      <Text style={p}>
        We&rsquo;ve successfully received the prototype video link submitted by <strong>{teamName}</strong> for the SLIoT
        Challenge 2027.
      </Text>
      <Text style={p}>You can replace your video link with an updated version until the submission deadline.</Text>
      <Text style={p}>If no one on your team submitted this link, please contact your assigned coordinator via WhatsApp.</Text>
    </Layout>
  );
}

export function PrototypeReminder({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview="Don't miss your chance to bring your idea to life."
      heading="Your prototype awaits!"
      siteUrl={siteUrl}
      action={{ label: "Submit your prototype", href: portal(siteUrl) }}
    >
      <Text style={p}>The vision is taking shape, and it&rsquo;s time to show the world what you&rsquo;ve been building!</Text>
      <Text style={p}>
        We noticed that <strong>{teamName}</strong> hasn&rsquo;t submitted a prototype demonstration video for the SLIoT
        Challenge 2027 yet.
      </Text>
      <Text style={p}>
        Build your prototype, record a short demonstration video, upload it to YouTube as public or unlisted, and submit the
        video link through your team portal.
      </Text>
      <Text style={p}>Don&rsquo;t let your hard work go unseen. Take the next step and bring your idea to life!</Text>
    </Layout>
  );
}

export function Semifinalist({ teamName, siteUrl }: Props<{ teamName: string }>) {
  return (
    <Layout
      preview={`${teamName} has made it to the Semi-Finals of the SLIoT Challenge 2027.`}
      heading="You've made it to the Semi Finals!"
      siteUrl={siteUrl}
      action={{ label: "Explore the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>The Grid is coming together, one innovation at a time!</Text>
      <Text style={p}>
        Congratulations! <strong>{teamName}</strong> has successfully made it through the prototype evaluation stage and has been
        selected as a Semi-Finalist of the SLIoT Challenge 2027.
      </Text>
      <Text style={p}>
        Your idea has evolved from a proposal into a working prototype, bringing you one step closer to rebuilding the Grid.
      </Text>
      <Text style={p}>The next challenge awaits! We&rsquo;ll be sharing more details about the Semi-Finals soon.</Text>
      <Text style={p}>You&rsquo;re one step away from the final showdown!</Text>
    </Layout>
  );
}

export function Finalist({ teamName, finale, siteUrl }: Props<{ teamName: string; finale: string }>) {
  return (
    <Layout
      preview={`${teamName} has made it to the Grand Finale!`}
      heading="You've entered the arena!"
      siteUrl={siteUrl}
      action={{ label: "Explore the team portal", href: portal(siteUrl) }}
    >
      <Text style={p}>The journey has brought you this far. Now, it&rsquo;s time to step into the arena.</Text>
      <Text style={p}>
        Congratulations! <strong>{teamName}</strong> has been selected as a Grand Finalist of the SLIoT Challenge 2027.
      </Text>
      <Text style={p}>
        You&rsquo;ve taken your idea from a proposal to a working prototype. Now it&rsquo;s time to showcase your innovation,
        put your creation to the test, and demonstrate how it could help reconnect the world.
      </Text>
      <Text style={p}>
        The Grand Finale takes place on <strong>{finale}</strong>. We&rsquo;ll be sharing further details with you soon.
      </Text>
      <Text style={p}>The final challenge awaits. Make your mark!</Text>
    </Layout>
  );
}
