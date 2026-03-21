# DCO Extraction Skill

Purpose: extract real version-level creative data from Facebook Ad Library DCO ads and save it into Convex.

Use this when:
- an ad says it has multiple versions
- the copy stays mostly the same but the video or image changes
- you want version-level records, not just one parent DCO ad row

Core idea:
- the parent `ads` table stores the DCO ad shell
- the `dcoVersions` table stores each variant shown in the Ad Details overlay

What gets captured per version:
- `versionIndex`
- `versionLabel`
- `bodyText`
- `ctaText`
- `caption`
- `landingPageUrl`
- `videoUrl`
- `posterUrl`
- `thumbnailUrl`
- `creativeFingerprint`
- `extractedAt`
- `source`

Requirements:
- a live Chrome or Chromium session with remote debugging enabled on port `9222`
- the browser already open to the Facebook `Ad Details` overlay for the target DCO ad
- the target overlay showing the correct `Library ID`

Workflow:
1. The workflow opens a fresh browser tab for the target `Library ID`.
2. It tries to activate the matching `Ad Details` overlay for that exact ad.
3. It switches through each version in that isolated tab.
4. It captures the active creative and upserts to Convex.
5. Run `scripts/extract-dco-to-convex.sh <ad_archive_id> [total_versions]`.

Batch by ad account:
- Run `scripts/extract-dco-account-to-convex.sh <competitor_id> [max_ads]`
- This pulls all `DCO` ads for one competitor from Convex and runs the per-ad extractor one by one.
- Use `max_ads` when testing so you do not launch a huge account batch blindly.

Full refresh:
- Run `ads:removeAllDcoVersions` first if you want to replace old extracted version data.
- Then run `scripts/extract-all-dco-to-convex.sh [max_ads_per_account]`.
- This processes every account that currently has DCO ads.
- After a full refresh, run `ads:dedupeDcoVersions` if needed, though the normal flow should already stay clean.

Known hiccups and handling:
- Facebook often leaves both `Link to ad` and `Ad Details` overlays mounted at the same time. Always target the overlay whose visible text includes both `Ad Details` and the exact `Library ID`.
- The extractor now auto-closes one stale `Ad Details` overlay if it belongs to a different `Library ID`, but still verify the target ad before trusting the output.
- The background feed is still present under the overlay. If clicks hit the page behind it, reset and reopen the `Ad Details` overlay before extracting.
- Version switching can succeed while copy stays unchanged. Treat copy as shared shell content and use `videoUrl`, `posterUrl`, `thumbnailUrl`, and `creativeFingerprint` as the primary variant signals.
- Some DCO ads expose many versions, but Facebook may surface only partial differences in the visible player. If all captured fields repeat, the extractor still stores them, but mark that ad as needing tighter thumbnail targeting or media-request inspection later.
- Wait briefly after each version switch. The visible label can update before the active poster or media asset settles.
- Prefer direct `See ad details` ads over `See summary details` ads when possible. Summary flows are less reliable for per-version asset capture.
- Treat a zero-version capture as a hard failure, not a successful run. It usually means the wrong ad overlay was active or the target details view never opened.
- Some ad URLs reopen the full feed and expose many matching cards. In those cases, automatic card lookup can still miss the intended overlay even when the target `Library ID` is visible on the page. If that happens, manually reopen the target `Link to ad` overlay and rerun from there.

Operational rules:
- trust the `Ad Details` overlay, not the background feed
- extract one version at a time
- assume body copy can stay constant while video or poster changes
- use version-level storage for DCO, never overwrite the parent ad with only one asset
- use `creativeFingerprint` to compare whether versions are actually distinct

Files involved:
- `scripts/open-dco-ad-details.js`
- `scripts/capture-live-dco-versions.js`
- `scripts/extract-dco-to-convex.sh`
- `scripts/extract-dco-account-to-convex.sh`
- `convex/schema.ts`
- `convex/ads.ts`

Verification:
- query `ads:listDcoVersions` by `adArchiveId`
- confirm all expected version rows exist
- compare `posterUrl`, `thumbnailUrl`, and `videoUrl` across versions
- if `versionLabel` changes but asset fields do not, note that extraction reached the right state but the variant asset was not uniquely exposed in the first pass

If version switching looks wrong:
- confirm the overlay still shows `Ad Details`
- confirm the `Library ID` matches the target ad
- rerun with an explicit version count as the second shell argument
