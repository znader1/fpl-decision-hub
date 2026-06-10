import { useEffect, useState } from "react";
import { Loader2, CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import {
  fetchFixtureDifficulty,
  fetchNextEvent,
  type FixtureDifficultyResponse,
  type FixtureTickerCell,
} from "@/lib/fplAssistantApi";

const HORIZON_OPTIONS = [4, 6, 8, 10];

const BAND_LEGEND: Array<{ label: string; color: string }> = [
  { label: "Very easy", color: "#1a9850" },
  { label: "Easy", color: "#66bd63" },
  { label: "Medium", color: "#fee08b" },
  { label: "Hard", color: "#f46d43" },
  { label: "Very hard", color: "#d73027" },
];

// Yellow (medium) needs dark text; the rest read fine in white.
const cellTextColor = (color: string) => (color.toLowerCase() === "#fee08b" ? "#1f1f1f" : "#ffffff");

const TickerCell = ({ cell }: { cell: FixtureTickerCell }) => {
  if (cell.blank || cell.opponents.length === 0) {
    return (
      <td className="px-1 py-1 text-center">
        <div className="rounded-md bg-white/5 text-white/30 text-[11px] py-1.5">—</div>
      </td>
    );
  }
  return (
    <td className="px-1 py-1 text-center">
      <div className="flex flex-col gap-0.5">
        {cell.opponents.map((opp, i) => (
          <div
            key={`${opp.opp_id}-${i}`}
            className="rounded-md text-[11px] font-semibold py-1.5 leading-none"
            style={{ backgroundColor: opp.color, color: cellTextColor(opp.color) }}
            title={`Difficulty ${opp.difficulty} (${opp.band.replace("_", " ")})`}
          >
            {opp.opp_short} ({opp.home ? "H" : "A"})
          </div>
        ))}
      </div>
    </td>
  );
};

const Fixtures = () => {
  const [horizon, setHorizon] = useState(6);
  const [data, setData] = useState<FixtureDifficultyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNextEvent()
      .then((ev) => fetchFixtureDifficulty({ gw_start: ev?.event_id ?? undefined, horizon_gws: horizon }))
      .catch(() => fetchFixtureDifficulty({ horizon_gws: horizon }))
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [horizon]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            Fixture ticker
          </h1>
          <Badge variant="outline" className="text-[10px]">xG model</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Difficulty from our xG-based team ratings — not FPL's FDR. Sorted easiest run first.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Horizon:</span>
          {HORIZON_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                horizon === h
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {h} GWs
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {BAND_LEGEND.map((b) => (
              <span key={b.label} className="flex items-center gap-1 text-[10px] text-white/60">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {loading && (
          <Card className="p-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading fixture difficulty…
          </Card>
        )}

        {error && !loading && (
          <Card className="p-6 text-sm text-red-400">{error}</Card>
        )}

        {data && !loading && !error && (
          <>
            <Card className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium sticky left-0 bg-card">Team</th>
                    {data.gws.map((gw) => (
                      <th key={gw} className="px-1 py-2 text-center font-medium">GW{gw}</th>
                    ))}
                    <th className="px-3 py-2 text-right font-medium">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teams.map((team) => (
                    <tr key={team.team_id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-1 font-bold sticky left-0 bg-card">{team.team_short}</td>
                      {data.gws.map((gw) => (
                        <TickerCell key={gw} cell={team.gws[String(gw)] ?? { opponents: [], difficulty: null, count: 0, blank: true }} />
                      ))}
                      <td className="px-3 py-1 text-right tabular-nums text-white/70">
                        {team.avg_difficulty.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Easiest runs</p>
                <p className="font-semibold">{data.easiest_runs.join(" · ")}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Hardest runs</p>
                <p className="font-semibold">{data.hardest_runs.join(" · ")}</p>
              </Card>
            </div>

            {data.meta && (
              <p className="mt-4 text-[11px] text-white/40">
                Model {data.meta.model}
                {data.meta.knowledge_as_of ? ` · knowledge file as of ${data.meta.knowledge_as_of}` : ""}
                {data.meta.rating_sources
                  ? ` · ratings: ${Object.entries(data.meta.rating_sources)
                      .map(([k, v]) => `${v} ${k}`)
                      .join(", ")}`
                  : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
