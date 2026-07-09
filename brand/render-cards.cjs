const { chromium } = require("C:/Users/ARABA/Workspace/Social Content/Carousels/mwp-system/node_modules/playwright");
const path = require("path");
const { pathToFileURL } = require("url");
const cards = [
  ["01-sale-ready","Sale-Ready · exit","Half of business sales fall apart in <em>due diligence</em>.","olurabian.com/sale-ready"],
  ["02-purse","Purse · agent payments","An AI agent with a wallet is one poisoned instruction from <em>spending your money</em>.","olurabian.com/purse"],
  ["03-operator","The operator","Six products this year. <em>One person, no team.</em>","olurabian.com"],
  ["04-sale-ready-owner","Sale-Ready · exit","The fastest way to lose money selling your business. <em>Be the business.</em>","olurabian.com/sale-ready"],
  ["05-invobi","invobi · payments","Your invoicing tool works great. Until a client pays <em>from Lagos</em>.","invobi.app"],
  ["06-company-brain","Company Brain · memory","Your AI keeps getting your company wrong. Not the model. <em>The memory.</em>","olurabian.com/company-brain"],
  ["07-thesis","The thesis","The moat was <em>never the model</em>.","olurabian.com"],
  ["08-sale-ready-cash","Sale-Ready · exit","How much of your profit is <em>actually in the bank</em>?","olurabian.com/sale-ready"],
  ["09-deal-screen","Deal Screen · pre-LOI","Screen a hundred businesses to buy one. Then <em>rush the one that matters</em>.","olurabian.com/deal-screen"],
  ["10-get-paid","Get Paid · receivables","The most awkward email a founder sends. <em>Just circling back on that invoice.</em>","olurabian.com/get-paid"],
  ["11-purse-card","Purse · agent payments","Would you give an AI agent <em>your company credit card</em>?","olurabian.com/purse"],
  ["12-sale-ready-broker","Sale-Ready · brokers","Every deal that dies in diligence is a broker's <em>unpaid months</em>.","olurabian.com/sale-ready"],
  ["13-operator-lesson","The operator","The best decision I made this year was <em>killing a service I had built</em>.","olurabian.com"],
  ["14-thesis-synth","The thesis","Intelligence got cheap this year. <em>Accountability did not.</em>","olurabian.com"],
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1080, height: 1350 });
  await p.goto(pathToFileURL(path.join(__dirname, "card.html")).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  for (const [file, eyebrow, hook, url] of cards) {
    await p.evaluate(([e,h,u]) => {
      document.getElementById("eyebrow").textContent = e;
      document.getElementById("hook").innerHTML = h;
      document.getElementById("url").textContent = u;
    }, [eyebrow, hook, url]);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(__dirname, "cards", `card-${file}.png`), type: "png" });
  }
  await b.close();
  console.log("rendered " + cards.length + " cards");
})();
