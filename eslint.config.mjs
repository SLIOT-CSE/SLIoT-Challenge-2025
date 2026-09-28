import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  { ignores: [".next/**", "out/**", "node_modules/**"] },
  {
    rules: {
      "react/jsx-no-target-blank": "off",
      "react/prop-types": "off",
    },
  },
];

export default eslintConfig;
