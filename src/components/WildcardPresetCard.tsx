import { Pin, PinOff, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraftPitch } from "@/components/DraftPitch";
import {
  PRESET_BLURB,
  ROLE_LABELS,
  summary,
  toDraftPitchPlayers,
  type WildcardDraftPreset,
} from "@/lib/wildcardDrafts";
import type { FplTeamRecommendationPlayer, WildcardPreset } from "@/lib/fplAssistantApi";

interface Props {
  preset: WildcardDraftPreset;
  budgetM: number;
  /** "summary": compact stats card (no pitch) for the side-by-side row;
   *  "detail": the full pitch, bench roles and pin/ban list. Default detail. */
  mode?: "summary" | "detail";
  selected?: boolean;
  onSelect?: (name: WildcardPreset) => void;
  /** Every player across the three squads, so dropped pins can be named. */
  allPlayers?: FplTeamRecommendationPlayer[];
  onUse: (name: WildcardPreset) => void;
  pinned: Set<number>;
  excluded: Set<number>;
  onPin: (playerId: number) => void;
  onExclude: (playerId: number) => void;
}

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/** One of the three wildcard squads: headline stats, the pitch, bench roles,
 *  pin / ban controls per player, and the hand-off button. */
export function WildcardPresetCard({ preset, budgetM, allPlayers = [], mode = "detail", selected = false, onSelect, onUse, pinned, excluded, onPin, onExclude }: Props) {
  if (!preset.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-lg font-semibold">{preset.label}</p>
        <p className="mt-2 text-sm text-muted-foreground">Could not build this squad: {preset.reason ?? "unknown reason"}</p>
      </div>
    );
  }
  const s = summary(preset, budgetM);
  const names = new Map(allPlayers.map((p) => [p.player_id, p.web_name]));
  const pitch = toDraftPitchPlayers(preset.squad);
  const xiIds = new Set(preset.xi_ids);
  const bench = preset.squad.filter((p) => !xiIds.has(p.player_id));

  const header = (
    <div>
      <p className="text-lg font-semibold">{preset.label}</p>
      <p className="text-xs text-muted-foreground">{PRESET_BLURB[preset.name]}</p>
    </div>
  );
  const stats = (
    <>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-muted px-2 py-1.5">
          <p className="text-muted-foreground">XI xPts</p>
          <p className="text-base font-semibold" data-testid="xi-xpts">{fmt1(s.xi)}</p>
        </div>
        <div className="rounded-lg bg-muted px-2 py-1.5">
          <p className="text-muted-foreground">Bench xPts</p>
          <p className="text-base font-semibold">{fmt1(s.bench)}</p>
        </div>
        <div className="rounded-lg bg-muted px-2 py-1.5">
          <p className="text-muted-foreground">Cost</p>
          <p className="text-base font-semibold">£{fmt1(s.cost)}m <span className="text-[10px] text-muted-foreground">/ {fmt1(s.budget)}</span></p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-full bg-muted px-2 py-0.5">{s.premiums} premiums</span>
        {s.ownership !== null && <span className="rounded-full bg-muted px-2 py-0.5">{fmt1(s.ownership)}% avg owned</span>}
        {s.transfers !== null && <span className="rounded-full bg-muted px-2 py-0.5">{s.transfers} transfers</span>}
        {s.flags > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700">{s.flags} flagged</span>}
      </div>
    </>
  );

  if (mode === "summary") {
    return (
      <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
        {header}
        {stats}
        <div className="flex gap-2">
          <Button variant={selected ? "default" : "outline"} className="flex-1" onClick={() => onSelect?.(preset.name)}>
            View squad
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => onUse(preset.name)}>
            Use this squad
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {header}
      {stats}

      <DraftPitch squad={pitch} xiIds={xiIds} captainId={preset.captain_id ?? null} viceId={preset.vice_id ?? null} />

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {bench.map((p) => {
          const role = p.score_breakdown?.wildcard?.role ?? preset.bench_roles?.[String(p.player_id)] ?? "enabler";
          return (
            <span key={p.player_id} className="rounded-full border border-border px-2 py-0.5">
              <span>{p.web_name}</span> · <span>{ROLE_LABELS[role] ?? role}</span>
            </span>
          );
        })}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Pin or ban players</summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {preset.squad.map((p) => {
            const isPinned = pinned.has(p.player_id);
            const isBanned = excluded.has(p.player_id);
            return (
              <li key={p.player_id} className="flex items-center justify-between gap-1">
                <span className={isBanned ? "line-through text-muted-foreground" : ""}>{p.web_name}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`${isPinned ? "Unpin" : "Pin"} ${p.web_name}`}
                    className={`rounded p-0.5 ${isPinned ? "text-primary" : "text-muted-foreground"} hover:bg-muted`}
                    onClick={() => onPin(p.player_id)}
                  >
                    {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Ban ${p.web_name}`}
                    className={`rounded p-0.5 ${isBanned ? "text-rose-600" : "text-muted-foreground"} hover:bg-muted`}
                    onClick={() => onExclude(p.player_id)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </details>

      {preset.notes.length > 0 && (
        <ul className="space-y-0.5 text-[11px] text-muted-foreground">
          {preset.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {preset.pins_conflict.length > 0 && (
        <p className="text-[11px] text-amber-700">
          Pins dropped (shape or cap): {preset.pins_conflict.map((id) => names.get(id) ?? `#${id}`).join(", ")}
        </p>
      )}

      <Button className="w-full" onClick={() => onUse(preset.name)}>
        Use this squad
      </Button>
    </div>
  );
}
