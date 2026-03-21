"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import CompetitorCard from "@/components/CompetitorCard";
import CompetitorModal from "@/components/CompetitorModal";
import StatsHeader from "@/components/StatsHeader";

type Category = "all" | "Ad Leader" | "Micro-Niche" | "Macro-Niche" | "hasWinners";

export default function Home() {
  const competitors = useQuery(api.competitors.list, {});
  const [filter, setFilter] = useState<Category>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!competitors) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Loading</span>
        </div>
      </div>
    );
  }

  const filteredCompetitors = competitors.filter((c) => {
    if (filter === "all") return true;
    if (filter === "hasWinners") return c.winnerAds;
    return c.category === filter;
  });

  const selectedCompetitor = selectedId
    ? competitors.find((c) => c._id === selectedId)
    : null;

  const filters: { label: string; value: Category; count?: number }[] = [
    { label: "All", value: "all", count: competitors.length },
    { label: "Ad Leaders", value: "Ad Leader", count: competitors.filter(c => c.category === "Ad Leader").length },
    { label: "Micro-Niche", value: "Micro-Niche", count: competitors.filter(c => c.category === "Micro-Niche").length },
    { label: "Macro-Niche", value: "Macro-Niche", count: competitors.filter(c => c.category === "Macro-Niche").length },
    { label: "Has Winners", value: "hasWinners", count: competitors.filter(c => c.winnerAds).length },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <StatsHeader competitors={competitors} />

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
                {f.count !== undefined && (
                  <span className={`ml-2 ${filter === f.value ? "opacity-70" : "opacity-50"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor._id}
              competitor={competitor}
              onSelect={() => setSelectedId(competitor._id)}
            />
          ))}
        </div>

        {filteredCompetitors.length === 0 && (
          <div className="text-center py-16">
            <div className="text-[var(--color-text-muted)] text-lg">
              No competitors match this filter.
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCompetitor && (
        <CompetitorModal
          competitor={selectedCompetitor}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
