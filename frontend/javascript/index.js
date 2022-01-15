import "index.css"
import Prism from "prismjs"

import "prismjs/themes/prism-solarizedlight.css"

Prism.highlightAll()

// Import all JavaScript & CSS files from src/_components
import components from "bridgetownComponents/**/*.{js,jsx,js.rb,css}";

console.info("Bridgetown is loaded!")
