"use client";

interface Competitor {
  _id: string;
  name: string;
  status: "Active" | "Inactive";
  winnerAds?: string;
  adNotes?: string;
}

interface StatsHeaderProps {
  competitors: Competitor[];
}

export default function StatsHeader({ competitors }: StatsHeaderProps) {
  const totalWinners = competitors.reduce((acc, c) => {
    if (c.winnerAds) {
      return acc + c.winnerAds.split(",").length;
    }
    return acc;
  }, 0);

  const activeCount = competitors.filter((c) => c.status === "Active").length;

  return (
    <header className="border-b border-[var(--color-border)]">
      {/* Top bar with title */}
      <div className="px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Title section */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="badge badge-accent">Live</span>
                <span className="text-[var(--color-text-secondary)] text-sm">
                  Food Saving App Niche
                </span>
              </div>
              <h1 className="headline text-4xl lg:text-5xl text-white">
                Ad <span className="text-accent">Intel</span>
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
                Track competitors. Steal winning strategies.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 lg:gap-12">
              <div className="text-right">
                <div className="stat-number text-4xl lg:text-5xl text-white">
                  {competitors.length}
                </div>
                <div className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">
                  Competitors
                </div>
              </div>

              <div className="text-right">
                <div className="stat-number text-4xl lg:text-5xl text-winner">
                  {totalWinners}
                </div>
                <div className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">
                  Winner Ads
                </div>
              </div>

              <div className="text-right">
                <div className="stat-number text-4xl lg:text-5xl text-accent">
                  {activeCount}
                </div>
                <div className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">
                  Active
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <div className="stat-number text-4xl lg:text-5xl text-secondary-accent">
                  1yr+
                </div>
                <div className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-1">
                  Longest Run
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
