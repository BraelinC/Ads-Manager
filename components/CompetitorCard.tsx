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

function getCategoryColor(category: string) {
  switch (category) {
    case "Ad Leader":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Micro-Niche":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Macro-Niche":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
  const formats: { name: string; color: string }[] = [];
  if (insights.includes("VIDEO"))
    formats.push({ name: "VIDEO", color: "bg-red-500/20 text-red-400" });
  if (insights.includes("IMAGE"))
    formats.push({ name: "IMAGE", color: "bg-blue-500/20 text-blue-400" });
  if (insights.includes("DCO"))
    formats.push({ name: "DCO", color: "bg-purple-500/20 text-purple-400" });
  if (insights.includes("DPA"))
    formats.push({ name: "DPA", color: "bg-orange-500/20 text-orange-400" });
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
    <div className="card-hover bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {competitor.logoUrl && (
              <img
                src={competitor.logoUrl}
                alt={competitor.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <h3 className="font-bold text-lg">{competitor.name}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(
                  competitor.category
                )}`}
              >
                {competitor.category}
              </span>
            </div>
          </div>
          <span
            className={`w-3 h-3 rounded-full ${
              competitor.status === "Active" ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {competitor.description}
        </p>

        {/* Winner Ads */}
        {winnerCount > 0 ? (
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-lg animate-pulse">★</span>
              <span className="text-green-400 font-semibold">
                {winnerCount} Winner Ad{winnerCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-xs text-gray-400">Running 30+ days</div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <span className="text-gray-500">No winner ads identified</span>
          </div>
        )}

        {/* Hooks */}
        {hooks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
              Top Hooks
            </div>
            <div className="space-y-1">
              {hooks.slice(0, 2).map((hook, i) => (
                <div
                  key={i}
                  className="text-sm text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg"
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
              <span
                key={i}
                className={`px-2 py-1 rounded text-xs ${f.color}`}
              >
                {f.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            View Details
          </button>
          {competitor.adLibraryUrl && (
            <a
              href={competitor.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
            >
              Ad Library
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
