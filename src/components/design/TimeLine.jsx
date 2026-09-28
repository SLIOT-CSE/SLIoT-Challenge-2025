"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import TimeLineCard from "../ui/TimeLineCard";
export default function TimeLine() {
  const events = [
    {
      date: "DECEMBER",
      title: "Start Accepting Registrations",
      description:
        "Registration opens for all categories. Teams can register and express their interest in participating in the challenge.",
      imgSrc: "assets/completed.png",
      isActive: true,
      isDone: true,
    },
    {
      date: "JANUARY - 03",
      title: "Introductory Session (Online)",
      description:
        "An online introductory session to familiarize participants with the competition guidelines, rules, and expectations.",
      imgSrc: "assets/completed.png",
      isActive: true,
      isDone: true,
    },
    {
      date: "JANUARY - 05",
      title: "Opening Proposal Acceptance",
      description:
        "Teams can start submitting their project proposals for evaluation by the judging panel.",
      imgSrc: "assets/completed.png",
      isActive: true,
      isDone: true,
    },
    {
      date: "JANUARY - 23",
      title: "University/Open Category Online Workshops - IoT Problem Solving Approaches",
      description:
        "An innovation tour to inspire participants and showcase the potential of IoT solutions in real-world applications.",
      imgSrc: "assets/3.png",
      isActive: true,
      isDone: true,
    },


    {
      date: "JANUARY - 25",
      title: "University/Open Category Online Workshops - AIoT / Embedded ML & TinyML Workshop",
      description:
        "Online workshops specifically designed for university and open category participants to enhance their technical skills.",
      imgSrc: "assets/3.png",
      isActive: true,
      isDone: true,
    },

    

   {
      date: "JANUARY - 29",
      title: "University/Open Category Workshops ",
      description:
        "Online workshops specifically designed for university and open category participants to enhance their technical skills.",
      imgSrc: "assets/3.png",
      isActive: true,
      isDone: true,
    },


           {
      date: "FEBRUARY - 02",
      title: "Close Registrations Acceptance",
      description:
        "Final date for teams to complete their registration for the challenge. No new registrations will be accepted after this date.",
      imgSrc: "assets/3.png",
      isActive: true,
      isDone: true,
    },
    {
      date: "FEBRUARY - 04",
      title: "Close Proposal Acceptance",
      description:
        "Final deadline for all teams to submit their project proposals. No proposals will be accepted after this date.",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: true,
    },
    {
      date: "FEBRUARY",
      title: "School Category Workshop",
      description:
        "Dedicated workshop for school category participants to help them develop their projects and prepare for evaluation.",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: true,
    },
    {
      date: "FEBRUARY",
      title: "Progress Evaluation (Video Submission)",
      description:
        "Teams must submit video presentations demonstrating their project progress for evaluation by the judges.",
      imgSrc: "assets/3.png",
      isActive: true,
      isDone: true,
    },

    {
      date: "MARCH - 12",
      title: "Announce Semi-Finalists",
      description:
        "",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: true,
    },

        {
      date: "MARCH - 22",
      title: "University/Open Category Exclusive Workshops for Semi Finalists",
      description:
        "Intensive workshops for semi-finalists to refine their projects and prepare for the final stages of the competition.",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: true,
    },

    {
      date: "APRIL - 04",
      title: "Semi-Finals",
      description:
        "Semi-final rounds where shortlisted teams present their projects. Top teams will advance to the grand finale.",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: true,
    },
    {
      date: "APRIL - 25",
      title: "Grand Finale & Awards Ceremony",
      description:
        "The final competition where finalists present their projects. Winners will be announced and awarded during the ceremony.",
      imgSrc: "assets/3.png",
      isActive: false,
      isDone: false,
    },
  ];

  // useEffect(() => {
    // Using GSAP to animate timeline items when they come into view
  //   const timelineItems = document.querySelectorAll(".timeline-item");

  //   // GSAP ScrollTrigger will trigger animations when elements come into view
  //   timelineItems.forEach((item, index) => {
  //     gsap.fromTo(
  //       item,
  //       { opacity: 0, y: 50 }, // initial state (hidden and positioned)
  //       {
  //         opacity: 1,
  //         y: 0,
  //         duration: 1,
  //         delay: index * 0.3, // stagger animation for each item
  //         scrollTrigger: {
  //           trigger: item,
  //           start: "top 80%", // when the top of the element is 80% into the viewport
  //           end: "bottom 30%", // until the bottom of the element goes 30% out of the viewport
  //           scrub: true, // smooth animation when scrolling
  //           toggleActions: "play none none none", // animation controls
  //         },
  //       }
  //     );
  //   });
  // }, []);

  return (
    <div className="flex flex-col items-center justify-center w-screen min-h-screen align-middle bg-transparent" id="timeline">
      <motion.h1
      initial={{opacity:0,y:50}}
      whileInView={{opacity:1, y:0,  transition: {
        duration: 1 // Animation duration
      }}}
      
      
      
      className="py-2 mt-32 mb-20 text-4xl text-center text-[#77FF00] sm:text-5xl audiowide" >EVENT TIMELINE</motion.h1>
      <div className="space-y-8 w-[80%] md:w-[60%] relative mx-10 my-5 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {events.map((event, index) => (
            <TimeLineCard key={index} event={event} index={index} />

       
        ))}
      </div>
    </div>
  );
}
