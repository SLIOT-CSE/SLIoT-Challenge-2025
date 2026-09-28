"use client";

import React from "react";
import { FaDownload } from "react-icons/fa";
import { Button } from "./ui/MovingBorders";

export default function DownloadPDFButton({ link, title, download}) {
  return (
    <div className="flex justify-center mt-8">
      <a
        href = {link}
        download = {download}
        target="_blank"
        rel="noopener noreferrer"
        className ="relative flex items-center hover:scale-[1.1] hover:rotate-2 hover:z-20 transition-transform"
      >
        <div className="absolute z-10 flex items-center justify-center w-10 h-10 transition-transform transform border rounded-full shadow-lg -top-3 -right-3 bg-white/20 hover:scale-125">
            <FaDownload  />
        </div>
        <Button
          borderRadius="1.75rem"
          duration={Math.floor(Math.random() * 10000) + 10000}
          className={`relative flex-1 bg-slate-900/[0.8]`}
        >
          <div
            className={`relative flex lg:flex-row flex-col lg:items-center p-3 py-4 md:p-5 lg:p-5 gap-2 `}
          >
            <div className="">
              <h1 className="flex items-center text-sm font-semibold text-center md:text-xl">
                {/* <FaDownload className="mr-2" /> */}
                {title}
              </h1>
            </div>
          </div>
        </Button>
      </a>
    </div>
  );
}
