"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Spotlight } from "./ui/Spotlight";
import Header from "./Header";

const NotFound = () => {
  return (
    <>
      <Header />
      <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-4">
        <div>
          <Spotlight className="h-screen -top-40 -left-10 md:-left-32 md:-top-20" fill="white" />
          <Spotlight className="sm:top-10 left-full h-screen sm:w-[50vw]" fill="#73C72A" />
          <Spotlight className="sm:top-10 md:top-28 left-80 h-screen sm:w-[50vw]" fill="blue" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-8xl md:text-9xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 to-neutral-400 font-nicoMoji"
          >
            404
          </motion.h1>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl md:text-4xl font-semibold mb-6 text-[#77FF00] audiowide"
          >
            PAGE NOT FOUND
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-n-1 mb-10 text-base md:text-lg max-w-md mx-auto alexandria"
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 translate-x-1 translate-y-1 border-2 border-gray-400 lg:translate-y-2 lg:translate-x-2 rounded-xl"></div>
            <Link href="/">
              <button className="relative z-10 px-6 py-3 md:px-8 md:py-3 text-base md:text-lg text-white transition duration-300 shadow-lg font-nicoMoji rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                Back to Home
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
