// Dev-only squad-picker client. Talks to the SQUAD_PICKER_MODE-gated backend
// (POST /squad-picker/build, GET/POST /squad-picker/knowledge). Never used in
// production (the route is DEV+flag gated in App.tsx).

export type ProjectionBasis = "ppg" | "xg" | "blend";
export type Objective = "wildcard" | "free_hit" | "plain";

export interface TeamNudge {
  team_short: string;
  attack: number;
  defense: number;
}

export interface SquadBuildParams {
  horizon_gws?: number;
  budget_m?: number;
  objective?: Objective;
  projection_basis?: ProjectionBasis;
  blend_weight?: number;
  minutes_prior_k?: number;
  include_flagged?: boolean;
  min_chance_of_playing?: number;
  max_per_team?: number;
  min_fwd_minutes?: number;
  formation?: string; // "auto" | "3-4-3" | ...
  fdr_strength?: number;
  home_away_strength?: number; // scales home 1.06 / away 0.94 swing (1=default, >1 amplifies)
  max_player_price?: number; // auto-build only: cap price per player (undefined/0 = no cap)
  team_nudges?: TeamNudge[]; // per-team xg/blend attack/defense nudges; [] = no override
}

export interface SquadPlayer {
  player_id: number;
  web_name: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team_short: string;
  team_name?: string;
  price_m: number;
  points_per_game?: number;
  xpts_horizon?: number;
  is_captain_suggested?: boolean;
  is_vice_suggested?: boolean;
  xpts?: number;
  event_points?: number;
}

export interface ProjectedGw { gw: number; xi_points: number; captain_bonus: number; total: number; }
export interface ProjectedPoints { per_gw: ProjectedGw[]; horizon_total: number; }

export interface SquadBuildResult {
  ok: boolean;
  reason?: string | null;
  notes: string[];
  gw_start?: number;
  horizon_gws?: number;
  objective?: string;
  projection_basis?: string;
  formation?: [number, number, number] | null;
  captain_player_id?: number | null;
  vice_player_id?: number | null;
  budget_m?: number;
  squad_cost_m?: number | null;
  remaining_budget_m?: number | null;
  squad: SquadPlayer[];
  starting_xi: SquadPlayer[];
  bench: SquadPlayer[];
  value_menu?: Record<string, SquadPlayer[]>;
  projected_points?: ProjectedPoints;
}

export interface KnowledgeGrid {
  as_of: string | null;
  teams: Record<string, { attack?: number; defense?: number; note?: string }>;
}

function apiBase(): string {
  const v = (import.meta.env as Record<string, unknown>)["VITE_FPL_API_BASE_URL"];
  return typeof v === "string" ? v : "";
}

export function squadPickerEnabled(): boolean {
  return import.meta.env.VITE_SQUAD_PICKER === "1";
}

export async function buildSquad(params: SquadBuildParams): Promise<SquadBuildResult> {
  const res = await fetch(`${apiBase()}/squad-picker/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const b = await res.json(); if (b?.detail) detail = b.detail; } catch { /* ignore */ }
    throw new Error(`Squad build failed: ${detail}`);
  }
  return (await res.json()) as SquadBuildResult;
}

export async function getKnowledge(): Promise<KnowledgeGrid> {
  const res = await fetch(`${apiBase()}/squad-picker/knowledge`);
  if (!res.ok) throw new Error(`Knowledge fetch failed: HTTP ${res.status}`);
  return (await res.json()) as KnowledgeGrid;
}

export async function saveKnowledge(grid: KnowledgeGrid): Promise<KnowledgeGrid> {
  const res = await fetch(`${apiBase()}/squad-picker/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(grid),
  });
  if (!res.ok) throw new Error(`Knowledge save failed: HTTP ${res.status}`);
  return (await res.json()) as KnowledgeGrid;
}

// --- full player pool + manual-swap lineup (dev-only) ---

export interface PoolPlayer {
  player_id: number;
  web_name: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team_short: string;
  team_id: number;
  price_m: number;
  points_per_game: number;
  total_points: number;
  minutes: number;
  starts: number;
  selected_by_percent: number;
  xpts_horizon: number;
  xpts_per_gw: number[];
  fixtures: { gw: number; opp: string; home: boolean; diff: number }[];
  avg_diff: number | null;
  home_games: number;
  pk_availability: number | null;
  pk_note: string | null;
}

export interface PlayerPool {
  gw_start: number;
  horizon_gws: number;
  projection_basis: string;
  players: PoolPlayer[];
}

export type LineupResult = SquadBuildResult & { valid: boolean; violations?: string[] };

export async function getPlayers(params: SquadBuildParams): Promise<PlayerPool> {
  const res = await fetch(`${apiBase()}/squad-picker/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) throw new Error(`Players fetch failed: HTTP ${res.status}`);
  return (await res.json()) as PlayerPool;
}

export async function optimizeLineup(
  playerIds: number[], params: SquadBuildParams): Promise<LineupResult> {
  const res = await fetch(`${apiBase()}/squad-picker/lineup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_ids: playerIds, params: params ?? {} }),
  });
  if (!res.ok) throw new Error(`Lineup failed: HTTP ${res.status}`);
  return (await res.json()) as LineupResult;
}

export interface GkPair {
  player_ids: [number, number];
  names: [string, string];
  teams: [string, string];
  prices: [number, number];
  combined_cost_m: number;
  rotation_xpts: number;
  home_weeks: number;
  gws: number;
}

export async function getGkPairs(
  params: SquadBuildParams & { gk_pair_min_minutes?: number; gk_pair_budget?: number },
): Promise<{ pairs: GkPair[] }> {
  const res = await fetch(`${apiBase()}/squad-picker/gk-pairs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) throw new Error(`GK pairs failed: HTTP ${res.status}`);
  return (await res.json()) as { pairs: GkPair[] };
}

// --- player-knowledge (news/injury) rail ---

export interface PlayerKnowledgeEntry {
  availability?: number;
  available_from_gw?: number | null;
  minutes_mult?: number;
  note?: string;
  source?: string;
}
export interface PlayerKnowledge {
  as_of: string | null;
  players: Record<string, PlayerKnowledgeEntry>;
}

export async function getPlayerKnowledge(): Promise<PlayerKnowledge> {
  const res = await fetch(`${apiBase()}/squad-picker/player-knowledge`);
  if (!res.ok) throw new Error(`Player knowledge fetch failed: HTTP ${res.status}`);
  return (await res.json()) as PlayerKnowledge;
}

export async function savePlayerKnowledge(pk: PlayerKnowledge): Promise<PlayerKnowledge> {
  const res = await fetch(`${apiBase()}/squad-picker/player-knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pk),
  });
  if (!res.ok) throw new Error(`Player knowledge save failed: HTTP ${res.status}`);
  return (await res.json()) as PlayerKnowledge;
}

export interface DigestResult {
  proposals: { players: Record<string, PlayerKnowledgeEntry> };
  article_count: number;
  matched_players: number;
  bootstrap_flags: number; // live FPL injury/suspension flags (Approach A)
}

// --- per-team news rollup (Level 1: surface live injuries in the team check) ---

export interface TeamNewsPlayer {
  player_id: number;
  web_name: string;
  availability: number;
  available_from_gw: number | null;
  note: string | null;
}
export interface TeamNews {
  teams: Record<string, TeamNewsPlayer[]>;
  total: number;
}

export async function getTeamNews(params: SquadBuildParams = {}): Promise<TeamNews> {
  const res = await fetch(`${apiBase()}/squad-picker/team-news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) throw new Error(`Team news fetch failed: HTTP ${res.status}`);
  return (await res.json()) as TeamNews;
}

export async function digestNews(params: Record<string, unknown> = {}): Promise<DigestResult> {
  const res = await fetch(`${apiBase()}/squad-picker/digest-news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`News digest failed: HTTP ${res.status}`);
  return (await res.json()) as DigestResult;
}
