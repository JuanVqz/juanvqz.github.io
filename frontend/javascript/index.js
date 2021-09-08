import "gruvbox.css"
import "index.scss"

// Import all javascript files from src/_components
const componentsContext = require.context("bridgetownComponents", true, /.js$/)
componentsContext.keys().forEach(componentsContext)

// On page load or when changing themes, best to add inline in `head` to avoid FOUC
if (
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark")
} else {
  document.documentElement.classList.remove("dark")
}

// Whenever the user explicitly chooses light mode
//localStorage.theme = "light"

// Whenever the user explicitly chooses dark mode
localStorage.theme = "dark"
console.log("localStorage ", localStorage.getItem("theme"))

// Whenever the user explicitly chooses to respect the OS preference
//localStorage.removeItem("theme")

console.info("Bridgetown is loaded!")
