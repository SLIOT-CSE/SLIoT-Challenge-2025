"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { point as point_icon } from "@/assets";

const FAQAccordion = ({ title, content, points, link, isOpen, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full border-b border-white/20"
    >
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-semibold text-white">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl text-white"
        >
          ↓
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pb-4 text-gray-300">
          {content}
          <ul className="pl-6 mt-2 list-disc">
            {points && points.map((point, index) => (
              <li key={index} className="flex items-start xxs:items-center">
                <img src={point_icon} alt="point" className="w-4 h-4 mt-1 mr-2 xxs:mt-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {link && <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 underline">Click here</a>}
        </div>
      </motion.div>
    </motion.div>
  );
};

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      title: "How can I register my team?",
      content: "You can register your team through the following link.",
      link: "https://sliot.cse.mrt.ac.lk/register"
    },
    {
      title: "How many members can a team have?",
      content: "A team can have 3-5 members."
    },
    {
      title: "Is there a specific theme for this year's competition?",
      content: "This year's theme is \"Empowering SDGs through AIoT and Industry 5.0\" (Note that the theme only applies for the university and open categories)"
    },
    {
      title: "When will the finals take place?",
      content: "The finals are scheduled to be held at the end of March."
    },
    {
      title: "If I'm registering under the school category, do all team members need to be from the same school?",
      content: "Yes, all team members must be from the same school to compete in the school category."
    },
    {
      title: "What category should we select if team members are from different schools or universities?",
      content: "If team members are from different schools or universities, select the Open Category."
    },
    {
      title: "Will certificates be provided for selected proposals and semifinalists?",
      content: "Yes, certificates will be awarded based on the stage you reach in the competition."
    },
    {
      title: "Where can I get the announcements regarding the competition?",
      content: "You can join the official WhatsApp channel",
      link:"https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05"
    },
  ];

  return (
    <>
      <div id="faqs" className="min-h-screen  flex flex-col items-center px-[4%] md:px-[5%] lg:px-[10%] py-20">
        <motion.h2
          initial={{opacity:0, y:50}}
          whileInView={{opacity:1, y:0}}
          transition={{ duration: 1 }}
          className="mb-12 text-3xl font-bold text-center text-white md:text-4xl"
        >
          Frequently Asked Questions
        </motion.h2>
        
        <div className="w-full max-w-3xl space-y-4">
          {faqData.map((faq, index) => (
            <FAQAccordion
              key={index}
              title={faq.title}
              content={faq.content}
              points={faq.points}
              link={faq.link}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default FAQs;