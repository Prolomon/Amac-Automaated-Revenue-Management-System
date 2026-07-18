const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 2,
      features: {
        "lab-function": true,   // Translates lab() & lch() colors
        "oklab-function": true, // Translates oklab() & oklch() colors (Tailwind's format)
      },
    },
  },
};

export default config;
