/** @type {import('tailwindcss').Config} */
const nextConfig = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

module.exports = nextConfig;
