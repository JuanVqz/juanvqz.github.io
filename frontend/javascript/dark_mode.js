function themeExists() {
  return "theme" in localStorage
}

function prefersDarkColor() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function isDarkTheme() {
  return localStorage.theme === "dark"
}

function darkModeButton() {
  return document.getElementById("toggle_dark_mode")
}

function lightSvg() {
  return darkModeButton().querySelector("svg.sun")
}

function darkSvg() {
  return darkModeButton().querySelector("svg.moon")
}

function toggleDarkMode() {
  if (isDarkTheme() || (!themeExists() && prefersDarkColor())) {
    document.documentElement.classList.add("dark")
    lightSvg().classList.remove("hidden")
    darkSvg().classList.add("hidden")
  } else {
    document.documentElement.classList.remove("dark")
    lightSvg().classList.add("hidden")
    darkSvg().classList.remove("hidden")
  }
}

function changeDarkMode() {
  if (lightSvg().classList.contains("hidden")) {
    localStorage.theme = "dark"
  } else {
    localStorage.theme = "light"
  }
  toggleDarkMode()
}

darkModeButton().addEventListener("click", changeDarkMode)
toggleDarkMode()
