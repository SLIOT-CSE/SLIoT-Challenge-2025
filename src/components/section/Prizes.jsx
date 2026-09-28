"use client";

import React from "react";
import "./prizes.scss";
import { first, second, third } from "../../assets";
import { categories } from "@/constants";
import { Button } from "../ui/MovingBorders";
import { motion } from "framer-motion";

const Prizes = () => {
  const [category, setCategory] = React.useState("university");
  const [categoryChange, setCategoryChange] = React.useState(false);

  const prizes = {
    school: ["TBA", "TBA", "TBA"],
    university: ["TBA", "TBA", "TBA"],
    open: ["TBA", "TBA", "TBA"],
  }

  const changeCategory = (category) => {
    setCategory(category);
    setCategoryChange(false);
    setCategoryChange(true);
    setTimeout(() => setCategoryChange(false), 1000);
  }

  return (
    <div className="mt-40 mb-30 w-full mx-auto text-white body-container" id="categories">
      <div className="audiowide text-4xl sm:text-5xl my-20  text-center text-[#77FF00]">PRIZES</div>
      <motion.h2
      initial={{opacity:0,y:50}}
      whileInView={{opacity:1, y:0,  
      transition: {
        duration: 2 
      }}}
      className="text-5xl text-center">
        
      </motion.h2>

      <div className="flex flex-col md:flex-row w-full items-center justify-center gap-10 mt-10 px-[5%]">
        {categories.map((card) => (
          <Button 
              key={card.id}
              borderRadius='1.75rem'
              duration={Math.floor(Math.random() * 10000) + 10000}
              className={`flex-1 bg-slate-900/[0.8] ${category === card.category ? 'border-n-4 text-n-4' : 'border-neutral-200 text-n-1'}`}
              onClick={() => changeCategory(card.category)}
          >
              <div className={`flex lg:flex-row flex-col lg:items-center p-3 py-6 md:p-5 lg:p-10 gap-2 `}>
                  {/* <img src={card.thumbnail} alt={card.thumbnail} className='lg:w-32 md:w-20 w-16' /> */}
                  <div className='lg:ms-5'>
                      <h1 className='text-start text-xl md:text-2xl font-bold'>
                          {card.title}
                      </h1>
                      {/* <p className='text-start text-white-100 mt-3 font-semibold'>
                          {card.desc}
                      </p> */}
                  </div>
              </div>
          </Button>
        ))}
      </div>

      {/* <div className="flex flex-wrap justify-center items-center gap-x-4 md:gap-x-10 mt-10 px-4 md:px-0">
        <button className={`blob-btn ${category == "school" && "active-category"}`} onClick={() => changeCategory("school")}>
          School Category
          <span className="blob-btn__inner">
            <span className="blob-btn__blobs">
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
            </span>
          </span>
        </button>

        <button className={`blob-btn ${category == "university" && "active-category"}`} onClick={() => changeCategory("university")}>
          University Category
          <span className="blob-btn__inner">
            <span className="blob-btn__blobs">
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
            </span>
          </span>
        </button>

        <button className={`blob-btn ${category == "open" && "active-category"}`} onClick={() => changeCategory("open")}>
          Open Category
          <span className="blob-btn__inner">
            <span className="blob-btn__blobs">
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
            </span>
          </span>
        </button>
      </div> */}

      <div
        className={`w-full flex flex-wrap-reverse justify-center items-center text-center mt-6 px-4 md:px-0 gap-x-4 md:gap-x-10 ${
          categoryChange && "animate-fade-up"
        }`}
      >
        <div className="order-3 md:order-3 lg:order-2">
          <div className="image-wrapper shine scale-75 transform transition duration-80 hover:scale-90">
            <img src={first} alt="trophy" className="h-[350px]" />
          </div>
          <span className="text-4xl font-semibold">
            {prizes[category][0]}
          </span>
        </div>

        <div className="order-2 md:order-1 lg:order-1">
          <div className="image-wrapper shine scale-75 transform transition duration-80 hover:scale-90">
            <img src={second} alt="trophy" className="h-[335px]" />
          </div>
          <span className="text-4xl font-semibold">
            {prizes[category][1]}
          </span>
        </div>

        <div className="order-1 md:order-1 lg:order-3">
          <div className="image-wrapper shine scale-75 transform transition duration-80 hover:scale-90">
            <img src={third} alt="trophy" className="h-[320px]" />
          </div>
          <span className="text-4xl font-bold">
            {prizes[category][2]}
          </span>
        </div>
      </div>

      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
            <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Prizes;
