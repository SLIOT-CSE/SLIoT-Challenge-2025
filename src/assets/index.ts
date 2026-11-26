// Image paths served from public/images. Section photos and logos are listed in src/content/.
const img = (path: string) => `/images/${path}`;

export const logo = img("sliot-logo.svg");
// 2027 hero figure; cut off on its right and bottom edges (see HeroFigure)
export const figure = img("sliot-figure.webp");
// Centered footer robot figure; temporarily points to sliot-figure.webp until a dedicated
// centered standing figure is generated at public/images/sliot-footer-figure.webp.
export const footerFigure = img("sliot-figure.webp");
// Dark aurora IoT showcase arena backdrop for the Prizes podium
export const prizesBackdrop = img("prizes-arena.webp");
// Dark architectural light-corridor backdrop for the Timeline section
export const timelineBackdrop = img("timeline-corridor.webp");
// Hero portal ring: the neon arcane tech circle (square and centred, so it spins without wobbling)
export const portalRing = img("arcane-circle.webp");
