/* Small, optional enhancements for the portfolio's document pages.
   The homepage already initializes its flavor switcher through site.js. */
import { initFlavors } from "./chrome.js";

initFlavors();

for (const button of document.querySelectorAll("[data-print], [data-print-resume]")) {
  button.addEventListener("click", () => window.print());
  // Keep an inert print control out of the no-JavaScript experience.
  button.hidden = false;
}
