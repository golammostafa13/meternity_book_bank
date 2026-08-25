import puppeteer from "puppeteer-core";
const out = "/tmp/claude-1000/-home-spectrum-Documents-library-maternity-book-bank/b2419dba-e5fa-4d56-ba62-63f79876c2da/scratchpad";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox","--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({width:1400,height:1000});
const bad = [];
page.on("pageerror", e => bad.push(`[pageerror] ${e.message}`));
page.on("requestfailed", r => bad.push(`[reqfail] ${r.url()}: ${r.failure()?.errorText}`));
page.on("response", r => { if (r.status() >= 400) bad.push(`[http ${r.status()}] ${r.url()}`); });
page.on("console", m => { if (m.type()==="error") bad.push(`[console] ${m.text()}`); });

await page.goto("http://localhost:3000/en/signin", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.type("#email","mostafarmstu@gmail.com");
await page.type("#password","Exiumm");
await page.waitForFunction(() => !document.querySelector(".intro"), { timeout: 15000 });
await page.click('button[type="submit"]');
await new Promise(r=>setTimeout(r,6000));

for (const slug of ["babys-best-chance","who-labour-care-guide"]) {
  bad.length = 0;
  await page.goto(`http://localhost:3000/en/read/${slug}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await new Promise(r=>setTimeout(r,15000));
  const state = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    const painted = canvases.filter(c => c.width > 50 && c.height > 50).length;
    return { canvases: canvases.length, painted, text: document.body.innerText.slice(0,300) };
  });
  console.log(`\n=== ${slug} ===`);
  console.log("canvases:", state.canvases, "painted:", state.painted);
  console.log("problems:", bad.length ? bad.slice(0,8) : "none");
  await page.screenshot({ path: `${out}/read-${slug}.png` });
}

// What ranges did the route actually forward?
await browser.close();
