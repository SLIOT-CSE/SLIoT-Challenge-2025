"use client";

import React, { useState } from "react";
import { spotlight } from "@/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type SpotlightVideo = { title: string; link: string };

export function SpotlightNew() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalVideo, setModalVideo] = useState<SpotlightVideo | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openVideoModal = (video: SpotlightVideo) => {
    setModalVideo(video);
  };

  const closeVideoModal = () => {
    setModalVideo(null);
  };

  const getVideoThumbnail = (link: string) => {
    // Extract YouTube video ID from embed link
    const videoId = (link.split('/').pop() ?? '').split('?')[0];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  return (
    <div className="w-full justify-center items-center text-n-1 mt-20 px-4" id="spotlight">
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 2
          }
        }}
        className="text-4xl text-white sm:text-5xl font-poppins text-center mb-10"
      >
        <div className="audiowide text-4xl sm:text-5xl mt-32 mb-24 text-center text-[#77FF00]">SLIoT IN THE SPOTLIGHT</div>
      </motion.h2>

      <div className="max-w-4xl mx-auto space-y-3">
        {spotlight.map(({ id, title, link }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: id * 0.05 }}
            className="border border-white/20 rounded-lg overflow-hidden bg-black-100/50 backdrop-blur-sm"
          >
            {/* Question Strip - Always Visible */}
            <button
              onClick={() => toggleExpand(id)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <h3 className="text-base sm:text-lg font-medium text-white pr-4 group-hover:text-green-300 transition-colors">
                {title}
              </h3>
              <motion.div
                animate={{ rotate: expandedId === id ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-green-300 transition-colors" />
              </motion.div>
            </button>

            {/* Video Thumbnail - Only Shows When Expanded */}
            <AnimatePresence>
              {expandedId === id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 border-t border-white/10">
                    <div
                      onClick={() => openVideoModal({ title, link })}
                      className="block group cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
                        <img
                          src={getVideoThumbnail(link)}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <svg
                              className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-white/60 text-sm group-hover:text-green-300 transition-colors">
                        Click to watch video
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Video Modal */}
      {modalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-40 backdrop-blur-md backdrop-brightness-75 p-4 md:p-8 lg:p-12">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-400 text-4xl font-bold z-50"
              onClick={closeVideoModal}
            >
              ×
            </button>

            {/* Video Title */}
            <h2 className="text-center font-semibold text-n-1 text-2xl md:text-3xl lg:text-4xl mb-4">
              {modalVideo.title}
            </h2>
            {/* Embedded YouTube Video */}
            <div className="w-full max-w-2xl lg:max-w-4xl aspect-video z-50">
              <iframe
                src={modalVideo.link}
                title={modalVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
