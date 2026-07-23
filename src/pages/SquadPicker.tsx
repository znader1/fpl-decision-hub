// Dev-only squad picker. Route is DEV+VITE_SQUAD_PICKER gated in App.tsx.
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  buildSquad, type SquadBuildParams, type SquadBuildResult, type SquadPlayer,
} from "@/lib/squadPickerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const POS_ORDER: SquadPlayer["pos"][] = ["GKP", "DEF", "MID", "FWD"];

const DEFAULTS: SquadBuildParams = {
  horizon_gws: 5, budget_m: 100, objective: "wildcard", projection_basis: "ppg",
  blend_weight: 0.5, minutes_prior_k: 500, include_flagged: false,
  min_chance_of_playing: 0, max_per_team: 3, min_fwd_minutes: 0, formation: "auto",
};

export default function SquadPicker() {
  const [params, setParams] = useState<SquadBuildParams>(DEFAULTS);
  const mutation = useMutation<SquadBuildResult, Error, SquadBuildParams>({
    mutationFn: buildSquad,
  });
  const res = mutation.data;

  const set = <K extends keyof SquadBuildParams>(k: K, v: SquadBuildParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const xiIds = new Set((res?.starting_xi ?? []).map((p) => p.player_id));

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
        <Field label="Include flagged (injured)">
          <input type="checkbox" checked={!!params.include_flagged}
            onChange={(e) => set("include_flagged", e.target.checked)} />
        </Field>
        <div className="flex items-end">
          <Button className="w-full" disabled={mutation.isPending}
            onClick={() => mutation.mutate(params)}>
            {mutation.isPending ? "Building…" : "Build squad"}
          </Button>
        </div>
      </Card>

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
          <Card className="p-4 flex flex-wrap gap-4 text-sm">
            <span>Cost <b>£{res.squad_cost_m?.toFixed(1)}m</b></span>
            <span>Bank <b>£{res.remaining_budget_m?.toFixed(1)}m</b></span>
            <span>Formation <b>{res.formation ? res.formation.join("-") : "?"}</b></span>
            <span>Basis <b>{res.projection_basis}</b></span>
            {res.projected_points && (
              <span>Projected GW{res.gw_start}-{(res.gw_start ?? 1) + (res.horizon_gws ?? 1) - 1}
                {" "}<b>{res.projected_points.horizon_total.toFixed(1)} pts</b></span>
            )}
          </Card>

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

          <Card className="p-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="p-2"></th><th className="p-2">Player</th><th>Pos</th><th>Team</th>
                  <th className="text-right">£m</th><th className="text-right">ppg</th>
                  <th className="text-right">5GW xPts</th><th>Role</th></tr>
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
                        </tr>
                      );
                    }),
                )}
              </tbody>
            </table>
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

      {res && !res.ok && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">Build failed: {res.reason}</p>
        </Card>
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
