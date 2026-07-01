const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const file = "file://" + path.join(__dirname, "index.html").replace(/\\/g, "/");

  // desktop full page
  const d = await browser.newPage();
  await d.setViewportSize({ width: 1440, height: 900 });
  await d.goto(file, { waitUntil: "networkidle" });
  await d.waitForTimeout(1200);
  await d.screenshot({ path: path.join(__dirname, "preview-desktop.png"), fullPage: true });
  // desktop hero only (above the fold)
  await d.screenshot({ path: path.join(__dirname, "preview-hero.png") });

  // mobile full page
  const m = await browser.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(file, { waitUntil: "networkidle" });
  await m.waitForTimeout(1200);
  await m.screenshot({ path: path.join(__dirname, "preview-mobile.png"), fullPage: true });

  await browser.close();
  console.log("done");
})();
