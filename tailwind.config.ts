import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151c",
        line: "#dfe3ea",
        panel: "#ffffff",
        wash: "#f5f7fa"
      }
    }
  },
  plugins: []
};

export default config;
