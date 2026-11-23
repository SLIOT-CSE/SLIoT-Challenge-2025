
import { logo } from "@/assets";

import { FaCircleArrowLeft } from "react-icons/fa6";
const GuilineHeader = () => {
  




  return (
    <div className="flex flex-col items-center justify-center ">
      
     
        <div
          className={`fixed top-0 w-full px-[5%] xl:px-[6%] mx-auto z-40 shadow-xl backdrop-blur-lg backdrop-brightness-75 nav-primary h-20  flex justify-between`}
        >
        <a
              className="flex items-center xl:mr-8 w-[12rem]"
              
              href="/"
            >
              <img src={logo} width={100} height={100} alt="sliot" />
            </a>
            <div    className="flex items-center justify-center gap-4">
       <a  href="/">
      <button
              className=" inline-flex relative h-10 md:h-12 overflow-hidden rounded-2xl p-[1px] focus:outline-none"
           
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#2b0091_0%,#393BB2_50%,#ff00a4_100%)]" />
              <span className="inline-flex items-center justify-center w-full h-full gap-2 px-12 text-sm font-medium cursor-pointer rounded-2xl bg-slate-950 text-n-4 backdrop-blur-3xl">
            <FaCircleArrowLeft className="w-6 h-6 text-white bg-transparent" />
              </span>
            </button>
        </a>       




        
            </div>
        </div>
   
    </div>
  );
};

export default   GuilineHeader;