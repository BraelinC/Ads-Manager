const { chromium } = require("playwright");

const adArchiveId = process.argv[2];
const browserUrl = process.env.LIVE_BROWSER_URL || "http://127.0.0.1:9222";

if (!adArchiveId) {
  console.error("Usage: node scripts/open-dco-ad-details.js <ad_archive_id>");
  process.exit(1);
}

async function pickTargetPage(context, archiveId) {
  const pages = context.pages();
  for (const page of [...pages].reverse()) {
    try {
      if (page.url().includes(`id=${archiveId}`)) return page;
    } catch {}
  }
  return pages[pages.length - 1];
}

async function main() {
  const browser = await chromium.connectOverCDP(browserUrl);
  const context = browser.contexts()[0];
  const page = await pickTargetPage(context, adArchiveId);
  await page.bringToFront();
  await page.waitForTimeout(5000);

  const result = await page.evaluate(async (id) => {
    const visibleDialogs = () =>
      [...document.querySelectorAll('[role="dialog"]')].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    const linkDialog = visibleDialogs().find(
      (el) => (el.innerText || "").includes("Link to ad") && (el.innerText || "").includes(`Library ID: ${id}`)
    );
    if (linkDialog) {
      const btn = [...linkDialog.querySelectorAll('button, [role="button"]')].find(
        (el) => (el.innerText || el.textContent || "").trim() === "See ad details"
      );
      if (btn) {
        btn.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } else {
      const nodes = [...document.querySelectorAll('*')];
      const idNode = nodes.find((el) => (el.innerText || "").includes(`Library ID: ${id}`));
      if (!idNode) return { ok: false, reason: "id not found on page" };

      let card = idNode;
      for (let i = 0; i < 10 && card; i += 1, card = card.parentElement) {
        if ((card.innerText || "").includes("See ad details") || (card.innerText || "").includes("See summary details")) {
          break;
        }
      }

      if (!card) return { ok: false, reason: "matching card not found" };

      const btn = [...card.querySelectorAll('button, [role="button"]')].find((el) =>
        /See ad details/.test((el.innerText || el.textContent || "").trim())
      );
      if (!btn) return { ok: false, reason: "details button not found on matching card" };
      btn.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const details = visibleDialogs().find(
      (el) => (el.innerText || "").includes("Ad Details") && (el.innerText || "").includes(`Library ID: ${id}`)
    );

    return {
      ok: !!details,
      reason: details ? null : "target Ad Details overlay not active",
      detailsText: details ? (details.innerText || "").slice(0, 800) : null,
    };
  }, adArchiveId);

  console.log(JSON.stringify(result, null, 2));
  await browser.close();

  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
