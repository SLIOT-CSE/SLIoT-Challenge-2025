import Image from "next/image";
import { figure } from "@/assets";

// The 2027 hero figure: a helmeted robot wrapped in teal fabric.
// The source image is cut off on its right and bottom edges, so wherever it is placed
// those edges must line up with something (a card edge, the screen edge) or be faded
// out with a mask; the left and top are open. Keeps the image's aspect ratio, so give
// it either a height or a width, and a position (relative or absolute) via className.
// A mint glow behind the helmet breathes slowly.
const HeroFigure = ({ className = "", sizes, priority = false }) => {
  return (
    <div className={`aspect-[957/932] ${className}`}>
      <div
        aria-hidden="true"
        className="fig-glow pointer-events-none absolute left-[20%] top-[4%] h-[50%] w-[48%] rounded-full bg-[radial-gradient(closest-side,rgba(133,255,240,0.32),rgba(20,229,168,0.12)_55%,transparent)] blur-2xl"
      />
      <Image
        src={figure}
        alt="A helmeted robot wrapped in flowing teal fabric"
        width={957}
        height={932}
        sizes={sizes}
        priority={priority}
        draggable={false}
        className="relative h-full w-full select-none"
      />
    </div>
  );
};

export default HeroFigure;
