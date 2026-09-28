

import Prizes from "@/components/section/Prizes";
import Gallery from "@/components/Gallery";
import About from "../components/About";
import TimeLine from "@/components/design/TimeLine";

import EventOrganizers from "@/components/EventOrganizers";
import ContactUs from "@/components/ContactUs";
import JoinNow from "@/components/JoinNow";
import InnovationTourPromo from "@/components/InnovationTourPromo";
import Details from "@/components/Details";
import SLIoTHeroSection from "@/components/SLIoTHeroSection";
import { SpotlightNew } from "@/components/SpotlightNew";
import Header from "@/components/Header";
import FAQs from "@/components/Rules";

const Home = () => {
  return (
    <div className="w-full">
      <Header />
      <SLIoTHeroSection />
      <JoinNow />
      {/* <InnovationTourPromo /> */}
      <About />
      <Prizes />
      <Details />
      {/* <GuideLines /> */}
      <TimeLine />
      {/* <ShiftingCountdown/> */}
      <Gallery />
      <SpotlightNew />
      <EventOrganizers />
      <FAQs />
      <ContactUs />

    </div>
  );

};

export default Home;