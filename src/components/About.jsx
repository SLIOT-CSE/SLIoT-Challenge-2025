"use client";

import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/BentoGrid";
import { aboutGridItems } from "../constants";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="w-full justify-center items-center px-[4%] md:px-[5%] lg:px-[10%]" id="about" >
      <motion.h2
      initial={{opacity:0,y:50}}
      whileInView={{opacity:1, y:0,  
      transition: {
        duration: 2 
      }}} 
      className="text-4xl text-white sm:text-5xl audiowide text-[#77FF00] text-center mt-10 mb-20 md:mt-20">
                <div className="audiowide text-4xl sm:text-5xl mt-20  text-center text-[#77FF00]">ABOUT SLIoT</div>

      </motion.h2>
      <section className="mt-10">
        <BentoGrid>
          {aboutGridItems.map(
            ({
              id,
              title,
              description,
              className,
              img,
              imgClassName,
              titleClassName,
              spareImg,
              link,
            }) => (
              <BentoGridItem
                id={id}
                key={id}
                title={title}
                description={description}
                className={className}
                img={img}
                imgClassName={imgClassName}
                titleClassName={titleClassName}
                spareImg={spareImg}
                link={link}
              />
            )
          )}
        </BentoGrid>
      </section>
    </div>
  );
};

export default About;
 