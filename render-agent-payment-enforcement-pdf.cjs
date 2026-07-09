const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
const { pathToFileURL } = require("url");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(pathToFileURL(path.join(__dirname, "agent-payment-enforcement.print.html")).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.pdf({
    path: path.join(__dirname, "agent-payment-enforcement.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "20mm", right: "20mm" }
  });
  await b.close();
  console.log("done -> agent-payment-enforcement.pdf");
})();
