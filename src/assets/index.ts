// Image paths served from public/images. Section photos and logos are listed in src/content/.
const img = (path: string) => `/images/${path}`;

export const logo = img("sliot-logo.svg");
// 2027 hero figure; cut off on its right and bottom edges (see HeroFigure)
export const figure = img("sliot-figure.webp");
