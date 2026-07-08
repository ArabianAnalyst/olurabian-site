const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
const { pathToFileURL } = require("url");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.goto(pathToFileURL(path.join(__dirname, "og-get-paid.html")).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(__dirname, "og-get-paid.png"), type: "png" });
  await b.close();
  console.log("done -> og-get-paid.png");
})();
