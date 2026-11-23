import React from "react";
import { socials } from "../constants";

const Footer = () => {
  return (
    <>
      <div className="bg-slate-950 backdrop-blur-md bg-opacity-40 backdrop-brightness-75 flex flex-col md:flex-row px-[5%] lg:px-[10%] mt-10 py-[2rem] gap-4 justify-center items-center">
        <div className="flex flex-col items-center justify-between w-full gap-6 py-3 sm:flex-row">
          <div className="flex items-center">
            <p className="mt-2 text-sm text-n-1">
              © 2026 SLIoT Challenge. All rights reserved.
            </p>
          </div>
          <ul className="flex flex-wrap gap-5">
            {socials.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                className="flex items-center justify-center w-10 h-10 transition-colors border rounded-full md:w-6 md:h-6 border-n-1"
              >
                <img
                  src={item.iconUrl}
                  width={14}
                  height={14}
                  alt={item.title}
                />
              </a>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Footer;
