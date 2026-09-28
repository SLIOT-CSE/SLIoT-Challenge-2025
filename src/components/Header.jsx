import { useState, useEffect } from "react";
import { navigation } from "../constants";
import MenuSvg from "../assets/svg/MenuSvg";
import { disablePageScroll, enablePageScroll } from "scroll-lock";
import { logo } from "@/assets";
import { closeMenu, openMenu } from "./animations";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const [openNavigation, setOpenNavigation] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleNavigation = () => {
    if (openNavigation) {
      closeMenu();
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      openMenu();
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const smoothScroll = (targetId, duration = 1500) => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const targetPosition = targetElement.getBoundingClientRect().top;
    const startPosition = window.scrollY;
    let startTime = null;

    const animation = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, targetPosition, duration);
      window.scrollTo(0, run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    const easeInOutQuad = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animation);
  };

  const handleClick = (id, isExternal) => {
    if (openNavigation) {
      enablePageScroll();
      closeMenu();
      setOpenNavigation(false);
    }

    // If it's marked as external (like /innovation-tour), just navigate
    if (isExternal) {
      navigate(id);
      return;
    }

    // If we're not on the homepage, navigate to homepage first, then scroll
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        smoothScroll(id, 1500);
      }, 100);
      return;
    }

    // If we're already on homepage, just scroll
    smoothScroll(id, 1500);
  };

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    navigation.forEach((item) => {
      const section = document.getElementById(item.url);
      if (section) sectionObserver.observe(section);
    });

    return () => sectionObserver.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* <div className="flex items-center justify-center"> */}
      <div
        className={`fixed top-0 w-full px-[5%] xl:px-[6%] mx-auto z-40 shadow-xl backdrop-blur-lg backdrop-brightness-75 nav-primary`}
      >
        <div className={`flex xl:items-center xl:justify-between px-5 lg:px-7.5 xl:px-10 max-xl:py-4 ${openNavigation ? "flex-col justify-start items-start " : "justify-between items-center"}`}>
          <a
            className={`flex items-center xl:mr-8 ${openNavigation ? "" : "w-[12rem]"
              }`}
            href="/"
          >
            <img src={logo} width={100} height={100} alt="sliot" />
          </a>
          <button
            className={`xl:hidden ${openNavigation ? "z-6 absolute top-9 right-[8%]" : ""}`}
            onClick={toggleNavigation}
          >
            <MenuSvg openNavigation={openNavigation} />
          </button>
          <nav
            className={`${openNavigation
              ? "flex h-screen justify-start align-top   items-start"
              : "hidden"
              } rounded-lg xl:static xl:flex xl:bg-transparent xl:items-center`}
          >
            <div className="relative flex flex-col items-start justify-center my-3 text-center z-2 xl:flex-row xl:items-center xl:bg-transparent xl:px-0 rounded-xl nav-link">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.url, item.isExternal)}
                  className={`relative font-poppins text-base transition-colors px-5 alexandria py-4 md:py-6 xl:px-4 lg:text-sm lg:font-normal ${item.onlyMobile ? "lg:hidden" : ""
                    } ${activeSection === item.url
                      ? "text-sky-500"
                      : "text-n-1 hover:text-[#77FF00]"
                    }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </nav>
          <button
            className="hidden alexandria xl:inline-flex relative h-12 overflow-hidden rounded-2xl p-[1px] focus:outline-none"
            onClick={() => {
              if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                  smoothScroll("contact", 1500);
                }, 100);
              } else {
                smoothScroll("contact", 1500);
              }
            }}
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#46BC41_0%,#01688E_50%,#46BC41_100%)]" />
            <span className="inline-flex items-center justify-center w-full h-full gap-2 px-12 text-sm font-medium cursor-pointer rounded-2xl bg-slate-950 text-n-1 backdrop-blur-3xl">
              Contact
            </span>
          </button>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default Header;