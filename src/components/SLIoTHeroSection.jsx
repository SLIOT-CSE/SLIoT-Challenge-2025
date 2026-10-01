"use client";

import { useEffect, useState } from "react";
import HeroFigure from "./HeroFigure";
import { sltLogo } from "@/assets";
import { motion } from "framer-motion"
import { Spotlight } from "./ui/Spotlight";
import { TextGenerateEffect } from "./ui/TextGenerateEffect";

const SLIoTHeroSection = () => {
  const [showSpotlights, setShowSpotlights] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpotlights(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative pt-16 overflow-hidden" id="home">
      <div>
        {showSpotlights && (
          <>
            <Spotlight className="h-screen -top-40 -left-10 md:-left-32 md:-top-20" fill="white" />
            <Spotlight className="sm:top-10 left-full h-screen sm:w-[50vw]" fill="#73C72A" />
            <Spotlight className="sm:top-10 md:top-28 left-80 h-screen sm:w-[50vw]" fill="blue" />
          </>
        )}
      </div>
      <section
        className="flex flex-col md:flex-row items-center justify-center px-4 md:px-6 lg:px-[6%] md:gap-0 relative antialiased"
        style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
      >
        <div className="container flex flex-col items-center mx-auto md:flex-row">
          <div className="text-center md:text-left">
            <div className="p-4 md:p-6">
              <div
                className="flex flex-col items-center">
                {showSpotlights && (
                  <TextGenerateEffect
                    className='relative z-10 max-w-[400px] lg:max-w-[550px] mt-15 md:mt-0 text-center md:text-left'
                    words='SLIoT Challenge 2026'
                  />
                )}
              </div>
              {/* <h1 className="relative z-10 text-6xl tracking-wide text-transparent md:text-7xl lg:text-8xl font-nicoMoji bg-clip-text bg-gradient-to-b from-neutral-200 to-neutral-400">
                SLIoT 
              </h1>
              <h2 className="relative z-10 text-4xl text-pink-500 lg:text-5xl font-nicoMoji">Challenge 2026</h2> */}
              <motion.p
                initial={{ y: 40, opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 3, ease: 'easeInOut' }}
                className="relative mt-4 md:mt-6 text-xs xs:text-sm lg:text-xl text-n-1 leading-relaxed mb-6 md:mb-10 max-w-full md:max-w-[540px] z-10 text-justify xs:text-center md:text-left alexandria">


                Welcome to the biggest IoT competition in Sri Lanka, <br></br>Open to school students, university undergraduates and innovators across the island.

              </motion.p>


              {/* <motion.div
              initial={{ y: 0,opacity:0 }}
              animate={{opacity:1, y:0,type:'spring'}}
              transition={{duration:0.5,delay:4,ease:'anticipate'}}
              className="text-center md:text-left">
                <div
                  className="relative inline-block"
                >
                  <div className="absolute inset-0 translate-x-1 translate-y-1 border-2 border-gray-400 lg:translate-y-2 lg:translate-x-2 rounded-xl"></div>
                  <a href="https://forms.gle/dGSP4hBzUWcvUpaq8" target='_blank' className="z-20">
                    <button className="relative z-10 px-4 py-2 text-base text-white transition duration-300 shadow-lg sm:px-8 lg:px-4 lg:py-3 lg:text-lg font-nicoMoji rounded-xl bg-gradient-to-r from-pink-500 to-purple-600">
                      Submit Video
                    </button>
                  </a>
                </div>
              </motion.div> */}
              <div className="relative flex items-end justify-center gap-6 md:justify-start md:mt-10 lg:-mt-10 md:gap-10">
                <div
                  className="relative z-10 flex flex-col items-center text-sm font-bold text-n-1 alexandria md:items-start md:mt-8">
                  Powered By
                  <img
                    src={sltLogo}
                    alt="SLT-Mobitel-logo"
                    className="relative w-32 h-auto mt-5 md:w-48 "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 2027 hero figure; its cut right and bottom edges fade out (fig-fade-edges) */}
        <div className="flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, filter: "blur(12px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mt-4 w-[min(20rem,85vw)] md:-ml-72 md:w-[22rem] lg:-ml-96 lg:w-[30rem] xl:-ml-[28rem]"
          >
            <HeroFigure className="fig-fade-edges relative w-full" sizes="(min-width: 1024px) 480px, 352px" priority />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SLIoTHeroSection;