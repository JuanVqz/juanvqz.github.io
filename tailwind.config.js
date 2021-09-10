module.exports = {
  purge: {
    enabled: process.env.NODE_ENV === "production",
    content: [
      "./frontend/**/*.css",
      "./frontend/**/*.scss",
      "./src/**/*.erb",
      "./src/**/*.html",
      "./src/**/*.liquid",
      "./src/**/*.md",
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {
              "&:hover": {
                color: theme("colors.green.500"),
              },
            },
            strong: {
              color: theme("colors.green.600"),
            },
            blockquote: {
              color: theme("colors.gray.400"),
            },
            h4: {
              color: theme("colors.gray.200"),
            },
            thead: {
              color: theme("colors.green.600"),
            },
          },
        },
      }),
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography")],
}
