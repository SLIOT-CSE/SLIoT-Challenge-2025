import {
  youtube,
  facebook,
  linkedin,
  whatsapp,
  uom,
  cse,
  iesl,
  sltLogo,
  galleryImages,
} from "../assets";

const sliot2023 = galleryImages("SLIoT2023", 10);
const sliot2022 = galleryImages("SLIoT2022", 11);
const sliot2019 = galleryImages("SLIoT2019", 11);
const sliot2025 = [
  ...galleryImages("SLIoT2025/finals", 7, "jpeg"),
  ...galleryImages("SLIoT2025/semi", 24),
  ...galleryImages("SLIoT2025/uniworkshop", 23),
  ...galleryImages("SLIoT2025/schoolworkshop", 30),
];

export const navigation = [

  {
    id: "1",
    title: "Home",
    url: "home",
  },
  {
    id: "2",
    title: "About",
    url: "about",
  },
  {
    id: "4",
    title: "Challenge",
    url: "challenge",
  },
  {
    id: "5",
    title: "Timeline",
    url: "timeline",
  },
  {
    id: "6",
    title: "Gallery",
    url: "gallery",
  },
  {
    id: "7",
    title: "Spotlight",
    url: "spotlight",
  },
  {
    id: "8",
    title: "Partners",
    url: "partners",
  },
  {
    id: "9",
    title: "FAQs",
    url: "faqs",
  },
  {
    id: "10",
    title: "Contact",
    url: "contact",
    onlyMobile: true,
  },
  {
    id: "11",
    title: "Innovation Tour",
    url: "/innovation-tour",
    isExternal: true,
  },
];

export const socials = [
  // {
  //   id: "0",
  //   title: "Twitter",
  //   iconUrl: twitter,
  //   url: "#",
  // },
  {
    id: "1",
    title: "YouTube",
    iconUrl: youtube,
    url: "https://www.youtube.com/@SLIOT-Challenge",
  },
  {
    id: "2",
    title: "Facebook",
    iconUrl: facebook,
    url: "https://www.facebook.com/srilankaIoTchallenge/",
  },
  {
    id: "3",
    title: "WhatsApp",
    iconUrl: whatsapp,
    url: "https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05",
  },
  {
    id: "4",
    title: "LinkedIn",
    iconUrl: linkedin,
    url: "https://www.linkedin.com/company/sliot",
  },
];

export const aboutGridItems = [
  {
    id: 1,
    title: "What is the SLIoT Challenge?",

    description: `The SLIoT Challenge is the annual IoT competition organized by the Department of Computer Science & Engineering at the University of Moratuwa, in collaboration with SLT-MOBITEL and the Institution of Engineers, Sri Lanka (IESL). The competition provides a platform for innovators of Sri Lanka to showcase their ideas, which will be evaluated on creativity, value, impact, and technology, with winners selected based on overall performance on the event finals.`,

    className:
      "lg:col-span-6 md:col-span-6 md:row-span-4 lg:min-h-[60vh] ",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
];

export const guidelines = [
  {
    id: 21,
    title: "What is This Stage?",
    description: "",
    descriptionItems: [
      "Each team should pitch their idea as a proposal in this stage.",
      "Teams with approved proposals will go to the next stage and should start developing their solution.",
      "Workshops will be conducted to empower the teams."
    ],
    className:
      "col-span-6 text-n-1",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
  {
    id: 22,
    title: "Proposal Template",
    description: "",
    descriptionItems: [
      "The proposal must be created according to the given template.",
      "A panel of judges will shortlist the teams based on the proposals.",
      "The participants will be shortlisted separately for school,university and open categories."
    ],
    className:
      "col-span-6 text-n-1",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
  {
    id: 23,
    title: "Proposal Guidelines",
    description: "",
    descriptionItems: [
      "Language of Use - English.",
      "Download the Proposal template and fill your details in the necessary slides.",
      "The proposal content should not exceed 06 pages.",
      'The proposal should be named "[Team Name]_proposal".',
      'Teams must ensure that their proposal in pdf format.',
    ],
    className:
      "col-span-6 text-n-1",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
];

export const previousSLIoTShowcases = [
  {
    id: 8,
    title: "SLIoT 2023",
    description: "",
    className: "lg:col-span-3 md:col-span-6 md:row-span-4 lg:min-h-[40vh]",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 48vw, (min-width: 768px) 90vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: sliot2023[0],
    spareImg: "",
    link: "",
    imageArray: sliot2023,
    overlayClassName: "bg-black bg-opacity-20",
  },
  {
    id: 9,
    title: "SLIoT 2022",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: sliot2022[0],
    spareImg: "",
    link: "",
    imageArray: sliot2022,
    overlayClassName: "bg-black bg-opacity-20",
  },
  {
    id: 10,
    title: "SLIoT 2020",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: "https://img.youtube.com/vi/HLMQvP5e98c/hqdefault.jpg",
    spareImg: "",
    link: "https://www.youtube.com/embed/HLMQvP5e98c",
    overlayClassName: "bg-black bg-opacity-20",
  },
  {
    id: 11,
    title: "SLIoT 2019",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: sliot2019[0],
    spareImg: "",
    link: "",
    imageArray: sliot2019,
    overlayClassName: "bg-black bg-opacity-20",
  },
  {
    id: 12,
    title: "SLIoT 2018",
    description: "",
    className: "md:col-span-3 md:row-span-2",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 48vw, (min-width: 768px) 45vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: "https://img.youtube.com/vi/9bpgGZMNd28/hqdefault.jpg",
    spareImg: "",
    link: "https://www.youtube.com/embed/9bpgGZMNd28",
    overlayClassName: "bg-black bg-opacity-20",
  },
  {
    id: 13,
    title: "SLIoT 2017",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 32vw, (min-width: 768px) 45vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: "https://img.youtube.com/vi/v6wOjQGANsE/hqdefault.jpg",
    spareImg: "",
    link: "https://www.youtube.com/embed/v6wOjQGANsE",
    overlayClassName: "bg-black bg-opacity-20",
  },
];

export const currentSLIoTShowcases = [
  {
    id: 14,
    title: "SLIoT 2025",
    description: "",
    className: "lg:col-span-5 md:col-span-6 md:row-span-4 lg:min-h-[40vh]",
    // next/image hint: tile width at each breakpoint
    sizes: "(min-width: 1024px) 80vw, (min-width: 768px) 90vw, 92vw",
    imgClassName: "w-full h-full object-cover",
    titleClassName: "justify-end items-end text-end",
    img: sliot2025[0],
    spareImg: "",
    imageArray: sliot2025,
    overlayClassName: "bg-black bg-opacity-20",
  },
];

export const spotlight = [
  {
    id: 1,
    title: "What is IoT?",
    des: "Explained by Prof. Chandana Gamage | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p1.svg",
    link: "https://www.youtube.com/embed/mIJdCAKL71I",
  },
  // {
  //   id: 2,
  //   title: "What is Industry 4.0?",
  //   des: "Explained by Prof. Chandana Gamage | SLIoT Challenge 2025",
  //   img: "/p2.svg",
  //   link: "https://www.youtube.com/embed/kdI_04VvLmk",
  // },
  {
    id: 3,
    title: "How to start an IoT Project?",
    des: "Explained by Dr. Kutila Gunasekara | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p3.svg",
    link: "https://www.youtube.com/embed/vVw2Q92ydsc",
  },
  {
    id: 4,
    title: "Communication between Embedded Devices",
    des: "Explained by Dr. Sulochana Sooriyaarachchi | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p4.svg",
    link: "https://www.youtube.com/embed/eiyhMLFVdMU",
  },
  {
    id: 5,
    title: "Value of Security for IoT Solutions",
    des: "Explained by Dr. Sunimal Rathnayaka | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p1.svg",
    link: "https://www.youtube.com/embed/Gw6NmLdHqiA",
  },
  {
    id: 6,
    title: "Applications of IoT",
    des: "Explained by Prof. Chandana Gamage | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p2.svg",
    link: "https://www.youtube.com/embed/LJnJDyBk4_4",
  },
  {
    id: 7,
    title: "IOT Sensors",
    des: "Explained by Dr. Chathuranga Hettiarachchi | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p3.svg",
    link: "https://www.youtube.com/embed/MHwnCB3-kzA",
  },
  {
    id: 8,
    title: "What is AIOT?",
    des: "Explained By Dr. Thanuja Ambegoda | SLIoT Challenge",
    des2: "SLIoT Challenge 2025",
    img: "/p4.svg",
    link: "https://www.youtube.com/embed/UVdn4ZTJ3_Q",
  },
];

export const categories = [
  {
    id: 1,
    title: "SCHOOL CATEGORY",
    category: "school",
  },
  {
    id: 2,
    title: "UNIVERSITY CATEGORY",
    category: "university",
  },
  {
    id: 3,
    title: "OPEN CATEGORY",
    category: "open",
  },
  // {
  //   id: 4,
  //   title: "Lead Frontend Developer",
  //   desc: "Developed and maintained user-facing features using modern frontend technologies.",
  //   className: "md:col-span-2",
  //   thumbnail: "/exp4.svg",
  // },
];

export const organizers = [
  {
    id: 1,
    img: iesl,
    className: "w-36",
  },
  {
    id: 2,
    img: cse,
    className: "w-36",
  },
  {
    id: 3,
    img: sltLogo,
    className: "w-36",
  },
  {
    id: 4,
    img: uom,
    className: "w-36",
  },
]; 
