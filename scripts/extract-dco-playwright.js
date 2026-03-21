const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const adUrl = process.argv[2] || "https://www.facebook.com/ads/library/?id=1945688923043227";
const outDir = path.join(process.cwd(), "tmp", "dco-extract");

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function snippet(text, max = 400) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2200 },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();
  const networkHits = [];
  const mediaHits = [];
  const responseBodies = [];

  page.on("response", async (response) => {
    const url = response.url();
    const type = response.request().resourceType();
    const contentType = response.headers()["content-type"] || "";

    if (type === "media") {
      mediaHits.push({ url, status: response.status(), contentType });
      return;
    }

    if (!["xhr", "fetch", "document"].includes(type)) return;

    let body = "";
    let parsed = null;
    try {
      body = await response.text();
      parsed = contentType.includes("json") ? safeJsonParse(body) : null;
    } catch {
      body = "";
    }

    const haystack = body || JSON.stringify(parsed || {});
    if (/1945688923043227|product|video|headline|body|link|snapshot|playable|creative|story/i.test(haystack) || /graphql|ads\/library|video/i.test(url)) {
      networkHits.push({
        url,
        status: response.status(),
        type,
        contentType,
        bodySnippet: snippet(body),
      });

      if (parsed) {
        responseBodies.push({ url, status: response.status(), type, contentType, json: parsed });
      }
    }
  });

  await page.goto(adUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(5000);

  const html = await page.content();
  fs.writeFileSync(path.join(outDir, "page.html"), html);
  await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });

  const domData = await page.evaluate(() => {
    const text = document.body.innerText;

    const videos = [...document.querySelectorAll("video")].map((video) => ({
      src: video.currentSrc || video.src || null,
      poster: video.poster || null,
      controls: video.controls,
    }));

    const images = [...document.querySelectorAll("img")].map((img) => ({
      src: img.currentSrc || img.src || null,
      alt: img.alt || null,
    }));

    const links = [...document.querySelectorAll("a")].map((a) => ({
      text: a.innerText.trim(),
      href: a.href,
    }));

    const buttons = [...document.querySelectorAll("button, [role='button']")].map((el) => ({
      text: (el.innerText || el.textContent || "").trim(),
    }));

    return {
      title: document.title,
      text,
      videos,
      images,
      links,
      buttons,
    };
  });

  const summary = {
    url: adUrl,
    title: domData.title,
    textSnippet: snippet(domData.text, 5000),
    videoUrls: uniq(domData.videos.flatMap((video) => [video.src, video.poster])),
    imageUrls: uniq(domData.images.map((img) => img.src)).slice(0, 50),
    visibleLinks: domData.links.filter((link) => link.text || link.href).slice(0, 50),
    visibleButtons: uniq(domData.buttons.map((button) => button.text)).slice(0, 50),
    mediaHits: mediaHits.slice(0, 50),
    networkHits: networkHits.slice(0, 80),
  };

  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(outDir, "network-bodies.json"), JSON.stringify(responseBodies, null, 2));

  console.log(JSON.stringify({
    title: summary.title,
    textSnippet: summary.textSnippet,
    videoUrlCount: summary.videoUrls.length,
    imageUrlCount: summary.imageUrls.length,
    visibleLinkCount: summary.visibleLinks.length,
    visibleButtonCount: summary.visibleButtons.length,
    mediaHitCount: mediaHits.length,
    networkHitCount: networkHits.length,
    outDir,
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
