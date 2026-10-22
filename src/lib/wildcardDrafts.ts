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

export const WILDCARD_PINS_STORAGE_KEY = "fpl_wildcard_pinned_ids";
export const WILDCARD_BANS_STORAGE_KEY = "fpl_wildcard_excluded_ids";

export interface WildcardHandoff {
  preset: WildcardPreset;
  pinnedIds: number[];
  excludedIds: number[];
  horizonGws: number | null;
  playEventId: number | null;
}

const readIdList = (key: string): number[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is number => Number.isInteger(v)) : [];
  } catch {
    return [];
  }
};

/** Everything the plan flow needs to rebuild the squad the user chose on
 *  the wildcard page: preset, pins, bans, horizon and the play GW. */
export function storeHandoff(h: { preset: WildcardPreset; pinnedIds: number[]; excludedIds: number[]; horizonGws: number; playEventId: number | null }): void {
  try {
    localStorage.setItem(WILDCARD_PRESET_STORAGE_KEY, h.preset);
    localStorage.setItem(WILDCARD_PINS_STORAGE_KEY, JSON.stringify(h.pinnedIds));
    localStorage.setItem(WILDCARD_BANS_STORAGE_KEY, JSON.stringify(h.excludedIds));
    localStorage.setItem("fpl_chip_strategy", "wildcard");
    localStorage.setItem("fpl_horizon_gws", String(h.horizonGws));
    if (h.playEventId) localStorage.setItem("fpl_chip_play_event_id", String(h.playEventId));
  } catch {
    /* no storage */
  }
}

export function readHandoff(): WildcardHandoff {
  let horizon: number | null = null;
  let play: number | null = null;
  try {
    const h = Number(localStorage.getItem("fpl_horizon_gws"));
    horizon = Number.isInteger(h) && h > 0 ? h : null;
    const p = Number(localStorage.getItem("fpl_chip_play_event_id"));
    play = Number.isInteger(p) && p > 0 ? p : null;
  } catch {
    /* no storage */
  }
  return {
    preset: readStoredPreset(),
    pinnedIds: readIdList(WILDCARD_PINS_STORAGE_KEY),
    excludedIds: readIdList(WILDCARD_BANS_STORAGE_KEY),
    horizonGws: horizon,
    playEventId: play,
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
