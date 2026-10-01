"use client";

import React from 'react'
import { motion } from "framer-motion";

const Details = () => {
  return (
    <div className='max-w-[90%] md:max-w-[70%] mx-auto py-20' id='challenge'>
      <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
          }}
          className="py-0 text-4xl text-center text-white sm:text-5xl"
      >
      <div className="audiowide text-4xl sm:text-5xl my-8 sm:my-20 text-center text-[#77FF00]">CHALLENGE DETAILS</div>
      </motion.h1>
      <motion.ul
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
          }}
          className=" leading-loose text-white text-[16px] md:text-[18px] alexandria sm:px-6 md:px-14 space-y-4 list-disc list-inside"
      >
        <li>The journey begins with registration, where participants express their interest in the competition.</li>
        <li>An online introductory session will follow, providing detailed information about the challenge and team formation.</li>
        <li>Teams consisting of up to five members, must then submit a proposal outlining their idea and team details.</li>
        <li>Each participant can only be part of one team and each team should appoint a leader and the organizing committee will communicate to the leaders directly regarding any announcements in the competition.</li>
        <li>To support participants in reaching their full potential, a series of workshops will be conducted at University of Moratuwa (or near Colombo) and online.</li>
        <li>The competition will consist of multiple elimination rounds, leading up to the final round, which will be held physically at the University of Moratuwa.</li>
        <li>The most outstanding projects will be rewarded with exciting prizes for their creativity, innovation and impact.</li>
      </motion.ul>
    </div>
  )
};

export default Details;