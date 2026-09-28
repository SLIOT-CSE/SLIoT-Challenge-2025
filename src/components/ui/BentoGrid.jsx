"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { GlobeDemo } from "./GridGlobe";
import ImageSlider from "../ImageSlider";
import { point } from "@/assets";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  descriptionItems,
  id,
  img,
  imgClassName,
  titleClassName,
  spareImg,
  link,
  imageArray,
  overlayClassName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (link || imageArray) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const renderDescription = (description) => {
    return description.split("<br>").map((item, index) => (
      <React.Fragment key={index}>
        {item}
        {index < description.split("<br>").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div
      className={cn(
        "row-span-1 relative overflow-hidden rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none justify-between flex flex-col border border-white/[0.1]",
        className
      )}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        backgroundColor:
          "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
      }}
    >
      <div
        className="h-full"
        onClick={handleOpenModal}
      >
        <div className="w-full h-full absolute">
          {img && (
            <img
              src={img}
              alt={img}
              className={cn(imgClassName, "object-cover object-center")}
            />
          )}
          <div className={cn(overlayClassName, "absolute inset-0 bg-black bg-opacity-25")} />
        </div>
        <div
          className="absolute right-0 -bottom-5"
        >
          {spareImg && (
            <img
              src={spareImg}
              alt={spareImg}
              className="object-cover object-center w-full h-full"
            />
          )}
        </div>
        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 text-center transition duration-200 relative md:h-full min-h-40  flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          <div className="font-semibold audiowave text-lg lg:text-3xl max-w-200 mb-8 z-5 ">
            {title}
          </div>
          <center><div className=" text-white text-sm md:text-base max-w-[90%] leading-loose alexandria text-center font-light lg:text-lg z-5 mt-2">
            {renderDescription(description)}
          </div></center>

          {id === 1 && <GlobeDemo />}
          {(id === 21 || id === 22 || id === 23) && (
            <div className="font-sans font-extralight text-white text-sm md:text-xs lg:text-base z-5 mt-2">
              {descriptionItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2 mt-2">
                  <img src={point} alt="point" className="h-4 w-4 lg:mt-1" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      {isModalOpen && link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-40 backdrop-blur-md backdrop-brightness-75 p-4 md:p-8 lg:p-12">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-400 text-4xl font-bold"
              onClick={handleCloseModal}
            >
              ×
            </button>
        
            {/* Video Title */}
            <h2 className="text-center font-semibold text-n-1 text-2xl md:text-3xl lg:text-4xl mb-4">
              {title}
            </h2>
            {/* Embedded YouTube Video */}
            <div className="w-full max-w-2xl lg:max-w-4xl aspect-video z-50">
              <iframe
                src={link}
                title={title}
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

      {isModalOpen && imageArray && imageArray.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-40 backdrop-blur-md backdrop-brightness-75">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-400 text-4xl font-bold"
              onClick={handleCloseModal}
            >
              ×
            </button>

            {/* Modal Title */}
            <h2 className="text-center font-semibold text-n-1 text-2xl mb-4">
              {title}
            </h2>

            {/* Image Slider */}
            <div className="w-full max-w-4xl mx-auto">
              <ImageSlider images={imageArray} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
