"use client";

import { useState } from "react";

interface Ad {
  _id: string;
  adArchiveId: string;
  adLibraryUrl: string;
  headline?: string;
  bodyText: string;
  ctaText?: string;
  displayFormat: string;
  videoHdUrl?: string;
  videoSdUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  landingPageUrl?: string;
  platforms: string[];
  startDate: string;
  isActive: boolean;
  isWinner: boolean;
  daysRunning: number;
}

interface AdCardProps {
  ad: Ad;
  competitorName: string;
  competitorLogo?: string;
}

function getPlatformIcon(platform: string) {
  switch (platform.toUpperCase()) {
    case "FACEBOOK":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "INSTAGRAM":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case "MESSENGER":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
        </svg>
      );
    default:
      return null;
  }
}

export default function AdCard({ ad, competitorName, competitorLogo }: AdCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const videoUrl = ad.videoHdUrl || ad.videoSdUrl;
  const hasVideo = !!videoUrl;
  const hasImage = !!ad.imageUrl || !!ad.thumbnailUrl;
  const mediaUrl = ad.thumbnailUrl || ad.imageUrl;

  const shouldTruncate = ad.bodyText.length > 120;

  // Days running color
  const getDaysColor = () => {
    if (ad.daysRunning >= 60) return "bg-[var(--color-winner)] text-[var(--color-bg)]";
    if (ad.daysRunning >= 30) return "bg-[rgba(0,255,136,0.2)] text-[var(--color-winner)]";
    if (ad.daysRunning >= 14) return "bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]";
    return "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]";
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          {competitorLogo ? (
            <img
              src={competitorLogo}
              alt={competitorName}
              className="w-9 h-9 rounded object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-accent)] font-display font-bold text-sm">
              {competitorName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-medium text-white text-sm">{competitorName}</div>
            <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              Sponsored
              {ad.isWinner && (
                <span className="badge badge-winner text-[10px] py-0">
                  WINNER
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 font-medium ${getDaysColor()}`}>
          {ad.daysRunning}d
        </span>
      </div>

      {/* Body Text */}
      <div className="px-3 py-2.5">
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed whitespace-pre-wrap">
          {showFullText ? ad.bodyText : (shouldTruncate ? `${ad.bodyText.slice(0, 120)}...` : ad.bodyText)}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="text-[var(--color-accent)] text-sm mt-1 hover:underline"
          >
            {showFullText ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Media */}
      <div className="relative bg-black aspect-[4/5] flex items-center justify-center">
        {hasVideo ? (
          isPlaying ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div
              className="relative w-full h-full cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt="Ad thumbnail"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
                  <span className="text-[var(--color-text-muted)]">Video</span>
                </div>
              )}
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition">
                <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[var(--color-bg)] ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          )
        ) : hasImage ? (
          <img
            src={mediaUrl}
            alt="Ad image"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
            <span className="text-[var(--color-text-muted)]">{ad.displayFormat}</span>
          </div>
        )}

        {/* Format badge */}
        <div className="absolute top-2 right-2">
          <span className={`badge ${
            ad.displayFormat === "VIDEO" ? "badge-video" :
            ad.displayFormat === "IMAGE" ? "badge-image" :
            ad.displayFormat === "DCO" ? "bg-[rgba(147,51,234,0.8)] text-white" :
            ad.displayFormat === "DPA" ? "badge-secondary" :
            "bg-[var(--color-surface-elevated)]"
          }`}>
            {ad.displayFormat}
          </span>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-3 border-t border-[var(--color-border)]">
        {ad.headline && (
          <div className="font-medium text-white text-sm mb-1">{ad.headline}</div>
        )}
        {ad.landingPageUrl && (
          <div className="text-[var(--color-text-muted)] text-xs mb-2 truncate">
            {(() => {
              try {
                return new URL(ad.landingPageUrl).hostname;
              } catch {
                return ad.landingPageUrl;
              }
            })()}
          </div>
        )}
        <div className="flex gap-2">
          {ad.ctaText && (
            <a
              href={ad.landingPageUrl || ad.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-ghost text-xs py-2 text-center"
            >
              {ad.ctaText}
            </a>
          )}
          <a
            href={ad.adLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-2"
          >
            View in Library
          </a>
        </div>
      </div>

      {/* Platforms */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <span className="text-[var(--color-text-muted)] text-xs">Platforms:</span>
        <div className="flex gap-1.5 text-[var(--color-text-secondary)]">
          {ad.platforms.slice(0, 4).map((platform) => (
            <span key={platform} title={platform}>
              {getPlatformIcon(platform)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
