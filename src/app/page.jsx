import Home from "@/views/Home";
import ComingSoon from "@/views/ComingSoon";
import { COMING_SOON, edition } from "@/config/site.mjs";

const comingSoonTitle = `${edition.name} ${edition.year} · ${edition.status}`;
const comingSoonDescription = `Sri Lanka's biggest IoT competition returns in ${edition.year}. ${edition.tagline}`;

export const metadata = COMING_SOON
  ? {
      title: comingSoonTitle,
      description: comingSoonDescription,
      openGraph: {
        title: comingSoonTitle,
        description: comingSoonDescription,
        images: [{ url: "/images/og-coming-soon.jpg", width: 1200, height: 630, alt: `${edition.name} ${edition.year}` }],
      },
      twitter: { card: "summary_large_image", images: ["/images/og-coming-soon.jpg"] },
    }
  : {};

export default function Page() {
  return COMING_SOON ? <ComingSoon /> : <Home />;
}
