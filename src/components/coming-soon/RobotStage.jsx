import { CardBody, CardContainer } from "@/components/ui/3d-card";
import { robot } from "@/assets";

// The hero robot: same mouse-tilt card as the home hero, with a slow float.
const RobotStage = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Soft light behind the robot, in the theme's green and teal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(70,188,65,0.28)_0%,rgba(1,104,142,0.18)_45%,transparent_70%)] blur-2xl"
      />
      <div className="cs-robot relative">
        <div className="cs-float">
          <CardContainer containerClassName="py-0">
            <CardBody className="h-auto w-[min(54vw,14rem)] sm:w-[20rem] lg:w-[26rem] xl:w-[29rem]">
              <div className="cs-sway">
                <img
                  src={robot}
                  alt="The SLIoT robot mascot, arms open"
                  width={490}
                  height={510}
                  fetchPriority="high"
                  className="h-auto w-full select-none"
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
