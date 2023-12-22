import "index.css"
import "pagination.css"
import Prism from "prismjs"

import "prismjs/themes/prism-solarizedlight.css"

import "prismjs/components/prism-bash.js"
import "prismjs/components/prism-docker.js"
import "prismjs/components/prism-dot.js"
import "prismjs/components/prism-yaml.js"
import "prismjs/components/prism-ruby.js"

Prism.highlightAll()

// Import all JavaScript & CSS files from src/_components
// import components from "bridgetownComponents/**/*.{js,jsx,js.rb,css}";
import $ from "jquery";

$(document).ready(function () {
  console.log("jQuery is ready!")
  $("main h2").css("color", "red");
});

console.info("Bridgetown is loaded!")

document.addEventListener('DOMContentLoaded', () => {
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      console.log('LCP candidate:', entry.startTime, entry);
    }
  }).observe({type: 'largest-contentful-paint', buffered: true});
});
