import type { DraftPitchPlayer } from "./draftPitch";
import type {
  FplTeamRecommendationPlayer,
  WildcardDraftPresetResult,
  WildcardPreset,
} from "./fplAssistantApi";

export type WildcardDraftPreset = WildcardDraftPresetResult;

export const WILDCARD_PRESET_STORAGE_KEY = "fpl_wildcard_preset";

export const ROLE_LABELS: Record<string, string> = {
  xi: "XI",
  pinned: "Pinned",
  gk2: "GK cover",
  def_cover: "DEF cover",
  dc_mid: "DC mid",
  free: "Free slot",
  enabler: "Enabler",
};

export const PRESET_BLURB: Record<WildcardPreset, string> = {
  aggressive: "Three premiums, cheapest playing bench, captaincy weighted up.",
  balanced: "Two premiums, a bench that plays: GK cover, DEF cover, a DC midfielder, one free slot.",
  gems: "At most one premium, six low-owned starters, trend weighted up.",
};

/** "BHA (H)" → home; "(A)" → away. Unknown shapes default to home=false. */
const isHomeLabel = (fixtures: string): boolean => /\(H\)/i.test(fixtures);

export function toDraftPitchPlayers(squad: FplTeamRecommendationPlayer[]): DraftPitchPlayer[] {
  return squad.map((p) => {
    const horizon = p.score_breakdown?.wildcard?.weighted_xpts ?? p.score_breakdown?.horizon_xpts ?? p.xpts ?? 0;
    const withPrice = p as FplTeamRecommendationPlayer & { price_m?: number };
    return {
      player_id: p.player_id,
      web_name: p.web_name,
      pos: p.pos,
      team_short: p.team_short,
      price_m: typeof withPrice.price_m === "number" ? withPrice.price_m : 0,
      xpts_horizon: typeof horizon === "number" ? horizon : 0,
      fixtures: (p.fixtures_horizon ?? []).map((f) => ({
        gw: f.event_id,
        opp: f.fixtures,
        home: isHomeLabel(f.fixtures),
        diff: typeof f.diff_avg === "number" ? f.diff_avg : 3,
      })),
    };
  });
}

/** XI ids present in every preset that built. */
export function coreFrom(presets: WildcardDraftPreset[]): number[] {
  const built = presets.filter((p) => p.ok && p.xi_ids.length > 0);
  if (built.length === 0) return [];
  let core = new Set(built[0].xi_ids);
  for (const p of built.slice(1)) core = new Set(p.xi_ids.filter((id) => core.has(id)));
  return [...core].sort((a, b) => a - b);
}

export interface PresetSummary {
  xi: number;
  bench: number;
  cost: number;
  budget: number;
  left: number;
  premiums: number;
  ownership: number | null;
  transfers: number | null;
  flags: number;
}

export function summary(preset: WildcardDraftPreset, budgetM: number): PresetSummary {
  return {
    xi: preset.xi_xpts_horizon ?? 0,
    bench: preset.bench_xpts_horizon ?? 0,
    cost: preset.squad_cost_m ?? 0,
    budget: budgetM,
    left: preset.remaining_budget_m ?? Math.max(0, Math.round((budgetM - (preset.squad_cost_m ?? 0)) * 10) / 10),
    premiums: preset.premiums ?? 0,
    ownership: preset.avg_ownership ?? null,
    transfers: preset.transfers_from_current ?? null,
    flags: preset.flags ?? 0,
  };
}

export function readStoredPreset(): WildcardPreset {
  try {
    const raw = localStorage.getItem(WILDCARD_PRESET_STORAGE_KEY);
    if (raw === "aggressive" || raw === "balanced" || raw === "gems") return raw;
  } catch {
    /* no storage */
  }
  return "balanced";
}

export function storePreset(preset: WildcardPreset): void {
  try {
    localStorage.setItem(WILDCARD_PRESET_STORAGE_KEY, preset);
  } catch {
    /* no storage */
  }
}
