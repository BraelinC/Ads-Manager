---
name: ad-brief
description: Generate an Ad Intelligence Brief from competitor ads stored in Convex. Produces executive summary, format analysis, per-competitor breakdowns, and strategic playbook. Data-driven insights backed by longevity metrics.
---

# Ad Intelligence Brief

Generate a comprehensive competitive intelligence report from Meta Ad Library data stored in Convex. Core thesis: **longevity = profitability** — ads running 30+ days are validated winners.

**What this skill produces:** A multi-section brief with executive summary, format analysis, per-competitor breakdowns, and priority-ordered strategic playbook — all backed by specific data points and exact hook quotes.

---

## Prerequisites

- **Convex backend** — deployed at `https://formal-weasel-180.convex.cloud`
- **Populated ads table** — run `/competitor-research` first to fill with competitor ads
- **Competitors table** — with category field (Micro-Niche, Macro-Niche, Ad Leader)

---

## Convex API Reference

**Base URL:** `https://formal-weasel-180.convex.cloud`

### Generate Brief
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "briefs:generate",
    "args": {
      "brandName": "Your Brand Name"
    },
    "format": "json"
  }'
```
**Returns:** `{"status":"success","value":"BRIEF_ID"}`

### Get Latest Brief
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{"path": "briefs:getLatest", "args": {}}'
```

### List All Briefs
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{"path": "briefs:list", "args": {}}'
```

---

## Category Mapping (Niche Tiers)

| Convex Category | Brief Tier |
|-----------------|------------|
| Micro-Niche | Direct (same product/audience) |
| Macro-Niche | Adjacent (overlapping markets) |
| Ad Leader | Aspirational (study their playbook) |

---

## Brief Sections

### 1. Executive Summary
6 key findings with data backing:
- Winning format (highest winner rate)
- Longevity distribution (Long-Runners/Performers/Tests)
- Copy length analysis
- Top competitor
- Video vs Image split
- Platform distribution

### 2. Format Analysis
Table: Format | Total Ads | Winners | Win Rate | Median Days

### 3-5. Niche Tier Breakdowns
Per tier (Direct/Adjacent/Aspirational):
- Competitor count and total ads
- Per-competitor: ads, winners, longest running ad, top hooks

### 6. Competitor Micro-Briefs
Summary table: Competitor | Category | Ads | Winners | V/I | Longest

### 7. Strategic Playbook
- **What to Create First:** Priority-ordered recommendations with data support
- **What to Avoid:** Patterns with zero winners

### 8. Methodology
Longevity tier definitions, core thesis, data source

---

## Longevity Tiers

| Tier | Days Active | Meaning |
|------|-------------|---------|
| Long-Runner | 90+ days | Proven scaler, high confidence |
| Performer | 30-90 days | Validated winner |
| Test | <30 days | Still proving, low confidence |

---

## How to Run

### Option 1: Via Claude
Just say: "Generate an ad brief" or run `/ad-brief`

Claude will:
1. Call `briefs:generate` mutation
2. Display key findings
3. Point you to the web UI for full report

### Option 2: Via CLI
```bash
curl -X POST "https://formal-weasel-180.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{"path": "briefs:generate", "args": {"brandName": "My Brand"}, "format": "json"}'
```

### Option 3: Via Web UI
Visit: `http://localhost:3000/brief` (or your deployed URL)
Click "Generate New Brief"

---

## Output Fields

The generated brief contains:

| Field | Type | Description |
|-------|------|-------------|
| title | string | "Ad Intelligence Brief - YYYY-MM-DD" |
| generatedAt | string | Date generated |
| totalAds | number | Total ads analyzed |
| totalCompetitors | number | Active competitors |
| winnerAds | number | Ads running 30+ days |
| videoAds | number | Video format ads |
| imageAds | number | Image format ads |
| executiveSummary | array | 6 key findings |
| formatBreakdown | array | Per-format analysis |
| competitorBreakdowns | array | Per-competitor details |
| playbook | object | Strategic recommendations |
| fullMarkdown | string | Complete report as markdown |

---

## Web UI Location

The brief display page is at `/brief` in your Next.js app.

Features:
- Quick stats dashboard
- Executive summary cards
- Format analysis table
- Competitor breakdown grid
- Strategic playbook
- Full markdown export
- Previous briefs archive

---

## Example Output

```
# Ad Intelligence Brief for Your Brand
**Generated:** 2026-03-21

## Data Summary
- **Total Ads Analyzed:** 307
- **Active Competitors:** 8
- **Winner Ads (30+ days):** 147 (48%)
- **Video Ads:** 131 | **Image Ads:** 17

## 1. Executive Summary

### 1. Winning Format
**VIDEO dominates with 89 winner ads**
> 131 total ads, 68% hit 30+ days

### 2. Longevity Distribution
**45 Long-Runners (90d+), 102 Performers (30-90d), 160 Tests (<30d)**
> 48% of all ads are validated winners
...
```

---

## Refresh Cadence

Recommended: Generate a new brief weekly or after each `/competitor-research` batch.

The brief analyzes current `daysRunning` values, so regenerating captures updated longevity data.
