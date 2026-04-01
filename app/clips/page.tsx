"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

type SourceFilter = "all" | "recorded" | "uploaded" | "edited";

export default function ClipsPage() {
  const clips = useQuery(api.clips.list, {});
  const removeClip = useMutation(api.clips.remove);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!clips) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Loading clips</span>
        </div>
      </div>
    );
  }

  const filtered = clips.filter((c) => {
    if (filter === "all") return true;
    return c.source === filter;
  });

  const filters: { label: string; value: SourceFilter; count: number }[] = [
    { label: "All", value: "all", count: clips.length },
    { label: "Recorded", value: "recorded", count: clips.filter(c => c.source === "recorded").length },
    { label: "Edited", value: "edited", count: clips.filter(c => c.source === "edited").length },
    { label: "Uploaded", value: "uploaded", count: clips.filter(c => c.source === "uploaded").length },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">My Clips</h1>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                {clips.length} clip{clips.length !== 1 ? "s" : ""} uploaded from Clipper
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface)] transition-all"
            >
              Ad Intel
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex gap-1 py-4 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  filter === f.value
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface)]"
                }`}
              >
                {f.label}
                <span className={`ml-2 ${filter === f.value ? "opacity-70" : "opacity-50"}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((clip) => (
            <div
              key={clip._id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden group"
            >
              {/* Video */}
              <div className="relative aspect-video bg-black">
                {playingId === clip._id ? (
                  <video
                    src={clip.url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    onEnded={() => setPlayingId(null)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => setPlayingId(clip._id)}
                  >
                    {clip.thumbnailUrl ? (
                      <img src={clip.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="text-[var(--color-text-muted)] text-4xl">&#9654;</div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-white text-2xl ml-1">&#9654;</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white text-sm font-medium truncate">{clip.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                  <span className={`px-2 py-0.5 font-medium uppercase tracking-wider ${
                    clip.source === "edited" ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" :
                    clip.source === "recorded" ? "bg-blue-500/20 text-blue-400" :
                    "bg-purple-500/20 text-purple-400"
                  }`}>
                    {clip.source}
                  </span>
                  {clip.duration && <span>{clip.duration.toFixed(1)}s</span>}
                  <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-80 transition-opacity"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(clip.url)}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-white hover:border-white/30 transition-all"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Delete this clip?")) {
                        await removeClip({ id: clip._id });
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-[var(--color-text-muted)] text-lg">
              {clips.length === 0
                ? "No clips yet. Upload from the Clipper app to see them here."
                : "No clips match this filter."}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
