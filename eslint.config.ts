import type { Linter } from "eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig: Linter.Config[] = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"] },
  {
    // Same files as eslint-config-next, where the react/react-hooks/@next plugins are registered
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
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
  {
    // CommonJS config files (PM2 needs .cjs; the Tailwind 3 config goes away with the Tailwind 4 upgrade)
    files: ["**/*.cjs", "tailwind.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
