import { CardBody, CardContainer } from "@/components/ui/3d-card";
import { robot } from "@/assets";

// The hero robot, standing on the glass card and breaking out past its edge.
// Same mouse-tilt card as the home hero, with a slow float. Fills the height it is
// given and keeps its aspect ratio.
const RobotStage = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Mint light on the glass behind the robot, from the aurora palette */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[55%] aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(115,218,190,0.30)_0%,rgba(11,90,109,0.22)_45%,transparent_70%)] blur-2xl"
      />
      {/* Height minus the 12px float so the robot never pokes past its area */}
      <div className="cs-robot pointer-events-auto relative h-[calc(100%-14px)]">
        <div className="cs-float h-full">
          <CardContainer containerClassName="h-full py-0" className="h-full">
            <CardBody className="h-full w-auto">
              <div className="cs-sway h-full">
                <img
                  src={robot}
                  alt="The SLIoT robot mascot, arms open"
                  width={490}
                  height={510}
                  fetchPriority="high"
                  className="h-full w-auto max-w-none select-none object-contain drop-shadow-[0_24px_32px_rgba(1,6,16,0.55)]"
                  draggable={false}
                />
              </div>
            </CardBody>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default RobotStage;
