import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  { ignores: [".next/**", "out/**", "node_modules/**"] },
  {
    rules: {
      "react/jsx-no-target-blank": "off",
      "react/prop-types": "off",
      // Plain <img> is kept on purpose so the port stays pixel-identical;
      // only the gallery uses next/image.
      "@next/next/no-img-element": "off",
      // Internal links are plain <a> (full reload), matching the Vite site.
      "@next/next/no-html-link-for-pages": "off",
      // React Compiler rules flag long-standing patterns in the copied UI
      // components (random colours, refs in deps). Kept visible as warnings.
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;
