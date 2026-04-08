import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL || "http://localhost:10000";
const OUT_DIR = path.join(process.cwd(), "public", "screenshots");
const PAGES = [
  { url: "/admin/ministries", name: "admin-ministries" },
  { url: "/admin/church-contacts", name: "admin-church-contacts" },
  { url: "/admin/ministry-contacts", name: "admin-ministry-contacts" },
  { url: "/contact", name: "contact" },
  { url: "/get-involved", name: "get-involved" }
];

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  const serverReady = await waitForServer(BASE, 20000);
  if (!serverReady) {
    console.error(`Server not responding at ${BASE}. Make sure the app is running.`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  for (const p of PAGES) {
    const url = BASE + p.url;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // give some time for client-side assets
      await page.waitForTimeout(800);
      const out = path.join(OUT_DIR, `${p.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`Saved ${out}`);
    } catch (err) {
      console.error(`Failed to capture ${url}:`, err.message || err);
    }
  }

  await browser.close();
  console.log('Screenshots complete');
  process.exit(0);
})();
