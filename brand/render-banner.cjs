const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
const { pathToFileURL } = require("url");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1584, height: 396 });
  await p.goto(pathToFileURL(path.join(__dirname, "li-banner.html")).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(__dirname, "li-banner.png"), type: "png" });
  await b.close();
  console.log("done");
})();
