"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

export default function BriefPage() {
  const briefs = useQuery(api.briefs.list, {});
  const latestBrief = useQuery(api.briefs.getLatest, {});
  const generateBrief = useMutation(api.briefs.generate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateBrief({ brandName: "Your Brand" });
    } catch (error) {
      console.error("Failed to generate brief:", error);
    }
    setIsGenerating(false);
  };

  if (!briefs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Loading</span>
        </div>
      </div>
    );
  }

  const winnerInsights = latestBrief?.winnerInsights ?? [];
  const winnerComparisons = latestBrief?.winnerComparisons ?? [];
  const accountPlaybooks = latestBrief?.accountPlaybooks ?? [];
  const topWinningAds = latestBrief?.topWinningAds ?? [];
  const dcoTopAds = latestBrief?.dcoTopAds ?? [];
  const combinedTopAds = latestBrief?.combinedTopAds ?? [];
  const accountComparisons = latestBrief?.accountComparisons ?? [];
  const dcoSummary = latestBrief?.dcoSummary;

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-[var(--color-text-secondary)] hover:text-white text-sm mb-2 inline-block">
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-3xl font-display font-bold text-white">Ad Intelligence Brief</h1>
              <p className="text-[var(--color-text-secondary)] mt-1">
                Data-driven competitive analysis and strategic recommendations
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate New Brief"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {!latestBrief ? (
          <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-display font-semibold text-white mb-2">No Brief Generated Yet</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Generate your first ad intelligence brief to see competitive insights.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Brief"}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Brief Header */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-semibold text-white">{latestBrief.title}</h2>
                <span className="text-[var(--color-text-secondary)] text-sm">
                  Generated: {latestBrief.generatedAt}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatBox label="Total Ads" value={latestBrief.totalAds} />
                <StatBox label="Competitors" value={latestBrief.totalCompetitors} />
                <StatBox label="Winners (30d+)" value={latestBrief.winnerAds} accent />
                <StatBox label="Normal Winners" value={latestBrief.normalWinnerAds ?? latestBrief.winnerAds} />
                <StatBox label="DCO Ads" value={latestBrief.dcoAds ?? 0} />
              </div>
            </div>

            {/* Executive Summary */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <h3 className="text-xl font-display font-semibold text-white mb-4">Executive Summary</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestBrief.executiveSummary.map((item, i) => (
                  <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                    <div className="text-[var(--color-accent)] text-sm font-semibold mb-1">{item.title}</div>
                    <div className="text-white font-medium mb-2">{item.finding}</div>
                    <div className="text-[var(--color-text-secondary)] text-sm">{item.dataPoint}</div>
                  </div>
                ))}
              </div>
            </section>

            {winnerInsights.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Winner-Focused Insights</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {winnerInsights.map((item, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="text-[var(--color-accent)] text-sm font-semibold mb-1">{item.title}</div>
                      <div className="text-white font-medium mb-2">{item.finding}</div>
                      <div className="text-[var(--color-text-secondary)] text-sm">{item.dataPoint}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {winnerComparisons.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Regular vs DCO Winners</h3>
                <div className="grid lg:grid-cols-3 gap-4">
                  {winnerComparisons.map((item, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="text-[var(--color-accent)] text-sm font-semibold mb-3">{item.title}</div>
                      <div className="space-y-2 text-sm">
                        <div className="text-white">Regular: <span className="text-[var(--color-text-secondary)]">{item.regularFinding}</span></div>
                        <div className="text-white">DCO: <span className="text-[var(--color-text-secondary)]">{item.dcoFinding}</span></div>
                        <div className="pt-2 border-t border-[var(--color-border)] text-[var(--color-text-muted)]">{item.takeaway}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Format Analysis */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <h3 className="text-xl font-display font-semibold text-white mb-4">Format Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[var(--color-text-secondary)] text-sm border-b border-[var(--color-border)]">
                      <th className="pb-3 pr-4">Format</th>
                      <th className="pb-3 pr-4">Total Ads</th>
                      <th className="pb-3 pr-4">Winners</th>
                      <th className="pb-3 pr-4">Win Rate</th>
                      <th className="pb-3">Median Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestBrief.formatBreakdown.map((f, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]">
                        <td className="py-3 pr-4 text-white font-medium">{f.format}</td>
                        <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{f.count}</td>
                        <td className="py-3 pr-4 text-[var(--color-accent)]">{f.winners}</td>
                        <td className="py-3 pr-4 text-[var(--color-text-secondary)]">
                          {f.count > 0 ? Math.round((f.winners / f.count) * 100) : 0}%
                        </td>
                        <td className="py-3 text-[var(--color-text-secondary)]">{Math.round(f.medianDays)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Competitor Breakdown */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <h3 className="text-xl font-display font-semibold text-white mb-4">Competitor Breakdown</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestBrief.competitorBreakdowns.map((comp, i) => (
                  <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{comp.name}</span>
                      <span className="text-[var(--color-text-secondary)] text-xs px-2 py-1 bg-[var(--color-surface)]">
                        {comp.category}
                      </span>
                    </div>
                    <div className="text-[var(--color-text-secondary)] text-sm mb-3">
                      {comp.totalAds} ads ({comp.videoAds}V / {comp.imageAds}I) | {comp.winnerAds} winners
                    </div>
                    {comp.longestRunningAd && (
                      <div className="text-xs">
                        <span className="text-[var(--color-accent)]">Longest: {comp.longestRunningAd.daysRunning}d</span>
                        <p className="text-[var(--color-text-muted)] mt-1 line-clamp-2">
                          "{comp.longestRunningAd.bodyText}"
                        </p>
                      </div>
                    )}
                    {comp.topHooks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                        <div className="text-[var(--color-text-secondary)] text-xs mb-1">Top Hooks:</div>
                        {comp.topHooks.slice(0, 2).map((hook, j) => (
                          <p key={j} className="text-[var(--color-text-muted)] text-xs italic">"{hook}"</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {topWinningAds.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                  <div>
                    <h3 className="text-xl font-display font-semibold text-white">Top Winning Ads Across Accounts</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                      Normal winners only - ranked for concrete hook and creative review.
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topWinningAds.map((ad, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-white font-semibold">{ad.competitorName}</div>
                          <div className="text-[var(--color-text-secondary)] text-xs">{ad.format}</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-[var(--color-surface)] text-[var(--color-accent)]">
                          {ad.daysRunning}d
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed mb-3">"{ad.hook}"</p>
                      {ad.headline && (
                        <p className="text-[var(--color-text-secondary)] text-sm mb-2">Headline: {ad.headline}</p>
                      )}
                      <div className="text-[var(--color-text-muted)] text-xs space-y-1 mb-3">
                        {ad.ctaText && <div>CTA: {ad.ctaText}</div>}
                        {ad.landingPageUrl && <div className="truncate">Landing: {ad.landingPageUrl}</div>}
                      </div>
                      <a
                        href={ad.adLibraryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs py-2 inline-block"
                      >
                        Open Ad Library
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dcoTopAds.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                  <div>
                    <h3 className="text-xl font-display font-semibold text-white">Top DCO Winners</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                      Best DCO ads ranked separately so template systems do not blur regular creative learnings.
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {dcoTopAds.map((ad, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-white font-semibold">{ad.competitorName}</div>
                          <div className="text-[var(--color-text-secondary)] text-xs">DCO Winner</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-[var(--color-surface)] text-[var(--color-accent)]">{ad.daysRunning}d</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed mb-3">"{ad.bodyText}"</p>
                      <div className="text-[var(--color-text-muted)] text-xs space-y-1 mb-3">
                        {ad.ctaText && <div>CTA: {ad.ctaText}</div>}
                        {ad.landingPageUrl && <div className="truncate">Landing: {ad.landingPageUrl}</div>}
                      </div>
                      <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 inline-block">
                        Open Ad Library
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {combinedTopAds.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Best Across Both</h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {combinedTopAds.map((ad, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-white font-semibold">{ad.competitorName}</div>
                          <div className="text-[var(--color-text-secondary)] text-xs">{ad.sourceType} • {ad.format}</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-[var(--color-surface)] text-[var(--color-accent)]">{ad.daysRunning}d</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed mb-3">"{ad.summary}"</p>
                      <div className="text-[var(--color-text-muted)] text-xs space-y-1 mb-3">
                        {ad.ctaText && <div>CTA: {ad.ctaText}</div>}
                        {ad.landingPageUrl && <div className="truncate">Landing: {ad.landingPageUrl}</div>}
                      </div>
                      <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 inline-block">
                        Open Ad Library
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {accountPlaybooks.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Top Ad Accounts</h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {accountPlaybooks.map((account, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-white font-semibold">{account.name}</span>
                        <span className="text-[var(--color-text-secondary)] text-xs px-2 py-1 bg-[var(--color-surface)]">
                          {account.category}
                        </span>
                      </div>
                      <div className="text-[var(--color-text-secondary)] text-sm mb-3">
                        {account.normalWinnerAds} normal winners / {account.totalWinnerAds} total winners
                      </div>
                      {account.topFormats.length > 0 && (
                        <div className="text-[var(--color-text-muted)] text-xs mb-3">
                          Formats: {account.topFormats.join(", ")}
                        </div>
                      )}
                      {account.topHooks.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[var(--color-text-secondary)] text-xs mb-1">Hooks</div>
                          {account.topHooks.slice(0, 2).map((hook, j) => (
                            <p key={j} className="text-[var(--color-text-muted)] text-xs italic">"{hook}"</p>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1">
                        {account.notes.map((note, j) => (
                          <p key={j} className="text-[var(--color-text-muted)] text-xs">{note}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {accountComparisons.length > 0 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Account Mix Comparison</h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {accountComparisons.map((account, i) => (
                    <div key={i} className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <span className="text-white font-semibold">{account.name}</span>
                        <span className="text-[var(--color-text-secondary)] text-xs px-2 py-1 bg-[var(--color-surface)]">{account.category}</span>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                        <div>Regular winners: <span className="text-white">{account.normalWinnerAds}</span></div>
                        <div>DCO winners: <span className="text-white">{account.dcoWinnerAds}</span></div>
                        <div>Total winners: <span className="text-white">{account.totalWinnerAds}</span></div>
                        <div>Best regular: <span className="text-white">{account.bestNormalDays}d</span></div>
                        <div>Best DCO: <span className="text-white">{account.bestDcoDays}d</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dcoSummary && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">DCO Watchlist</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <StatBox label="Tracked DCO Ads" value={dcoSummary.totalAds} />
                  <StatBox label="DCO Winners" value={dcoSummary.winnerAds} />
                  <StatBox label="Top DCO Accounts" value={dcoSummary.topCompetitors.length} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                    <div className="text-white font-medium mb-3">Top DCO Accounts</div>
                    <div className="space-y-2">
                      {dcoSummary.topCompetitors.map((item, i) => (
                        <div key={i} className="text-sm text-[var(--color-text-secondary)]">
                          {item.name}: {item.count} ads, {item.winners} winners
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                    <div className="text-white font-medium mb-3">Common DCO CTAs</div>
                    <div className="space-y-2">
                      {dcoSummary.commonCtas.map((item, i) => (
                        <div key={i} className="text-sm text-[var(--color-text-secondary)]">
                          {item.cta}: {item.count}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Strategic Playbook */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <h3 className="text-xl font-display font-semibold text-white mb-4">Strategic Playbook</h3>

              <div className="mb-6">
                <h4 className="text-[var(--color-accent)] font-semibold mb-3">What to Create First</h4>
                <div className="space-y-3">
                  {latestBrief.playbook.createFirst.map((item, i) => (
                    <div key={i} className="flex gap-4 bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
                      <div className="text-2xl font-display font-bold text-[var(--color-accent)]">{item.priority}</div>
                      <div>
                        <div className="text-white font-medium">{item.recommendation}</div>
                        <div className="text-[var(--color-text-secondary)] text-sm">{item.dataSupport}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-red-400 font-semibold mb-3">What to Avoid</h4>
                <ul className="space-y-2">
                  {latestBrief.playbook.avoid.map((item, i) => (
                    <li key={i} className="text-[var(--color-text-secondary)] flex items-center gap-2">
                      <span className="text-red-400">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Full Markdown Toggle */}
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <button
                onClick={() => setShowMarkdown(!showMarkdown)}
                className="text-[var(--color-accent)] hover:underline mb-4"
              >
                {showMarkdown ? "Hide Full Report" : "Show Full Markdown Report"}
              </button>

              {showMarkdown && (
                <div className="bg-[var(--color-bg)] p-6 border border-[var(--color-border)] overflow-x-auto">
                  <pre className="text-[var(--color-text-secondary)] text-sm whitespace-pre-wrap font-mono">
                    {latestBrief.fullMarkdown}
                  </pre>
                </div>
              )}
            </section>

            {/* Previous Briefs */}
            {briefs.length > 1 && (
              <section className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <h3 className="text-xl font-display font-semibold text-white mb-4">Previous Briefs</h3>
                <div className="space-y-2">
                  {briefs.slice(1).map((brief) => (
                    <div key={brief._id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)]">{brief.title}</span>
                      <span className="text-[var(--color-text-muted)] text-sm">{brief.generatedAt}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-[var(--color-bg)] p-4 border border-[var(--color-border)]">
      <div className="text-[var(--color-text-secondary)] text-sm mb-1">{label}</div>
      <div className={`text-2xl font-display font-bold ${accent ? "text-[var(--color-accent)]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
