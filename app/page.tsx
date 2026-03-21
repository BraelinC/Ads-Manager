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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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

  const filters: { label: string; value: Category }[] = [
    { label: "All", value: "all" },
    { label: "Ad Leaders", value: "Ad Leader" },
    { label: "Micro-Niche", value: "Micro-Niche" },
    { label: "Macro-Niche", value: "Macro-Niche" },
    { label: "Has Winners", value: "hasWinners" },
  ];

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <StatsHeader competitors={competitors} />

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full transition-all ${
                filter === f.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Competitor Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor._id}
              competitor={competitor}
              onSelect={() => setSelectedId(competitor._id)}
            />
          ))}
        </div>

        {filteredCompetitors.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No competitors match this filter.
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
