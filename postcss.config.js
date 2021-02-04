module.exports = {
  plugins: [
    require("postcss-import", {
      path: "frontend/styles",
      plugins: [],
    }),
    require("tailwindcss"),
    require("autoprefixer"),
  ],
};
