import React, { useEffect } from "react";
import cse from '../assets/cse.jpg'
import iesl from '../assets/iesl.gif'
import slt from '../assets/slt.png'
import uom from '../assets/uom.gif'
import AOS from "aos";
import "aos/dist/aos.css";

const EventOrganizers = () => {
    useEffect(() => {
        AOS.init({
          duration: 1000, // Animation duration in milliseconds
          once: true, // Animation runs only once
        });
      }, []);
    return (
        <section className=" text-white  py-12 text-center w-full px-[5%] lg:px-[4%] xl:px-[10%] mx-auto">
        {/* Heading */}
        <h1 className="text-5xl font-bold text-[#e6b17e] uppercase mb-6">
            Event Organizers
        </h1>

        {/* Description */}
        <div className="max-w-full mx-auto mb-8 text-lg leading-relaxed text-start">
            <p>
            This competition is organized by the Department of Computer Science & Engineering,
            University of Moratuwa in collaboration with SLT Mobitel and The Institution of Engineers Sri Lanka (IESL).
            </p>
            <p className="mt-4">
            University of Moratuwa is a leading university in Sri Lanka which consists of six faculties.
            The Department of Computer Science & Engineering that belongs to the Faculty of Engineering 
            is one of the prominent departments in Sri Lanka to offer an engineering degree in computer science.
            </p>
            <p className="mt-4">
            SLT-MOBITEL is the Leading Digital Service provider and the No. 1{" "}
            <span className="text-[#e6b17e] font-medium">broadband</span> and backbone infrastructure services provider 
            in the country. For more information, visit{" "}
            <a href="https://sltmobitel.lk" target="_blank" rel="noopener noreferrer" 
                className="text-[#e6b17e] underline">
                sltmobitel.lk
            </a>.
            </p>
        </div>

        {/* Logos */}
        <div className="glass-card flex flex-wrap justify-center items-center gap-20 mt-8 w-full border py-8 rounded-3xl bg-white bg-opacity-5">
            <img
            src={cse} // Replace with CSE Logo URL
            alt="CSE Logo"
            className="w-52 "
            data-aos="fade-up"
            />
            <img
            src={iesl} // Replace with IESL Logo URL
            alt="IESL Logo"
            className="w-52"
            data-aos="fade-up"
            />
            <img
            src={slt} // Replace with SLT Mobitel Logo URL
            alt="SLT Mobitel Logo"
            className="w-72"
            data-aos="fade-up"
            />
            <img
            src={uom} // Replace with UoM Logo URL
            alt="UoM Logo"
            className="w-36"
            data-aos="fade-up"
            />
        </div>
        </section>
    );
};

export default EventOrganizers;
