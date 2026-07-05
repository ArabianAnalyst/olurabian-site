// Generic 1200x630 OG-card renderer:  node render-card.cjs <input.html> <output.png>
const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
const { pathToFileURL } = require("url");
const [, , html, png] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.goto(pathToFileURL(path.join(__dirname, html)).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(__dirname, png), type: "png" });
  await b.close();
  console.log("done ->", png);
})();
