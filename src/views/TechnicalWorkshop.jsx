import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import ContactUs from "../components/ContactUs";

const TechnicalWorkshop = () => {
    const workshopDate = new Date("2026-01-23T19:00:00"); // Example date, adjust as needed or make generic

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +workshopDate - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval]) {
            return;
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center mx-2 sm:mx-4">
                <span className="text-3xl sm:text-5xl font-bold text-[#46BC41]">
                    {timeLeft[interval]}
                </span>
                <span className="text-xs sm:text-sm uppercase text-gray-400 mt-1">
                    {interval}
                </span>
            </div>
        );
    });

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden font-alexandria">
            <Header />

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center pt-[5.25rem] px-4 relative overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-[#46BC41] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
                    <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-[#01688E] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-[20%] w-72 h-72 bg-[#46BC41] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="container mx-auto text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-[#46BC41]/30 bg-[#46BC41]/10 backdrop-blur-sm">
                            <span className="text-[#46BC41] font-semibold text-sm tracking-wider">TECHNICAL WORKSHOP 01</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-6 leading-tight">
                            IoT Problem & <br /> Creates <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#46BC41] to-[#01688E]">Solving Approaches</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join us for an exclusive session designed for University & Open Category participants to master the art of IoT problem-solving.
                        </p>

                        {/* Countdown Timer */}
                        <div className="flex flex-wrap justify-center items-center mb-12 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl max-w-3xl mx-auto">
                            {timerComponents.length ? timerComponents : <span className="text-2xl text-[#46BC41]">Event Started!</span>}
                        </div>

                        {/* Session Details Card */}
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                            {/* Speaker Card */}
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:border-[#46BC41]/50 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#46BC41] to-[#01688E] flex items-center justify-center text-2xl">
                                        👨‍💻
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Dewmith Ranasinghe</h3>
                                        <p className="text-gray-400">Electronics Engineer - Embedded Systems</p>
                                        {/* <p className="text-sm text-[#46BC41] mt-1">Expert in IoT Solutions</p> */}
                                    </div>
                                </div>
                            </div>

                            {/* Event Details Card */}
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:border-[#01688E]/50 transition-all duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📅</span>
                                        <div>
                                            <p className="text-gray-400 text-sm">Date</p>
                                            <p className="text-white font-semibold">January 23, 2026</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎥</span>
                                        <div>
                                            <p className="text-gray-400 text-sm">Platform</p>
                                            <p className="text-white font-semibold">Via Zoom</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎯</span>
                                        <div>
                                            <p className="text-gray-400 text-sm">Category</p>
                                            <p className="text-white font-semibold">University & Open</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* <div className="mt-12">
                            <a
                                href="#"
                                className="group relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none w-full sm:w-64"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#46BC41_0%,#01688E_50%,#46BC41_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                                    Register Now
                                </span>
                            </a>
                        </div> */}

                    </motion.div>
                </div>
            </section>

            {/* <ContactUs /> */}

        </div>
    );
};

export default TechnicalWorkshop;
