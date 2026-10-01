import NotFound from "@/components/NotFound";
import ComingSoon from "@/views/ComingSoon";
import { COMING_SOON } from "@/config/site.mjs";

// In coming-soon mode unknown URLs show the teaser (still with a 404 status);
// the regular 404 page's nav points at sections that are hidden.
export default function NotFoundPage() {
  return COMING_SOON ? <ComingSoon /> : <NotFound />;
}
