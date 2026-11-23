"use client";

import React from "react";
import { CardCarousel } from "./ui/CardCarousel";
import { organizers } from "@/constants";
import { motion } from "framer-motion";

const EventOrganizers = () => {
    return (
        <div className="flex flex-col" id="partners">
            <hr className="border-t-2 border-gray-300 mx-[10%] mt-28 mb-10 animate-grow" />
            <div className=" text-white  py-12 text-center w-full px-[5%] lg:px-[4%] xl:px-[10%] mx-auto">
                <div className="items-center gap-20 lg:flex h-max ">
                    <div className="items-center">
                        <motion.h2
                        initial={{opacity:0,x:50}}
                        whileInView={{opacity:1, x:0,  
                        transition: {
                            duration: 2 
                        }}} 
                        className="mb-6 text-3xl text-left text-white leading-loose uppercase sm:text-5xl audiowide">
                            Meet the  <br></br><span className="py-10 text-[#77FF00]">Organizers</span> 
                        </motion.h2>
                    </div>
                    <div className="max-w-full mx-auto text-lg leading-loose text-justify lg:text-justify">
                        <p>
                        The SLIoT Challenge 2026 is proudly organized by the Department of Computer Science & Engineering, University of Moratuwa, in collaboration with SLT-MOBITEL and The Institution of Engineers Sri Lanka (IESL).

                        </p>
                        <p className="mt-6">
                        University of Moratuwa is one of Sri Lanka&apos;s premier universities, recognized for excellence in education, research and innovation. The Department of Computer Science & Engineering within the Faculty of Engineering at UoM stands out as a leader in offering world-class education and producing highly skilled professionals in the field of Computer Science and Engineering.
                        </p>
                        <p className="mt-6">
                        SLT-MOBITEL is Sri Lanka’s leading digital service provider and the nation’s top broadband and backbone infrastructure services provider. With a commitment to advancing digital transformation, SLT-MOBITEL plays a vital role in empowering the nation through innovative solutions. For more details, visit{" "}
                            <a href="https://sltmobitel.lk" target="_blank" rel="noopener noreferrer"
                                className="text-[#77FF00] underline">
                                sltmobitel.lk
                            </a>.
                        </p>

                        <p className="mt-6">
                        The Institution of Engineers Sri Lanka (IESL) is the professional body for engineers in Sri Lanka, dedicated to promoting the advancement of engineering practices and contributing to national development. Their support underscores the importance of bridging engineering and innovation for societal benefit.

                        </p>
                    </div>
                </div>
            </div>
            {/* <div className="glass-card flex flex-wrap justify-center items-center gap-20  w-screen py-8  bg-gradient-to-r from-[rgba(255,255,255,0.2)] via-transparent to-[rgba(255,255,255,0.2)] bg-white bg-opacity-10 ">
                <img
                    src={cse} 
                    alt="CSE Logo"
                    className="w-52 "
                    data-aos="fade-up" />
                <img
                    src={iesl} 
                    alt="IESL Logo"
                    className="w-52"
                    data-aos="fade-up" />
                <img
                    src={sltLogo} 
                    alt="SLT Mobitel Logo"
                    className="w-72"
                    data-aos="fade-up" />
                <img
                    src={uom} 
                    alt="UoM Logo"
                    className="w-36"
                    data-aos="fade-up" />
            </div> */}
            <CardCarousel 
                items={organizers}
                direction='right'
                speed='slow'
            />
        </div>
        
    );
};

export default EventOrganizers;