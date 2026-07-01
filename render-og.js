const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.goto("file://" + path.join(__dirname, "og.html").replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(__dirname, "og-image.png"), type: "png" });
  await b.close();
  console.log("done -> og-image.png");
})();
