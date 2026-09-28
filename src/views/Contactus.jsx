import React from "react";
import Pavan from "../assets/uom.gif"; // Update the image path
import Kaveesha from "../assets/uom.gif";  // Update the image path

const ContactUs = () => {
  return (
    <section className=" py-16  text-white text-center w-full px-[5%] lg:px-[4%] xl:px-[10%] ">
      <h1 className="text-5xl font-bold text-[#FF007F] uppercase mb-12">
        Contact Us
      </h1>

      <div className="flex flex-col lg:items-start items-center mb-10">
        {/* Contact Card 1 */}
        <div className="flex lg:flex-row flex-col items-center gap-5 justify-center  p-8 lg:rounded-full rounded-3xl lg:border border-gray-400 lg:shadow-lg shadow-xl  shadow-slate-950 w-3/5 lg:w-8/12 hover:bg-black transition-colors duration-'3000'">
          <img
            src={Pavan}
            alt="Pavan Epa"
            className="w-40 h-40 rounded-full object-cover mr-8 border-4 border-[#FF007F]"
          />
          <div className="lg:text-left text-center ">
            <h2 className="text-2xl font-bold text-[#FF007F]">
              Pavan Epa
            </h2>
            <p className="font-semibold">Event Chairman</p>
            <p className="text-base text-gray-300">
              Department of Computer Science & Engineering, University of Moratuwa
            </p>
            <p className="italic text-gray-400 mt-2">pavan.22@cse.mrt.ac.lk</p>
          </div>
        </div>
     </div> 
     <div className="flex flex-col lg:items-end items-center ">   

        {/* Contact Card 2 */}
        <div className="flex lg:flex-row flex-col items-center justify-center gap-5 p-8 lg:rounded-full rounded-3xl lg:border border-gray-400 lg:shadow-lg shadow-xl  shadow-slate-950  w-3/5 lg:w-8/12">
          <img
            src={Kaveesha}
            alt="Kaveesha Kapuruge"
            className="w-40 h-40 rounded-full object-cover mr-8 border-4 border-[#FF007F]"
          />
          <div className="lg:text-left text-center">
            <h2 className="text-2xl font-bold text-[#FF007F]">
              Kaveesha Kapuruge
            </h2>
            <p className="font-semibold">Event Vice Chairman</p>
            <p className="text-base text-gray-300">
              Department of Computer Science & Engineering, University of Moratuwa
            </p>
            <p className="italic text-gray-400 font-semibold mt-2">kaveesha.22@cse.mrt.ac.lk</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
