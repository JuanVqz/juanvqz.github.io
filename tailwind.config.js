module.exports = {
  purge: [],
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
