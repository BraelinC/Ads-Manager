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

  // Find longest running (Alex Hormozi has 1+ year)
  const longestRunning = competitors.find((c) =>
    c.adNotes?.includes("1+ YEAR") || c.adNotes?.includes("1 year")
  );

  return (
    <header className="gradient-bg py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Competitor Ad Intelligence</h1>
        <p className="text-purple-200">Food Saving App Niche - Meta Ads Analysis</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{competitors.length}</div>
            <div className="text-purple-200 text-sm">Competitors</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{totalWinners}</div>
            <div className="text-purple-200 text-sm">Winner Ads</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{activeCount}</div>
            <div className="text-purple-200 text-sm">Active</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400">1yr+</div>
            <div className="text-purple-200 text-sm">Longest Running</div>
          </div>
        </div>
      </div>
    </header>
  );
}
