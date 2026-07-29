import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1A18",
        ember: "#E8650A",
        sand: "#F7F4EF",
        clay: "#DCD5CB",
      },
      boxShadow: {
        card: "0 10px 26px rgba(22, 19, 14, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
