// Dev-only squad-picker client. Talks to the SQUAD_PICKER_MODE-gated backend
// (POST /squad-picker/build, GET/POST /squad-picker/knowledge). Never used in
// production (the route is DEV+flag gated in App.tsx).

export type ProjectionBasis = "ppg" | "xg" | "blend";
export type Objective = "wildcard" | "free_hit" | "plain";

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
