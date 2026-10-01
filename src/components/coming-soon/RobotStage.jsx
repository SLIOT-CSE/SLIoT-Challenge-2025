import { CardBody, CardContainer } from "@/components/ui/3d-card";
import { robot } from "@/assets";

// The hero robot: same mouse-tilt card as the home hero, with a slow float.
// Sized by the height it is given (the page never scrolls), keeping its aspect ratio.
const RobotStage = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Soft light behind the robot, in the theme's green and teal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square h-[78%] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(70,188,65,0.28)_0%,rgba(1,104,142,0.18)_45%,transparent_70%)] blur-2xl"
      />
      {/* Height minus the 12px float so the robot never pokes past its area */}
      <div className="cs-robot relative h-[calc(100%-14px)] max-h-[32rem] max-w-full">
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
                  className="h-full w-auto max-w-full select-none object-contain"
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
