// Image paths served from public/images. Gallery photo lists live in
// src/constants (see galleryImages).
const img = (path) => `/images/${path}`;

export const logo = img("sliot-logo.svg");

export const facebook = img("socials/facebook.svg");
export const youtube = img("socials/youtube.svg");
export const linkedin = img("socials/linkedin.svg");
export const whatsapp = img("socials/whatsapp.svg");

export const first = img("prizes/first.png");
export const second = img("prizes/second.png");
export const third = img("prizes/third.png");

export const robot = img("robot.png");
// 2027 hero figure; cut off on its right and bottom edges (see HeroFigure)
export const figure = img("sliot-figure.webp");
export const point = img("checked.png");

export const sltLogo = img("partners/SLT-Mobitel.png");
export const cse = img("partners/cse.jpg");
export const iesl = img("partners/iesl.jpg");
export const uom = img("partners/uom.gif");

export const chairman = img("people/buwaneka.avif");
export const viceChairman1 = img("people/yasiru.avif");
export const viceChairman2 = img("people/gishan.avif");

// Builds numbered photo paths, e.g. galleryImages("SLIoT2023", 10)
// -> ["/images/gallery/SLIoT2023/1.jpg", ... "/images/gallery/SLIoT2023/10.jpg"]
export const galleryImages = (folder, count, ext = "jpg") =>
  Array.from({ length: count }, (_, i) => img(`gallery/${folder}/${i + 1}.${ext}`));
