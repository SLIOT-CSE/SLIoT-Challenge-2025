import { Route, Routes, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Home from "./views/Home";
import Footer from "./components/Footer";
import Lenis from "@studio-freight/lenis";
import { useEffect, useRef } from "react";
import "locomotive-scroll/dist/locomotive-scroll.css";
import SubmissionGuidelines from "./components/SubmissionGuidelines";

import FAQs from "./components/Rules";
import SelectedTeams from "./views/SelectedTeams";
import InnovationTour from "./views/InnovationTour";
import Snowfall from "./components/Snowfall";
import christmasImage from "./assets/christmas.avif";
import NotFound from "./components/NotFound";
import TechnicalWorkshop from "./views/TechnicalWorkshop";


const App = () => {

  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);
  return (


    <>
      {/* <Snowfall /> */}
      {/* <div  className="flex flex-col min-h-screen bg-transparent pt-[4.75rem] lg:pt-[5.25rem] overflow-x-hidden ">
        <a
          href="https://sliot.cse.mrt.ac.lk/memorynexus"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block"
        >
          <img
            src={christmasImage}
            alt="Christmas Banner"
            className="w-full h-auto object-cover cursor-pointer"
          />
        </a> */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/innovation-tour" element={<InnovationTour />} />
          <Route path="/guidelines" element={<SubmissionGuidelines />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/finalists" element={<SelectedTeams />} />
          <Route path="/session_1" element={<TechnicalWorkshop />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer className="mt-auto" />

    </>
  );
};

export default App;