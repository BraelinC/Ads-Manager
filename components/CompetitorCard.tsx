"use client";

interface Competitor {
  _id: string;
  name: string;
  category: "Micro-Niche" | "Macro-Niche" | "Ad Leader";
  description: string;
  status: "Active" | "Inactive";
  logoUrl?: string;
  winnerAds?: string;
  swipeInsights?: string;
  adLibraryUrl?: string;
}

interface CompetitorCardProps {
  competitor: Competitor;
  onSelect: () => void;
}

function getCategoryStyle(category: string) {
  switch (category) {
    case "Ad Leader":
      return "bg-[var(--color-secondary-dim)] text-[var(--color-secondary)] border-[var(--color-secondary)]";
    case "Micro-Niche":
      return "bg-[rgba(51,153,255,0.15)] text-[#3399ff] border-[#3399ff]";
    case "Macro-Niche":
      return "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)]";
    default:
      return "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]";
  }
}

function extractHooks(insights?: string): string[] {
  if (!insights) return [];
  const match = insights.match(/Hooks?:\s*([^.]+)/i);
  if (match) {
    return match[1]
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h);
  }
  return [];
}

function getFormatBadges(insights?: string) {
  if (!insights) return [];
  const formats: { name: string; className: string }[] = [];
  if (insights.includes("VIDEO"))
    formats.push({ name: "VIDEO", className: "badge-video" });
  if (insights.includes("IMAGE"))
    formats.push({ name: "IMAGE", className: "badge-image" });
  if (insights.includes("DCO"))
    formats.push({ name: "DCO", className: "bg-[rgba(147,51,234,0.15)] text-[#a855f7]" });
  if (insights.includes("DPA"))
    formats.push({ name: "DPA", className: "badge-secondary" });
  return formats;
}

export default function CompetitorCard({
  competitor,
  onSelect,
}: CompetitorCardProps) {
  const winnerCount = competitor.winnerAds
    ? competitor.winnerAds.split(",").length
    : 0;
  const hooks = extractHooks(competitor.swipeInsights);
  const formats = getFormatBadges(competitor.swipeInsights);

  return (
    <div
      onClick={onSelect}
      className="card card-interactive cursor-pointer group"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {competitor.logoUrl ? (
              <img
                src={competitor.logoUrl}
                alt={competitor.name}
                className="w-12 h-12 rounded object-cover border border-[var(--color-border)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] font-display font-bold text-xl">
                {competitor.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--color-accent)] transition-colors">
                {competitor.name}
              </h3>
              <span
                className={`badge border ${getCategoryStyle(competitor.category)}`}
              >
                {competitor.category}
              </span>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              competitor.status === "Active"
                ? "bg-[var(--color-winner)] animate-pulse-winner"
                : "bg-[var(--color-text-muted)]"
            }`}
          />
        </div>

        {/* Description */}
        <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
          {competitor.description}
        </p>

        {/* Winner Ads */}
        {winnerCount > 0 ? (
          <div className="mb-4 p-3 bg-[rgba(0,255,136,0.08)] border border-[rgba(0,255,136,0.2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-winner)] font-display font-bold text-2xl">
                  {winnerCount}
                </span>
                <span className="text-[var(--color-winner)] text-sm font-medium">
                  Winner{winnerCount > 1 ? "s" : ""}
                </span>
              </div>
              <span className="badge badge-winner">30+ days</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)] text-sm">
              No winners yet
            </span>
          </div>
        )}

        {/* Hooks */}
        {hooks.length > 0 && (
          <div className="mb-4">
            <div className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-2">
              Top Hooks
            </div>
            <div className="space-y-1.5">
              {hooks.slice(0, 2).map((hook, i) => (
                <div
                  key={i}
                  className="text-sm text-white bg-[var(--color-surface-elevated)] px-3 py-2 border-l-2 border-[var(--color-accent)]"
                >
                  &ldquo;{hook}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formats */}
        {formats.length > 0 && (
          <div className="flex gap-2 mb-4">
            {formats.map((f, i) => (
              <span key={i} className={`badge ${f.className}`}>
                {f.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
          <button className="flex-1 btn-primary text-sm">
            View Ads
          </button>
          {competitor.adLibraryUrl && (
            <a
              href={competitor.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-ghost text-sm"
            >
              Library
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
