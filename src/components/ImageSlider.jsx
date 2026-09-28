"use client";

import React, { useState, useEffect } from "react";

const ImageSlider = ({
  images,
  autoSlide = true,
  interval = 3000,
  showArrows = true,
  showDots = true,
  arrowStyle = "absolute top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition",
  dotStyle = "w-3 h-3 rounded-full",
  activeDotStyle = "bg-white",
  inactiveDotStyle = "bg-gray-400 hover:bg-gray-600",
  sliderHeight = "h-full",
  sliderWidth = "w-full",
  slideTransition = "transition-transform duration-500",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  // Autoplay functionality
  useEffect(() => {
    if (!autoSlide) return;

    const slideInterval = setInterval(goToNext, interval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, interval, currentIndex]);

  return (
    <div
      className={`relative ${sliderWidth} ${sliderHeight} max-w-4xl mx-auto overflow-hidden`}
    >
      <img
        src={images[currentIndex]}
        alt={`Slide ${currentIndex}`}
        className={`${sliderWidth} object-cover`}
      />
      {/* Previous Button */}
      {showArrows && images.length > 1 && (
        <div
          className={arrowStyle}
          style={{ left: "8px" }}
          onClick={goToPrevious}
        >
          <svg
            fill="#FFFFFF"
            height="24px"
            width="24px"
            version="1.1"
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 330 330"
          >
            <path
              id="XMLID_6_"
              d="M165,0C74.019,0,0,74.019,0,165s74.019,165,165,165s165-74.019,165-165S255.981,0,165,0z M205.606,234.394
                c5.858,5.857,5.858,15.355,0,21.213C202.678,258.535,198.839,260,195,260s-7.678-1.464-10.606-4.394l-80-79.998
                c-2.813-2.813-4.394-6.628-4.394-10.606c0-3.978,1.58-7.794,4.394-10.607l80-80.002c5.857-5.858,15.355-5.858,21.213,0
                c5.858,5.857,5.858,15.355,0,21.213l-69.393,69.396L205.606,234.394z"
            />
          </svg>
        </div>
      )}

      {/* Next Button */}
      {showArrows && images.length > 1 && (
        <div className={arrowStyle} style={{ right: "8px" }} onClick={goToNext}>
          <svg
            fill="#FFFFFF"
            height="24px"
            width="24px"
            version="1.1"
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 330 330"
          >
            <path
              id="XMLID_2_"
              d="M165,0C74.019,0,0,74.019,0,165s74.019,165,165,165s165-74.019,165-165S255.981,0,165,0z M225.606,175.605
                l-80,80.002C142.678,258.535,138.839,260,135,260s-7.678-1.464-10.606-4.394c-5.858-5.857-5.858-15.355,0-21.213l69.393-69.396
                l-69.393-69.392c-5.858-5.857-5.858-15.355,0-21.213c5.857-5.858,15.355-5.858,21.213,0l80,79.998
                c2.814,2.813,4.394,6.628,4.394,10.606C230,168.976,228.42,172.792,225.606,175.605z"
            />
          </svg>
        </div>
      )}

      {/* Dots */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`${dotStyle} ${
                currentIndex === index ? activeDotStyle : inactiveDotStyle
              }`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
