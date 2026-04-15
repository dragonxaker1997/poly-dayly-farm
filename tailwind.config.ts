import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0284c7",
        line: "#263345",
        panel: "#111827",
        wash: "#070b12"
      }
    }
  },
  plugins: []
};

export default config;
