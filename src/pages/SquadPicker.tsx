// Dev-only squad picker. Route is DEV+VITE_SQUAD_PICKER gated in App.tsx.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  buildSquad, getPlayers, optimizeLineup, getGkPairs,
  type SquadBuildParams, type SquadBuildResult, type SquadPlayer, type TeamNudge,
  type PoolPlayer, type LineupResult, type GkPair,
} from "@/lib/squadPickerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TeamStrengthGrid } from "@/components/TeamStrengthGrid";
import { PlayerListPanel } from "@/components/PlayerListPanel";
import { PlayerKnowledgePanel } from "@/components/PlayerKnowledgePanel";

const POS_ORDER: SquadPlayer["pos"][] = ["GKP", "DEF", "MID", "FWD"];
const QUOTA: Record<SquadPlayer["pos"], number> = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };

const DEFAULTS: SquadBuildParams = {
  horizon_gws: 5, budget_m: 100, objective: "wildcard", projection_basis: "blend",
  blend_weight: 0.5, minutes_prior_k: 500, include_flagged: false,
  min_chance_of_playing: 0, max_per_team: 3, min_fwd_minutes: 0, formation: "auto",
  fdr_strength: 1.0, home_away_strength: 1.0,
};

export default function SquadPicker() {
  const [params, setParams] = useState<SquadBuildParams>(DEFAULTS);
  const [teamNudges, setTeamNudges] = useState<TeamNudge[]>([]);
  const [squadIds, setSquadIds] = useState<number[]>([]);
  // Last legal result drives the display; an illegal edit shows violations but
  // keeps the last valid squad/XI on screen until it's legal again.
  const [lastGood, setLastGood] = useState<SquadBuildResult | null>(null);

  const poolQuery = useQuery({
    queryKey: ["squad-pool", params, teamNudges],
    queryFn: () => getPlayers({ ...params, team_nudges: teamNudges }),
    enabled: false,
  });

  const mutation = useMutation<SquadBuildResult, Error, SquadBuildParams>({
    mutationFn: buildSquad,
    onSuccess: (r) => {
      if (r.ok) {
        setLastGood(r);
        setSquadIds(r.squad.map((p) => p.player_id));
        poolQuery.refetch();
      }
    },
  });

  const lineupMutation = useMutation<LineupResult, Error, number[]>({
    mutationFn: (ids) => optimizeLineup(ids, { ...params, team_nudges: teamNudges }),
    onSuccess: (d) => { if (d.valid) setLastGood(d); },
  });

  const gkPairsMutation = useMutation<{ pairs: GkPair[] }, Error, void>({
    mutationFn: () => getGkPairs({ ...params, team_nudges: teamNudges }),
  });

  // Re-optimize the XI whenever the 15 changes (debounced).
  useEffect(() => {
    if (squadIds.length === 0) return;
    const t = setTimeout(() => lineupMutation.mutate(squadIds), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squadIds]);

  const res = lastGood;
  const xiIds = new Set((res?.starting_xi ?? []).map((p) => p.player_id));

  const pool = poolQuery.data?.players ?? [];
  const byId = useMemo(() => new Map(pool.map((p) => [p.player_id, p])), [pool]);
  const current = useMemo(
    () => squadIds.map((id) => byId.get(id)).filter(Boolean) as PoolPlayer[],
    [squadIds, byId]);

  const canAdd = (p: PoolPlayer) => {
    if (squadIds.includes(p.player_id)) return { ok: false, reason: "Already in squad" };
    if (squadIds.length >= 15) return { ok: false, reason: "Squad full (15)" };
    if (current.filter((x) => x.pos === p.pos).length >= QUOTA[p.pos])
      return { ok: false, reason: `${p.pos} full` };
    if (current.filter((x) => x.team_id === p.team_id).length >= (params.max_per_team ?? 3))
      return { ok: false, reason: `Max ${params.max_per_team ?? 3} from team` };
    const cost = current.reduce((s, x) => s + x.price_m, 0) + p.price_m;
    if (cost > (params.budget_m ?? 100)) return { ok: false, reason: "Over budget" };
    return { ok: true as const };
  };
  const addPlayer = (id: number) =>
    setSquadIds((s) => (s.length < 15 && !s.includes(id) ? [...s, id] : s));
  const removePlayer = (id: number) => setSquadIds((s) => s.filter((x) => x !== id));
  const usePair = (pair: GkPair) => {
    const gkIds = current.filter((p) => p.pos === "GKP").map((p) => p.player_id);
    setSquadIds((s) => [...s.filter((id) => !gkIds.includes(id)), ...pair.player_ids]);
  };

  const set = <K extends keyof SquadBuildParams>(k: K, v: SquadBuildParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const invalid = lineupMutation.data && !lineupMutation.data.valid ? lineupMutation.data : null;

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Squad Picker <span className="text-xs text-muted-foreground">(dev)</span></h1>
      </div>

      <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Horizon (GWs)">
          <Input type="number" min={1} max={8} value={params.horizon_gws}
            onChange={(e) => set("horizon_gws", Number(e.target.value))} />
        </Field>
        <Field label="Budget (£m)">
          <Input type="number" step={0.1} value={params.budget_m}
            onChange={(e) => set("budget_m", Number(e.target.value))} />
        </Field>
        <Field label="Objective">
          <select className="w-full rounded-md border bg-background p-2 text-sm" value={params.objective}
            onChange={(e) => set("objective", e.target.value as SquadBuildParams["objective"])}>
            <option value="wildcard">wildcard</option>
            <option value="free_hit">free_hit</option>
            <option value="plain">plain</option>
          </select>
        </Field>
        <Field label="Projection basis">
          <select className="w-full rounded-md border bg-background p-2 text-sm" value={params.projection_basis}
            onChange={(e) => set("projection_basis", e.target.value as SquadBuildParams["projection_basis"])}>
            <option value="ppg">ppg</option>
            <option value="xg">xg</option>
            <option value="blend">blend</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            Team-strength nudges below only affect xg / blend.
          </p>
        </Field>
        <Field label="Blend weight (xg share)">
          <Input type="number" step={0.05} min={0} max={1} value={params.blend_weight}
            onChange={(e) => set("blend_weight", Number(e.target.value))} />
        </Field>
        <Field label="Minutes prior K">
          <Input type="number" value={params.minutes_prior_k}
            onChange={(e) => set("minutes_prior_k", Number(e.target.value))} />
        </Field>
        <Field label="Max per team">
          <Input type="number" min={1} max={3} value={params.max_per_team}
            onChange={(e) => set("max_per_team", Number(e.target.value))} />
        </Field>
        <Field label="Min FWD minutes">
          <Input type="number" value={params.min_fwd_minutes}
            onChange={(e) => set("min_fwd_minutes", Number(e.target.value))} />
        </Field>
        <Field label="Min chance of playing %">
          <Input type="number" min={0} max={100} value={params.min_chance_of_playing}
            onChange={(e) => set("min_chance_of_playing", Number(e.target.value))} />
        </Field>
        <Field label="Formation">
          <Input value={params.formation} placeholder="auto or 3-4-3"
            onChange={(e) => set("formation", e.target.value)} />
        </Field>
        <Field label="FDR strength">
          <Input type="number" step={0.1} min={0} max={3} value={params.fdr_strength}
            onChange={(e) => set("fdr_strength", Number(e.target.value))} />
        </Field>
        <Field label="Home/away strength">
          <Input type="number" step={0.1} min={0} max={4} value={params.home_away_strength}
            onChange={(e) => set("home_away_strength", Number(e.target.value))} />
        </Field>
        <Field label="Max player £m (blank=off)">
          <Input type="number" step={0.5} min={4} placeholder="no cap"
            value={params.max_player_price ?? ""}
            onChange={(e) => set("max_player_price", e.target.value === "" ? undefined : Number(e.target.value))} />
        </Field>
        <Field label="Include flagged (injured)">
          <input type="checkbox" checked={!!params.include_flagged}
            onChange={(e) => set("include_flagged", e.target.checked)} />
        </Field>
        <div className="flex items-end">
          <Button className="w-full" disabled={mutation.isPending}
            onClick={() => mutation.mutate({ ...params, team_nudges: teamNudges })}>
            {mutation.isPending ? "Building…" : "Build squad"}
          </Button>
        </div>
      </Card>

      <TeamStrengthGrid onChange={setTeamNudges} />

      <PlayerKnowledgePanel pool={pool} todayISO={new Date().toISOString().slice(0, 10)} />

      {mutation.isError && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{mutation.error.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ensure the backend runs with <code>SQUAD_PICKER_MODE=1</code> and
            <code> VITE_FPL_API_BASE_URL</code> points at it.
          </p>
        </Card>
      )}

      {!res && !mutation.isPending && !mutation.isError && (
        <Card className="p-4 text-sm text-muted-foreground">
          Set params and press <b>Build squad</b>. Requires the backend running with
          <code> SQUAD_PICKER_MODE=1</code> and <code>VITE_FPL_API_BASE_URL</code> set.
        </Card>
      )}

      {res && res.ok && (
        <>
          <Card className="p-4 flex flex-wrap gap-4 text-sm items-center">
            <span>Selected <b>{squadIds.length}/15</b></span>
            <span>Cost <b>£{res.squad_cost_m?.toFixed(1)}m</b></span>
            <span>Bank <b>£{res.remaining_budget_m?.toFixed(1)}m</b></span>
            <span>Formation <b>{res.formation ? res.formation.join("-") : "?"}</b></span>
            <span>Basis <b>{res.projection_basis}</b></span>
            {res.projected_points && (
              <span>Projected GW{res.gw_start}-{(res.gw_start ?? 1) + (res.horizon_gws ?? 1) - 1}
                {" "}<b>{res.projected_points.horizon_total.toFixed(1)} pts</b></span>
            )}
            {lineupMutation.isPending && <span className="text-muted-foreground">optimizing…</span>}
          </Card>

          {invalid && (
            <Card className="p-3 border-destructive">
              <div className="text-xs font-semibold text-destructive mb-1">
                Squad not valid — showing last valid lineup
              </div>
              <ul className="text-xs text-destructive list-disc pl-4 space-y-0.5">
                {invalid.violations?.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </Card>
          )}

          {res.projected_points && (
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-2">
                Projected points per GW (XI + captain doubled) — directional cold-start estimate; do not compare totals across bases.
              </div>
              <div className="flex gap-3 flex-wrap">
                {res.projected_points.per_gw.map((g) => (
                  <div key={g.gw} className="text-center">
                    <div className="text-xs text-muted-foreground">GW{g.gw}</div>
                    <div className="font-semibold">{g.total.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div>
              <div className="text-xs font-semibold mb-1">
                All players {poolQuery.isFetching && <span className="text-muted-foreground">(loading…)</span>}
              </div>
              <PlayerListPanel players={pool} squadIds={squadIds}
                canAdd={canAdd} onAdd={addPlayer} onRemove={removePlayer} />
            </div>

            <Card className="p-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr><th className="p-2"></th><th className="p-2">Player</th><th>Pos</th><th>Team</th>
                    <th className="text-right">£m</th><th className="text-right">ppg</th>
                    <th className="text-right">5GW xPts</th><th>Role</th><th></th></tr>
                </thead>
                <tbody>
                  {POS_ORDER.flatMap((pos) =>
                    res.squad.filter((p) => p.pos === pos)
                      .sort((a, b) => (b.xpts_horizon ?? 0) - (a.xpts_horizon ?? 0))
                      .map((p) => {
                        const cap = p.player_id === res.captain_player_id;
                        const vice = p.player_id === res.vice_player_id;
                        return (
                          <tr key={p.player_id} className="border-t">
                            <td className="p-2 w-8 font-bold">{cap ? "C" : vice ? "V" : ""}</td>
                            <td className="p-2">{p.web_name}</td><td>{p.pos}</td><td>{p.team_short}</td>
                            <td className="text-right">{p.price_m?.toFixed(1)}</td>
                            <td className="text-right">{p.points_per_game?.toFixed(1) ?? "-"}</td>
                            <td className="text-right">{p.xpts_horizon?.toFixed(1) ?? "-"}</td>
                            <td>{xiIds.has(p.player_id) ? "XI" : "bench"}</td>
                            <td className="p-1 w-8">
                              <Button size="sm" variant="ghost" title="Remove"
                                onClick={() => removePlayer(p.player_id)}>×</Button>
                            </td>
                          </tr>
                        );
                      }),
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          {res.value_menu && (
            <Card className="p-4">
              <div className="text-xs font-semibold mb-2">Value menu — top by 5-GW xPts</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {(["GKP","DEF","MID","FWD"] as const).map((pos) => (
                  <div key={pos}>
                    <div className="font-semibold mb-1">{pos}</div>
                    <ul className="space-y-0.5">
                      {(res.value_menu?.[pos] ?? []).map((p) => (
                        <li key={p.player_id} className="flex justify-between gap-2">
                          <span>{p.web_name} <span className="text-muted-foreground">{p.team_short}</span></span>
                          <span className="text-muted-foreground">£{p.price_m?.toFixed(1)} · {p.xpts_horizon?.toFixed(1)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold">GK rotation pairs — nailed starters, complementary home/away</div>
              <Button size="sm" variant="outline" disabled={gkPairsMutation.isPending}
                onClick={() => gkPairsMutation.mutate()}>
                {gkPairsMutation.isPending ? "Finding…" : "Find pairs"}
              </Button>
            </div>
            {gkPairsMutation.data && (
              <ul className="text-xs space-y-1">
                {gkPairsMutation.data.pairs.map((pr, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 border-t pt-1">
                    <span>
                      {pr.names[0]} <span className="text-muted-foreground">({pr.teams[0]})</span>
                      {" + "}{pr.names[1]} <span className="text-muted-foreground">({pr.teams[1]})</span>
                      <span className="text-muted-foreground">
                        {" · "}£{pr.combined_cost_m}m · rot {pr.rotation_xpts} · home {pr.home_weeks}/{pr.gws}
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => usePair(pr)}>Use</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {res.notes?.length > 0 && (
            <Card className="p-4">
              <div className="text-xs font-semibold mb-1">Notes</div>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {res.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
