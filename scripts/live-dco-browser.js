const { chromium } = require("playwright");

const targetUrl = process.argv[2] || "https://www.facebook.com/ads/library/?id=1945688923043227";
const action = process.argv[3] || "inspect";
const browserUrl = process.env.LIVE_BROWSER_URL || "http://127.0.0.1:9222";

async function pickPage(context, preferNewPage) {
  const pages = context.pages();
  if (preferNewPage || pages.length === 0) {
    return await context.newPage();
  }
  return pages[0];
}

async function main() {
  const browser = await chromium.connectOverCDP(browserUrl);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = await pickPage(context, action === "open-new");

  await page.bringToFront();
  await page.setViewportSize({ width: 1440, height: 1100 });

  if (action === "open" || action === "open-new") {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(2500);
  }

  if (action === "click-details") {
    const modal = page.getByRole("dialog").filter({ hasText: "Link to ad" }).first();

    try {
      await modal.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      throw new Error("Link to ad modal not found. Put the browser back on that overlay first.");
    }

    const candidates = [
      modal.getByRole("button", { name: /^See ad details$/i }).first(),
      modal.getByText(/^See ad details$/i).first(),
      modal.locator("text=See ad details").first(),
    ];

    let clicked = false;
    for (const candidate of candidates) {
      try {
        await candidate.waitFor({ state: "visible", timeout: 5000 });
        await candidate.click({ timeout: 5000, force: true });
        clicked = true;
        break;
      } catch {}
    }

    if (!clicked) {
      clicked = await modal.evaluate((dialog) => {
        const els = [...dialog.querySelectorAll("button, [role='button']")];
        const target = els.find((el) => (el.innerText || el.textContent || "").trim() === "See ad details");
        if (!target) return false;
        target.click();
        return true;
      });
    }

    if (!clicked) {
      const buttons = await modal
        .locator("button, [role='button']")
        .evaluateAll((els) => els.map((el) => (el.innerText || el.textContent || "").trim()).filter(Boolean));
      throw new Error(`Could not click modal 'See ad details'. Visible modal buttons: ${JSON.stringify(buttons.slice(0, 20))}`);
    }

    await page.waitForTimeout(2500);
  }

  const state = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    text: document.body.innerText.slice(0, 2000),
    buttons: [...document.querySelectorAll("button, [role='button']")]
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 20),
  }));

  console.log(JSON.stringify(state, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
