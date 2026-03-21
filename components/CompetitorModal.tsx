"use client";

import { useEffect } from "react";

interface Competitor {
  _id: string;
  name: string;
  category: "Micro-Niche" | "Macro-Niche" | "Ad Leader";
  nicheIndustry: string;
  description: string;
  status: "Active" | "Inactive";
  logoUrl?: string;
  website?: string;
  facebookPageUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  winnerAds?: string;
  swipeInsights?: string;
  adNotes?: string;
  adLibraryUrl?: string;
}

interface CompetitorModalProps {
  competitor: Competitor;
  onClose: () => void;
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

export default function CompetitorModal({
  competitor,
  onClose,
}: CompetitorModalProps) {
  const winnerAds = competitor.winnerAds
    ? competitor.winnerAds.split(",").map((id) => id.trim())
    : [];
  const hooks = extractHooks(competitor.swipeInsights);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {competitor.logoUrl && (
                <img
                  src={competitor.logoUrl}
                  alt={competitor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{competitor.name}</h2>
                <span className="text-sm text-gray-400">
                  {competitor.category} | {competitor.nicheIndustry}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-6">{competitor.description}</p>

          {/* Links */}
          <div className="flex flex-wrap gap-2 mb-6">
            {competitor.website && (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition"
              >
                Website
              </a>
            )}
            {competitor.facebookPageUrl && (
              <a
                href={competitor.facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Facebook
              </a>
            )}
            {competitor.instagramUrl && (
              <a
                href={competitor.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-pink-600 rounded-lg text-sm hover:bg-pink-700 transition"
              >
                Instagram
              </a>
            )}
            {competitor.youtubeUrl && (
              <a
                href={competitor.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-red-600 rounded-lg text-sm hover:bg-red-700 transition"
              >
                YouTube
              </a>
            )}
            {competitor.tiktokUrl && (
              <a
                href={competitor.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-gray-900 border border-gray-600 rounded-lg text-sm hover:bg-gray-800 transition"
              >
                TikTok
              </a>
            )}
            {competitor.linkedinUrl && (
              <a
                href={competitor.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-700 rounded-lg text-sm hover:bg-blue-800 transition"
              >
                LinkedIn
              </a>
            )}
          </div>

          {/* Winner Ads */}
          {winnerAds.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">
                Winner Ads (30+ Days)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {winnerAds.map((adId) => (
                  <a
                    key={adId}
                    href={`https://www.facebook.com/ads/library/?id=${adId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition"
                  >
                    <div className="font-mono text-green-300">{adId}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Click to view
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hooks */}
          {hooks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">
                Winning Hooks
              </h3>
              <div className="space-y-2">
                {hooks.map((hook, i) => (
                  <div
                    key={i}
                    className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                  >
                    <span className="text-purple-300">&ldquo;{hook}&rdquo;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Insights */}
          {competitor.swipeInsights && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Swipe Insights</h3>
              <div className="p-4 bg-gray-700 rounded-lg text-gray-300">
                {competitor.swipeInsights}
              </div>
            </div>
          )}

          {/* Notes */}
          {competitor.adNotes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="p-4 bg-gray-700 rounded-lg text-gray-300">
                {competitor.adNotes}
              </div>
            </div>
          )}

          {/* Ad Library Button */}
          {competitor.adLibraryUrl && (
            <a
              href={competitor.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition"
            >
              Open Facebook Ad Library
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
