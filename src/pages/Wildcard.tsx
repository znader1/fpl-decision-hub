// Wildcard v2: three structurally different squads (Aggressive / Balanced /
// Gems) on the entry's real selling-price budget, side by side, with the
// shared core and per-player breakdowns. "Use this squad" hands the chosen
// preset to the plan flow (chipStrategy=wildcard + stored preset).
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { WildcardPresetCard } from "@/components/WildcardPresetCard";
import { WildcardCoreStrip } from "@/components/WildcardCoreStrip";
import { useProfile } from "@/hooks/useProfile";
import { getInitialEntryId } from "@/lib/entryId";
import { fetchWildcardDrafts, type WildcardPreset } from "@/lib/fplAssistantApi";
import { storePreset } from "@/lib/wildcardDrafts";

const HORIZONS = [3, 4, 5, 6, 7, 8];

const BUDGET_SOURCE_LABEL: Record<string, string> = {
  my_team: "selling prices + live bank (linked account)",
  entry_value: "FPL team value as of the last finished GW (selling prices + bank)",
  market: "market prices + bank — selling prices unavailable, may overstate a risen squad",
};

export default function Wildcard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [entryId, setEntryId] = useState(getInitialEntryId);
  const [horizon, setHorizon] = useState(5);
  const [pinned, setPinned] = useState<Set<number>>(new Set());
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (entryId > 0) return;
    if (profile?.entryId && profile.entryId > 0) setEntryId(profile.entryId);
  }, [entryId, profile?.entryId]);

  const pinnedIds = useMemo(() => [...pinned].sort((a, b) => a - b), [pinned]);
  const excludedIds = useMemo(() => [...excluded].sort((a, b) => a - b), [excluded]);

  const query = useQuery({
    queryKey: ["wildcard-drafts", entryId, horizon, pinnedIds, excludedIds],
    queryFn: ({ signal }) => fetchWildcardDrafts({ entryId, horizonGws: horizon, pinnedIds, excludedIds }, signal),
    enabled: entryId > 0,
    staleTime: 5 * 60 * 1000,
  });

  const togglePin = (id: number) =>
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setExcluded((ex) => {
          if (!ex.has(id)) return ex;
          const e = new Set(ex);
          e.delete(id);
          return e;
        });
      }
      return next;
    });
  const toggleExclude = (id: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setPinned((pn) => {
          if (!pn.has(id)) return pn;
          const p = new Set(pn);
          p.delete(id);
          return p;
        });
      }
      return next;
    });

  const usePreset = (name: WildcardPreset) => {
    storePreset(name);
    try {
      localStorage.setItem("fpl_chip_strategy", "wildcard");
      if (query.data?.event_id) localStorage.setItem("fpl_chip_play_event_id", String(query.data.event_id));
    } catch {
      /* no storage */
    }
    navigate("/app/plan/squad");
  };

  const data = query.data;
  const allPlayers = data ? data.presets.flatMap((p) => p.squad) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Wildcard squads</h1>
            <p className="text-sm text-muted-foreground">
              Three ways to spend the same money{data ? ` from GW${data.event_id} over ${data.horizon_gws} gameweeks` : ""}. Pick the structure, not just the names.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            Horizon
            <select
              className="rounded-md border border-border bg-card px-2 py-1"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              {HORIZONS.map((h) => (
                <option key={h} value={h}>{h} GWs</option>
              ))}
            </select>
          </label>
        </div>

        {data && (
          <p className="mt-2 text-xs text-muted-foreground" data-testid="budget-line">
            Budget £{data.budget_breakdown.budget_m.toFixed(1)}m = £{data.budget_breakdown.squad_sell_value_m.toFixed(1)}m squad + £{data.budget_breakdown.bank_m.toFixed(1)}m bank ·{" "}
            {BUDGET_SOURCE_LABEL[data.budget_breakdown.source] ?? data.budget_breakdown.source}
          </p>
        )}

        {entryId <= 0 && (
          <p className="mt-6 text-sm text-muted-foreground">Link your FPL entry on the Squad page first.</p>
        )}
        {query.isPending && entryId > 0 && (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Building three squads…
          </div>
        )}
        {query.isError && (
          <div className="mt-6">
            <QueryErrorCard
              title="Couldn't build the wildcard squads"
              message={query.error instanceof Error ? query.error.message : String(query.error)}
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          </div>
        )}

        {data && (
          <div className="mt-4 space-y-4">
            <WildcardCoreStrip coreIds={data.core_ids} players={allPlayers} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {data.presets.map((preset) => (
                <WildcardPresetCard
                  key={preset.name}
                  preset={preset}
                  budgetM={data.budget_breakdown.budget_m}
                  onUse={usePreset}
                  pinned={pinned}
                  excluded={excluded}
                  onPin={togglePin}
                  onExclude={toggleExclude}
                />
              ))}
            </div>
            {data.notes.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {data.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
