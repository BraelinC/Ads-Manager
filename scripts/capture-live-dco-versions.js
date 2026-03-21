const { chromium } = require("playwright");

const adArchiveId = process.argv[2] || "1945688923043227";
const totalVersionsOverride = Number(process.argv[3] || "0") || null;
const browserUrl = process.env.LIVE_BROWSER_URL || "http://127.0.0.1:9222";
const closeTargetPage = process.env.CLOSE_DCO_TAB !== "0";

async function pickTargetPage(context, archiveId) {
  const pages = context.pages();

  for (const page of [...pages].reverse()) {
    try {
      const url = page.url();
      if (url.includes(`id=${archiveId}`)) {
        await page.bringToFront();
        return page;
      }
    } catch {}
  }

  for (const page of [...pages].reverse()) {
    try {
      const matches = await page.evaluate((id) => document.body.innerText.includes(`Library ID: ${id}`), archiveId);
      if (matches) {
        await page.bringToFront();
        return page;
      }
    } catch {}
  }

  return pages[pages.length - 1];
}

function cleanText(value) {
  return (value || "").replace(/\u200b/g, "").trim();
}

async function resetStaleDetailsOverlay(page, targetArchiveId) {
  await page.evaluate(async (archiveId) => {
    const visibleDialogs = () =>
      [...document.querySelectorAll('[role="dialog"]')].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    const staleDetails = visibleDialogs().find(
      (el) => /Ad Details/.test(el.innerText || "") && !(el.innerText || "").includes(`Library ID: ${archiveId}`)
    );

    if (staleDetails) {
      const close = [...staleDetails.querySelectorAll('button, [role="button"]')].find((el) =>
        /^Close/.test((el.innerText || el.textContent || "").trim())
      );
      if (close) {
        close.click();
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }, targetArchiveId);
}

async function extractVersion(page) {
  return await page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const adDetails = dialogs.find((el) => /Ad Details/.test(el.innerText || "")) || dialogs[dialogs.length - 1];
    if (!adDetails) return null;

    const text = (adDetails.innerText || "").replace(/\u200b/g, "").trim();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const versionLabel = lines.find((line) => /^\d+ of \d+$/.test(line)) || null;
    const ctaText = ["Download", "Install Now", "Install now", "Shop Now", "Learn More", "Sign Up", "Book Now"]
      .find((label) => lines.includes(label)) || null;
    const captionIndex = lines.findIndex((line) => /^[A-Z0-9.-]+$/.test(line) && !line.includes("Library ID") && line.length < 80);
    const caption = captionIndex >= 0 ? lines[captionIndex] : null;
    const bodyStart = lines.findIndex((line) => line === "Sponsored");
    const bodyEnd = captionIndex >= 0 ? captionIndex : lines.length;
    const bodyText = bodyStart >= 0
      ? lines.slice(bodyStart + 2, bodyEnd).filter((line) => !/^Library ID:/.test(line) && !/^Open Dropdown/.test(line) && !/^0:00 /.test(line)).join("\n\n")
      : "";

    const linkNodes = [...adDetails.querySelectorAll('a')];
    const destination = linkNodes.find((a) => /sng\.link|apps\.apple\.com|play\.google\.com|l\.facebook\.com/i.test(a.href || ""));
    const versionImages = [...adDetails.querySelectorAll('img')]
      .filter((img) => img.clientWidth >= 40 && img.clientWidth <= 120 && img.clientHeight >= 40 && img.clientHeight <= 120)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean);
    const video = adDetails.querySelector('video');

    return {
      versionLabel,
      totalVersions: versionLabel ? Number(versionLabel.split(" of ")[1]) : null,
      bodyText,
      ctaText,
      caption,
      landingPageUrl: destination ? destination.href : null,
      videoUrl: video ? (video.currentSrc || video.src || null) : null,
      posterUrl: video ? (video.poster || null) : null,
      thumbnailUrl: versionImages[1] || versionImages[0] || null,
      thumbStrip: versionImages,
      rawText: text,
    };
  });
}

async function clickVersion(page, targetIndex) {
  return await page.evaluate(async (index) => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const adDetails = dialogs.find((el) => /Ad Details/.test(el.innerText || "")) || dialogs[dialogs.length - 1];
    if (!adDetails) return false;

    const imgs = [...adDetails.querySelectorAll('img')].filter((img) => img.clientWidth >= 40 && img.clientWidth <= 120 && img.clientHeight >= 40 && img.clientHeight <= 120);
    const currentLabel = [...adDetails.querySelectorAll('*')].map((el) => (el.innerText || '').trim()).find((text) => /^\d+ of \d+$/.test(text));
    if (currentLabel && Number(currentLabel.split(' of ')[0]) === index) return true;

    const target = imgs[index];
    if (!target) return false;
    target.click();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return true;
  }, targetIndex);
}

async function main() {
  const browser = await chromium.connectOverCDP(browserUrl);
  const context = browser.contexts()[0];
  const page = await pickTargetPage(context, adArchiveId);

  await resetStaleDetailsOverlay(page, adArchiveId);

  const first = await extractVersion(page);
  if (!first || !first.rawText.includes(adArchiveId)) {
    throw new Error(`Ad Details overlay for ${adArchiveId} is not active in the live browser.`);
  }

  const totalVersions = totalVersionsOverride || first.totalVersions || 1;
  const results = [];

  for (let versionIndex = 1; versionIndex <= totalVersions; versionIndex += 1) {
    const ok = await clickVersion(page, versionIndex);
    if (!ok) continue;
    await page.waitForTimeout(1200);
    const version = await extractVersion(page);
    if (!version) continue;
    const label = version.versionLabel || `${versionIndex} of ${totalVersions}`;
    results.push({
      versionIndex: Number(label.split(" of ")[0]),
      versionLabel: label,
      bodyText: cleanText(version.bodyText),
      ctaText: version.ctaText ? cleanText(version.ctaText) : undefined,
      caption: version.caption ? cleanText(version.caption) : undefined,
      landingPageUrl: version.landingPageUrl || undefined,
      videoUrl: version.videoUrl || undefined,
      posterUrl: version.posterUrl || undefined,
      thumbnailUrl: version.thumbnailUrl || undefined,
      creativeFingerprint: cleanText([version.videoUrl, version.posterUrl, version.thumbnailUrl].filter(Boolean).join("|")) || undefined,
      extractedAt: new Date().toISOString(),
      source: "facebook-ad-details-overlay",
    });
  }

  if (results.length === 0) {
    throw new Error(`No DCO versions captured for ${adArchiveId}. Confirm the target Ad Details overlay is active.`);
  }

  console.log(JSON.stringify({ adArchiveId, versions: results }, null, 2));

  if (closeTargetPage && page && !page.isClosed()) {
    await page.close();
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
