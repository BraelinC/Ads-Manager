"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import AdCard from "./AdCard";

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

type FilterType = "all" | "winners" | "video" | "image";

export default function CompetitorModal({
  competitor,
  onClose,
}: CompetitorModalProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"days" | "position">("days");

  // Fetch ads for this competitor
  const ads = useQuery(api.ads.list, {
    competitorId: competitor._id as Id<"competitors">,
  });

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

  // Filter and sort ads
  const filteredAds = ads
    ? ads
        .filter((ad) => {
          if (filter === "winners") return ad.isWinner;
          if (filter === "video") return ad.displayFormat === "VIDEO";
          if (filter === "image") return ad.displayFormat === "IMAGE";
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "days") return b.daysRunning - a.daysRunning;
          return (a.position || 999) - (b.position || 999);
        })
    : [];

  const stats = ads
    ? {
        total: ads.length,
        winners: ads.filter((a) => a.isWinner).length,
        videos: ads.filter((a) => a.displayFormat === "VIDEO").length,
        images: ads.filter((a) => a.displayFormat === "IMAGE").length,
        avgDays: Math.round(
          ads.reduce((sum, a) => sum + a.daysRunning, 0) / ads.length || 0
        ),
      }
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-start justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-7xl my-4 mx-4 border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)] z-10">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {competitor.logoUrl ? (
                  <img
                    src={competitor.logoUrl}
                    alt={competitor.name}
                    className="w-16 h-16 rounded object-cover border border-[var(--color-border)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] font-display font-bold text-2xl">
                    {competitor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="headline text-3xl text-white">{competitor.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mt-1">
                    <span className="badge badge-accent">{competitor.category}</span>
                    <span>{competitor.nicheIndustry}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--color-text-secondary)] hover:text-white text-2xl p-2 hover:bg-[var(--color-surface)] transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Stats Row */}
            {stats && stats.total > 0 && (
              <div className="flex gap-8 mt-6">
                <div>
                  <div className="stat-number text-3xl text-white">{stats.total}</div>
                  <div className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Total</div>
                </div>
                <div>
                  <div className="stat-number text-3xl text-[var(--color-winner)]">{stats.winners}</div>
                  <div className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Winners</div>
                </div>
                <div>
                  <div className="stat-number text-3xl text-[var(--color-video)]">{stats.videos}</div>
                  <div className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Videos</div>
                </div>
                <div>
                  <div className="stat-number text-3xl text-[var(--color-image)]">{stats.images}</div>
                  <div className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Images</div>
                </div>
                <div>
                  <div className="stat-number text-3xl text-[var(--color-accent)]">{stats.avgDays}d</div>
                  <div className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Avg Run</div>
                </div>
              </div>
            )}

            {/* Filters & Sort */}
            {ads && ads.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
                <div className="flex gap-1">
                  {[
                    { value: "all" as const, label: "All" },
                    { value: "winners" as const, label: "Winners" },
                    { value: "video" as const, label: "Video" },
                    { value: "image" as const, label: "Image" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-all ${
                        filter === f.value
                          ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                          : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--color-text-muted)]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "days" | "position")}
                    className="bg-[var(--color-surface)] text-white border border-[var(--color-border)] px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="days">Days Running</option>
                    <option value="position">Position</option>
                  </select>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2 mt-4">
              {competitor.website && (
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-1.5"
                >
                  Website
                </a>
              )}
              {competitor.facebookPageUrl && (
                <a
                  href={competitor.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-1.5"
                >
                  Facebook
                </a>
              )}
              {competitor.instagramUrl && (
                <a
                  href={competitor.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-1.5"
                >
                  Instagram
                </a>
              )}
              {competitor.adLibraryUrl && (
                <a
                  href={competitor.adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-1.5"
                >
                  Ad Library
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!ads ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-[var(--color-text-muted)] text-lg mb-4">
                No ads found for this competitor.
              </div>
              {competitor.adLibraryUrl && (
                <a
                  href={competitor.adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-block"
                >
                  Check Ad Library
                </a>
              )}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
              No ads match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAds.map((ad) => (
                <AdCard
                  key={ad._id}
                  ad={ad}
                  competitorName={competitor.name}
                  competitorLogo={competitor.logoUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
