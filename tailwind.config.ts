import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'global-text': '#ffffff',
        'global-text-second': '#1f1f1f',
        'primary': '#3B82F6',
        'secondary': '#64748B',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.text-primary-custom': {
          color: '#3B82F6',
        },
        '.text-secondary-custom': {
          color: '#64748B',
        },
        '.text-global-white': {
          color: '#ffffff',
        },
        '.text-global-dark': {
          color: '#1f1f1f',
        },
        '.bg-primary-custom': {
          'background-color': '#3B82F6',
        },
        '.bg-secondary-custom': {
          'background-color': '#64748B',
        },
        '.border-primary-custom': {
          'border-color': '#3B82F6',
        },
        '.border-secondary-custom': {
          'border-color': '#64748B',
        },
      });
    }),
  ],
};
export default config;
