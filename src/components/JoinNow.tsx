"use client";

import React from "react";
import { motion } from "framer-motion";

const JoinNow = () => {
  return (
    <div className="w-full flex flex-col justify-center items-center px-[4%] md:px-[5%] lg:px-[10%] pb-10 md:py-20" id="join">
      <motion.h2
        initial={{opacity:0,y:50}}
        whileInView={{opacity:1, y:0,
        transition: {
          duration: 2
        }}}
        className="text-4xl text-white sm:text-5xl audiowide text-[#77FF00] text-center mb-10 lg:mt-20">
        <div className="audiowide text-4xl sm:text-5xl mt-20  text-center text-[#77FF00]">JOIN THE CHALLENGE</div>
      </motion.h2>

      <motion.div
        initial={{opacity:0,y:30}}
        whileInView={{opacity:1, y:0,
        transition: {
          duration: 1.5,
          delay: 0.3
        }}}
        className="max-w-4xl mx-auto mt-10 text-center">
        <p className="text-neutral-200 text-lg md:text-lg mb-20 leading-relaxed">
          Ready to revolutionize the future with IoT? The SLIoT Challenge 2026 invites you to develop
          innovative IoT solutions that address major local and global challenges. Organized by the
          University of Moratuwa in collaboration with SLT-MOBITEL and IESL, this competition provides
          a competitive platform to showcase your creativity and technical expertise. Compete in School,
          Undergraduate, or Open categories and bring your ideas to life!
        </p>

        <div className="flex flex-col gap-6 items-center">
          {/* Primary row: main CTA(s) */}
          <div className="flex gap-8 items-center">
            <motion.a
              href="https://docs.google.com/forms/d/e/1FAIpQLSd4YOrRO9PAbdBH_VaZxJRVwbRw2Z0jj3LmUmzvdpC8l7Jhhw/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-gradient-to-r from-[#46BC41] to-[#01688E] text-white font-bold text-xl  px-16 py-5 rounded-full shadow-lg shadow-[#01688E]/50 hover:shadow-[#01688E] transition-all duration-300">
              Register Now
            </motion.a>

            <motion.a
              href="https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block text-[#77FF00] font-bold text-xl px-12 border-4 border-[#77FF00] py-4 rounded-full shadow-lg shadow-green-500/50 hover:shadow-green-500/75 transition-all duration-300">
              Join WhatsApp
            </motion.a>
          </div>

          {/* Secondary row: resource links (wrap on small screens) */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <motion.a
              href="https://sliot.cse.mrt.ac.lk/proposal-submission"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-gradient-to-r from-[#46BC41] to-[#01688E] text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg shadow-[#01688E]/40 hover:shadow-[#01688E] transition-all duration-300">
              Submit Proposal
            </motion.a>

            <motion.a
              href="https://sliot.cse.mrt.ac.lk/guidelines"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block text-white font-bold text-lg px-6 border-4 border-white py-3 rounded-full shadow-lg shadow-white/40 hover:shadow-white/60 transition-all duration-300">
              Guidelines & Template
            </motion.a>

            <motion.a
              href="https://drive.google.com/drive/folders/1MJiaOs2xG6MSGquUGd1DLvnY2fj_KToz"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block text-white font-bold text-lg px-6 border-4 border-white py-3 rounded-full shadow-lg shadow-white/40 hover:shadow-white/60 transition-all duration-300">
              Delegates Booklet
            </motion.a>
          </div>
        </div>

        <p className="text-neutral-400 text-lg mt-20">
          Don&apos;t miss out on this incredible opportunity to showcase your skills and win amazing prizes!
        </p>
      </motion.div>
    </div>
  );
};

export default JoinNow;
