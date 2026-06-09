import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", ".playwright-mcp/**"],
  },
  ...coreWebVitals,
  {
    rules: {
      // Apostrophes in JSX copy are fine
      "react/no-unescaped-entities": "off",
      // Hackathon-era code has many of these; tighten incrementally
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];

export default config;
