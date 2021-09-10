module.exports = {
  purge: {
    mode: "jit",
    content: [
      "./frontend/**/*.css",
      "./frontend/**/*.scss",
      "./src/**/*.erb",
      "./src/**/*.html",
      "./src/**/*.liquid",
      "./src/**/*.md",
    ],
  },
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      textOpacity: ["dark"],
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
