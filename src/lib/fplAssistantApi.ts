export type FplPosition = "GKP" | "DEF" | "MID" | "FWD";

export interface FplTeamRecommendationPlayer {
  player_id: number;
  web_name: string;
  pos: FplPosition;
  team_short: string;
  team_name: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
  xpts: number;
  event_points?: number | null;
  next_fixtures?: string;
  fixtures_horizon?: FplFixturesHorizonItem[];
  is_captain_suggested?: boolean;
  is_vice_suggested?: boolean;
  team?: number;
  code?: number;
  photo?: string;
  badge_url?: string;
  photo_url?: string;
  alerts?: FplPlayerAlert[];
  score_breakdown?: FplPlayerScoreBreakdown;
}

export interface FplFixturesHorizonItem {
  event_id: number;
  fixtures: string;
  fixture_count?: number;
  diff_avg?: number;
  xpts?: number;
}

export interface FplTeamRecommendationBenchPlayer extends FplTeamRecommendationPlayer {
  bench_order: number;
}

export interface FplPlayerAlert {
  severity?: "high" | "medium" | "info" | "low" | string;
  category?: string;
  text?: string;
  event_id?: number | null;
  player_id?: number | null;
  player_name?: string;
}

export interface FplWildcardScoreBreakdown {
  score?: number | null;
  weighted_xpts?: number | null;
  future_dgw_bonus?: number | null;
  captaincy_bonus?: number | null;
}

export interface FplRecentFormBreakdown {
  window_gws?: number | null;
  history_max_gw?: number | null;
  samples?: number | null;
  last_gw?: number | null;
  available?: boolean;
  avg_points?: number | null;
  avg_minutes?: number | null;
  avg_fixture_count?: number | null;
  avg_starts?: number | null;
}

export interface FplBaselineBreakdown {
  long_term?: number | null;
  recent_gw?: number | null;
  blended?: number | null;
  gw1_after_ep_next_blend?: number | null;
}

export interface FplPlayerScoreBreakdown {
  note?: string;
  current_gw_xpts?: number | null;
  horizon_xpts?: number | null;
  objective_score_col?: string | null;
  objective_score?: number | null;
  objective_explanation?: string;
  wildcard?: FplWildcardScoreBreakdown;
  recent_form?: FplRecentFormBreakdown;
  baseline?: FplBaselineBreakdown;
  fixtures_horizon?: FplFixturesHorizonItem[];
}

export interface FplTransferPlayer {
  id: number;
  name: string;
  team: string;
  price: number;
}

export interface FplTransferMove {
  position?: FplPosition;
  sell: FplTransferPlayer;
  buy: FplTransferPlayer;
  score_gain?: number;
  buy_hot_score?: number;
  buy_set_piece_score?: number;
}

export interface FplTransferPlan {
  free_transfers?: number;
  horizon_gws?: number;
  hit_cap?: number;
  transfer_count_target?: number;
  transfer_count_built?: number;
}

export interface FplHotPlayer extends FplTransferPlayer {
  pos?: FplPosition;
  xpts?: number;
  xpts_horizon?: number;
  transfer_score?: number;
  hot_score?: number;
  set_piece_score?: number;
}

export type FplMovesByPosition = Partial<Record<FplPosition, number>>;
export type FplHotByPosition = Partial<Record<FplPosition, FplHotPlayer[]>>;
export type FplChipStrategy = "none" | "wildcard" | "free_hit";

export interface FplTransfersRecommendation {
  note?: string;
  transfer_plan?: FplTransferPlan;
  moves_by_position?: FplMovesByPosition;
  hot_by_position?: FplHotByPosition;
  moves: FplTransferMove[];
  remaining_itb?: number;
  max_moves?: number;
  moves_used?: number;
  hit_cost?: number;
  total_score_gain?: number;
  transfer_policy?: {
    max_moves?: number;
    moves_used?: number;
  };
}

export interface FplTeamFixture {
  team_short: string;
  opponent_short: string;
  difficulty?: number;
  is_home?: boolean;
}

export interface FplNextEventSummary {
  event_id: number | null;
  deadline_time_utc?: string | null;
  first_fixture_time_utc?: string | null;
  hours_to_deadline?: number | null;
  hours_to_first_fixture?: number | null;
  fixture_count?: number;
}

export interface FplEntryHistory {
  points?: number;
  total_points?: number;
  overall_rank?: number;
  rank?: number;
  event_transfers?: number;
  event_transfers_cost?: number;
  points_on_bench?: number;
}

export interface FplSquad {
  entry_id: number;
  event_id: number;
  note?: string;
  formation?: [number, number, number];
  captain_player_id?: number;
  vice_player_id?: number;
  starting_xi: FplTeamRecommendationPlayer[];
  bench: FplTeamRecommendationBenchPlayer[];
  entry_history?: FplEntryHistory;
  active_chip?: string | null;
}

export interface FplTransferApplicationSummary {
  requested: number;
  applied: number;
  skipped: number;
  available_moves?: number;
  requested_apply_count?: number;
}

export interface FplTransferImpactSummary {
  base_projected_points_with_captain: number;
  with_transfers_projected_points_with_captain: number;
  delta_projected_points_with_captain: number;
}

export interface FplApiTimingsMs {
  load_context_ms?: number;
  projections_ms?: number;
  optimize_base_ms?: number;
  pack_base_lineup_ms?: number;
  position_panels_ms?: number;
  transfer_preview_ms?: number;
  transfer_apply_and_reoptimize_ms?: number;
  total_ms?: number;
}

export interface FplOptimizedSquad extends FplSquad {
  formation: [number, number, number];
  captain_player_id: number;
  vice_player_id: number;
  projected_points_with_captain: number;
}

export interface FplTransferAppliedStep extends FplOptimizedSquad {
  applied_count: number;
  transfer_application?: FplTransferApplicationSummary;
  transfer_impact?: FplTransferImpactSummary;
}

export interface FplChipStrategySummary {
  selected: FplChipStrategy;
  is_active: boolean;
  objective_score_col?: string | null;
  objective_horizon_gws?: number | null;
  play_event_id?: number | null;
  propagates_to_future_gws?: boolean;
  budget_m?: number | null;
  squad_cost_m?: number | null;
  remaining_budget_m?: number | null;
  objective_score_total?: number | null;
  objective_components?: string[];
  explanation?: string | null;
  profile?: {
    summary?: string;
    focus?: string[];
    premium_attackers?: number;
    future_double_gameweeks?: number[];
    future_double_players?: number;
  } | null;
  reason?: string | null;
}

export interface FplScoringGuide {
  headline?: string;
  bullets?: string[];
  objective_score_col?: string | null;
}

export interface FplSquadInsights {
  summary_points?: FplPlayerAlert[];
  player_flags?: FplPlayerAlert[];
}

export interface FplHistoryContext {
  source?: "csv" | "fallback" | string;
  base_dir?: string;
  path?: string | null;
  max_gw?: number | null;
  updated_at_utc?: string | null;
  season?: string | null;
}

export interface FplTeamRecommendation extends FplSquad {
  entry_id: number;
  event_id: number;
  horizon_gws: number;
  squad_source?: string;
  formation: [number, number, number];
  captain_player_id: number;
  vice_player_id: number;
  projected_points_with_captain: number;
  chip_strategy?: FplChipStrategySummary;
  transfers?: FplTransfersRecommendation;
  transfer_application?: FplTransferApplicationSummary;
  transfer_impact?: FplTransferImpactSummary;
  squad_with_transfers?: FplOptimizedSquad;
  squad_with_transfers_steps?: FplTransferAppliedStep[];
  timings_ms?: FplApiTimingsMs;
  scoring_guide?: FplScoringGuide;
  squad_insights?: FplSquadInsights;
  history_context?: FplHistoryContext;
  starting_xi: FplTeamRecommendationPlayer[];
  bench: FplTeamRecommendationBenchPlayer[];
}

export const SAMPLE_TEAM_RECOMMENDATION: FplTeamRecommendation = {
  entry_id: 588004,
  event_id: 25,
  horizon_gws: 3,
  formation: [4, 5, 1],
  captain_player_id: 449,
  vice_player_id: 237,
  projected_points_with_captain: 57.931999999999995,
  transfers: {
    note: "Heuristic transfer planner with horizon + hot-player + set-piece weighting.",
    transfer_plan: {
      free_transfers: 1,
      horizon_gws: 3,
      hit_cap: 0,
      transfer_count_target: 4,
      transfer_count_built: 1,
    },
    moves_by_position: {
      GKP: 1,
    },
    hot_by_position: {
      GKP: [
        {
          id: 32,
          name: "Martinez",
          team: "AVL",
          pos: "GKP",
          price: 5,
          transfer_score: 7.8,
          hot_score: 2.2,
          set_piece_score: 0,
        },
      ],
      DEF: [],
      MID: [],
      FWD: [],
    },
    moves: [
      {
        position: "GKP",
        sell: {
          id: 253,
          name: "Henderson",
          team: "CRY",
          price: 5,
        },
        buy: {
          id: 32,
          name: "Martinez",
          team: "AVL",
          price: 5,
        },
        score_gain: 5.1,
        buy_hot_score: 2.2,
        buy_set_piece_score: 0,
      },
    ],
    remaining_itb: 0.5,
  },
  starting_xi: [
    {
      player_id: 5,
      web_name: "Gabriel",
      pos: "DEF",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: true,
      is_vice_captain: false,
      multiplier: 3,
      xpts: 5.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 226597,
      photo: "226597.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p226597.png",
    },
    {
      player_id: 411,
      web_name: "O'Reilly",
      pos: "DEF",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.7,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 472769,
      photo: "472769.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p472769.png",
    },
    {
      player_id: 8,
      web_name: "J.Timber",
      pos: "DEF",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.2,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 445122,
      photo: "445122.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p445122.png",
    },
    {
      player_id: 72,
      web_name: "Senesi",
      pos: "DEF",
      team_short: "BOU",
      team_name: "Bournemouth",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.8880000000000003,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 4,
      code: 221466,
      photo: "221466.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t91.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p221466.png",
    },
    {
      player_id: 430,
      web_name: "Haaland",
      pos: "FWD",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: true,
      multiplier: 1,
      xpts: 5.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 223094,
      photo: "223094.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p223094.png",
    },
    {
      player_id: 253,
      web_name: "Henderson",
      pos: "GKP",
      team_short: "CRY",
      team_name: "Crystal Palace",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.024,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 8,
      code: 172649,
      photo: "172649.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t31.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p172649.png",
    },
    {
      player_id: 449,
      web_name: "B.Fernandes",
      pos: "MID",
      team_short: "MUN",
      team_name: "Man Utd",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 7.4,
      is_captain_suggested: true,
      is_vice_suggested: false,
      team: 14,
      code: 141746,
      photo: "141746.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t1.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p141746.png",
    },
    {
      player_id: 237,
      web_name: "Enzo",
      pos: "MID",
      team_short: "CHE",
      team_name: "Chelsea",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 5.6160000000000005,
      is_captain_suggested: false,
      is_vice_suggested: true,
      team: 7,
      code: 448047,
      photo: "448047.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t8.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p448047.png",
    },
    {
      player_id: 267,
      web_name: "Sarr",
      pos: "MID",
      team_short: "CRY",
      team_name: "Crystal Palace",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.104,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 8,
      code: 232185,
      photo: "232185.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t31.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p232185.png",
    },
    {
      player_id: 21,
      web_name: "Rice",
      pos: "MID",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.7,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 204480,
      photo: "204480.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p204480.png",
    },
    {
      player_id: 417,
      web_name: "Cherki",
      pos: "MID",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 466052,
      photo: "466052.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p466052.png",
    },
  ],
  bench: [
    {
      player_id: 136,
      web_name: "Thiago",
      pos: "FWD",
      team_short: "BRE",
      team_name: "Brentford",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 1,
      team: 5,
      code: 502500,
      photo: "502500.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p502500.png",
    },
    {
      player_id: 691,
      web_name: "Calvert-Lewin",
      pos: "FWD",
      team_short: "LEE",
      team_name: "Leeds",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 2,
      team: 11,
      code: 177815,
      photo: "177815.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t2.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p177815.png",
    },
    {
      player_id: 191,
      web_name: "Estève",
      pos: "DEF",
      team_short: "BUR",
      team_name: "Burnley",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.4,
      bench_order: 3,
      team: 3,
      code: 477717,
      photo: "477717.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t90.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p477717.png",
    },
    {
      player_id: 470,
      web_name: "Dúbravka",
      pos: "GKP",
      team_short: "BUR",
      team_name: "Burnley",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 4,
      team: 3,
      code: 67089,
      photo: "67089.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t90.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p67089.png",
    },
  ],
};

export const SAMPLE_SQUAD: FplSquad = {
  entry_id: SAMPLE_TEAM_RECOMMENDATION.entry_id,
  event_id: SAMPLE_TEAM_RECOMMENDATION.event_id,
  formation: SAMPLE_TEAM_RECOMMENDATION.formation,
  captain_player_id: SAMPLE_TEAM_RECOMMENDATION.captain_player_id,
  vice_player_id: SAMPLE_TEAM_RECOMMENDATION.vice_player_id,
  starting_xi: SAMPLE_TEAM_RECOMMENDATION.starting_xi,
  bench: SAMPLE_TEAM_RECOMMENDATION.bench,
  entry_history: {
    points: 54,
    total_points: 1712,
    overall_rank: 1203456,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isFplSquad = (value: unknown): value is FplSquad => {
  if (!isRecord(value)) return false;
  if (typeof value.entry_id !== "number") return false;
  if (typeof value.event_id !== "number") return false;
  if (!Array.isArray(value.starting_xi)) return false;
  if (!Array.isArray(value.bench)) return false;
  return true;
};

export const isFplTeamRecommendation = (value: unknown): value is FplTeamRecommendation => {
  if (!isFplSquad(value)) return false;
  if (!isRecord(value)) return false;
  if (typeof value.horizon_gws !== "number") return false;
  if (
    !Array.isArray(value.formation) ||
    value.formation.length !== 3 ||
    value.formation.some((n) => typeof n !== "number")
  ) {
    return false;
  }
  if (typeof value.captain_player_id !== "number") return false;
  if (typeof value.vice_player_id !== "number") return false;
  if (typeof value.projected_points_with_captain !== "number") return false;
  return true;
};

export interface TeamRecommendationParams {
  entryId: number;
  eventId: number;
  horizonGws: number;
  chipStrategy?: FplChipStrategy;
  chipHorizonGws?: number;
  chipPlayEventId?: number;
  strategy?: string;
  includeTransfers?: boolean;
  applyTransferCount?: number;
  latestNMatches?: number;
  freeTransfers?: number;
  hitCap?: number;
  panelLimit?: number;
}

export interface SquadParams {
  entryId: number;
  eventId: number;
}

export interface FixturesParams {
  eventId: number;
}

const isFplNextEventSummary = (value: unknown): value is FplNextEventSummary => {
  if (!isRecord(value)) return false;
  if (value.event_id !== null && typeof value.event_id !== "number") return false;
  return true;
};

type UrlTemplateParamValue = string | number | boolean | undefined | null;
type UrlTemplateParams = Record<string, UrlTemplateParamValue>;

export const interpolateUrlTemplate = (template: string, params: UrlTemplateParams): string => {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) return "";
    return encodeURIComponent(String(value));
  });
};

const appendMissingQueryParams = (url: string, params: UrlTemplateParams): string => {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, base);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (!parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, String(value));
      }
    }

    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
    if (isAbsolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
};

export const interpolateSquadUrl = (template: string, params: SquadParams): string => {
  const query = { entry_id: params.entryId, event_id: params.eventId };
  const interpolated = interpolateUrlTemplate(template, query);
  return appendMissingQueryParams(interpolated, query);
};

export const interpolateTeamRecommendationUrl = (template: string, params: TeamRecommendationParams): string => {
  const query = {
    entry_id: params.entryId,
    event_id: params.eventId,
    horizon_gws: params.horizonGws,
    chip_strategy: params.chipStrategy,
    chip_horizon_gws: params.chipHorizonGws,
    chip_play_event_id: params.chipPlayEventId,
    strategy: params.strategy,
    include_transfers: params.includeTransfers,
    apply_transfer_count: params.applyTransferCount,
    latest_n_matches: params.latestNMatches,
    free_transfers: params.freeTransfers,
    hit_cap: params.hitCap,
    panel_limit: params.panelLimit,
  };
  const interpolated = interpolateUrlTemplate(template, query);
  return appendMissingQueryParams(interpolated, query);
};

export const interpolateFixturesUrl = (template: string, params: FixturesParams): string => {
  const query = { event_id: params.eventId };
  const interpolated = interpolateUrlTemplate(template, query);
  return appendMissingQueryParams(interpolated, query);
};

const getEnvString = (key: string): string | undefined => {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const resolveTemplateWithApiBase = (template: string | undefined): string | undefined => {
  if (!template) return undefined;
  if (!template.startsWith("/")) return template;

  const apiBase = getEnvString("VITE_FPL_API_BASE_URL");
  if (!apiBase) return template;

  try {
    return new URL(template, apiBase).toString();
  } catch {
    return template;
  }
};

export const getSquadUrlTemplate = (): string | undefined =>
  resolveTemplateWithApiBase(getEnvString("VITE_FPL_SQUAD_URL"));

export const getFixturesUrlTemplate = (): string | undefined =>
  resolveTemplateWithApiBase(getEnvString("VITE_FPL_FIXTURES_URL"));

export const getNextEventUrlTemplate = (): string | undefined =>
  resolveTemplateWithApiBase(getEnvString("VITE_FPL_NEXT_EVENT_URL") ?? "/events/next");

export const getRecommendationUrlTemplate = (): string | undefined =>
  resolveTemplateWithApiBase(
    getEnvString("VITE_FPL_RECOMMENDATION_URL") ??
      getEnvString("VITE_FPL_TEAM_RECOMMENDATION_URL") ??
      "/recommendations?entry_id={entry_id}&event_id={event_id}&horizon_gws={horizon_gws}&include_transfers={include_transfers}"
  );

// Backwards-compatible name (older code uses this).
export const getTeamRecommendationUrlTemplate = getRecommendationUrlTemplate;

const parseJsonMaybe = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

const formatNetworkHint = (url: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "";
  const isMixedContent = protocol === "https:" && url.startsWith("http://");
  return isMixedContent
    ? "Your page is HTTPS but the API URL is HTTP (mixed-content is blocked). Use HTTPS for the API or run the frontend over HTTP."
    : `If this URL works in a tab but fails in fetch, it's usually CORS. Option A: allow Origin ${origin || "<your-frontend-origin>"} in FastAPI CORSMiddleware. Option B (Vite dev): use relative URLs like /squad and /recommendations with a Vite proxy. Option C (production): set VITE_FPL_API_BASE_URL and keep relative templates.`;
};

const parseJsonResponse = async (response: Response, url: string, endpointLabel: string): Promise<unknown> => {
  const body = await response.text();
  const parsed = parseJsonMaybe(body);
  if (typeof parsed !== "string") return parsed;

  const trimmed = parsed.trim();
  const lower = trimmed.toLowerCase();
  const looksLikeHtml = lower.startsWith("<!doctype") || lower.startsWith("<html");

  if (looksLikeHtml) {
    throw new Error(
      `Expected JSON from ${endpointLabel}, but received HTML. This usually means the request hit the frontend app instead of the backend API. In production set VITE_FPL_API_BASE_URL or use absolute VITE_FPL_*_URL values. URL: ${url}`
    );
  }

  throw new Error(`Invalid JSON from ${endpointLabel}: ${trimmed.slice(0, 240)}`);
};

type FixtureRecord = Record<string, unknown>;

const isFplTeamFixtureRecord = (value: unknown): value is FixtureRecord => {
  if (!isRecord(value)) return false;
  const team = value.team_short ?? value.team;
  const opponent = value.opponent_short ?? value.opponent;
  if (typeof team !== "string" || team.length === 0) return false;
  if (typeof opponent !== "string" || opponent.length === 0) return false;

  const difficulty = value.difficulty ?? value.fdr ?? value.fixture_difficulty;
  if (difficulty !== undefined && typeof difficulty !== "number") return false;

  const isHome = value.is_home ?? value.isHome ?? value.home;
  if (isHome !== undefined && typeof isHome !== "boolean") return false;

  return true;
};

const normalizeTeamFixture = (value: FixtureRecord): FplTeamFixture => {
  const difficultyRaw = value.difficulty ?? value.fdr ?? value.fixture_difficulty;
  const isHomeRaw = value.is_home ?? value.isHome ?? value.home;

  return {
    team_short: String((value.team_short ?? value.team) as string),
    opponent_short: String((value.opponent_short ?? value.opponent) as string),
    difficulty: typeof difficultyRaw === "number" ? difficultyRaw : undefined,
    is_home: typeof isHomeRaw === "boolean" ? isHomeRaw : undefined,
  };
};

export const fetchSquad = async (params: SquadParams, signal?: AbortSignal): Promise<FplSquad> => {
  const template = getSquadUrlTemplate();
  if (!template) return SAMPLE_SQUAD;

  const url = interpolateSquadUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching squad. ${hint} (${message})`);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch squad (${response.status})${suffix}`);
  }

  const data = await parseJsonResponse(response, url, "squad endpoint");
  if (!isFplSquad(data)) {
    throw new Error("Invalid squad response");
  }

  return data;
};

export const fetchFixtures = async (params: FixturesParams, signal?: AbortSignal): Promise<FplTeamFixture[]> => {
  const template = getFixturesUrlTemplate();
  if (!template) return [];

  const url = interpolateFixturesUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching fixtures. ${hint} (${message})`);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch fixtures (${response.status})${suffix}`);
  }

  const data: unknown = await parseJsonResponse(response, url, "fixtures endpoint");
  const fixturesRaw = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.fixtures)
      ? data.fixtures
      : undefined;

  if (!fixturesRaw) {
    throw new Error("Invalid fixtures response");
  }

  const fixtures: FplTeamFixture[] = fixturesRaw
    .filter(isFplTeamFixtureRecord)
    .map((fixture) => normalizeTeamFixture(fixture));

  return fixtures;
};

export const fetchNextEvent = async (signal?: AbortSignal): Promise<FplNextEventSummary> => {
  const template = getNextEventUrlTemplate();
  if (!template) {
    return {
      event_id: SAMPLE_SQUAD.event_id,
    };
  }

  let response: Response;
  try {
    response = await fetch(template, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(template);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching next event. ${hint} (${message})`);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch next event (${response.status})${suffix}`);
  }

  const data: unknown = await parseJsonResponse(response, template, "next event endpoint");
  if (!isFplNextEventSummary(data)) {
    throw new Error("Invalid next event response");
  }

  return data;
};

export const fetchTeamRecommendation = async (
  params: TeamRecommendationParams,
  signal?: AbortSignal
): Promise<FplTeamRecommendation> => {
  const template = getRecommendationUrlTemplate();
  if (!template) return SAMPLE_TEAM_RECOMMENDATION;

  const url = interpolateTeamRecommendationUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching team recommendation. ${hint} (${message})`);
  }
  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch team recommendation (${response.status})${suffix}`);
  }

  const data: unknown = await parseJsonResponse(response, url, "team recommendation endpoint");

  if (!isFplTeamRecommendation(data)) {
    throw new Error("Invalid team recommendation response");
  }

  return data;
};

// ============================================================================
// Phase 1 — /explain (LLM rationale for recommendations)
// Phase 2 — /league/list and /league/strategy (mini-league strategy)
// ============================================================================

export type ExplainTransfer = {
  out_id: number | null;
  in_id: number | null;
  rationale: string;
};

export type ExplainResponse = {
  transfers: ExplainTransfer[];
  captain: { player_id: number | null; rationale: string | null };
  chip: { name: string | null; rationale: string | null };
  model?: string;
  cached?: boolean;
  error?: string;
};

export const fetchExplanation = async (
  recommendations: unknown,
  signal?: AbortSignal
): Promise<ExplainResponse> => {
  const apiBase = getEnvString("VITE_FPL_API_BASE_URL") ?? "";
  const url = apiBase ? new URL("/explain", apiBase).toString() : "/explain";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recommendations }),
    signal,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to fetch explanation (${response.status}): ${body.slice(0, 200)}`);
  }
  return (await response.json()) as ExplainResponse;
};

/* ── Chat (Orchestrator agent) ───────────────────────────────────────────── */

export type ChatRequest = {
  entry_id: number;
  message: string;
  current_gw?: number;
  chips_remaining?: string[];
};

export type ChatResponse = {
  answer: string;
  current_gw: number;
  latency_ms: number;
};

export const fetchChatAnswer = async (
  req: ChatRequest,
  signal?: AbortSignal
): Promise<ChatResponse> => {
  const apiBase = getEnvString("VITE_FPL_API_BASE_URL") ?? "";
  const url = apiBase ? new URL("/chat", apiBase).toString() : "/chat";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Chat request failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return (await response.json()) as ChatResponse;
};

/* ── Fast specialist endpoints (skip orchestrator) ───────────────────────── */

export type SpecialistRequest = {
  entry_id: number;
  current_gw?: number;
  chips_remaining?: string[];
};

export type Specialist = "captain" | "transfer" | "chip";

export const fetchSpecialistAnswer = async (
  specialist: Specialist,
  req: SpecialistRequest,
  signal?: AbortSignal
): Promise<ChatResponse> => {
  const apiBase = getEnvString("VITE_FPL_API_BASE_URL") ?? "";
  const path = `/chat/${specialist}`;
  const url = apiBase ? new URL(path, apiBase).toString() : path;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Specialist request failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return (await response.json()) as ChatResponse;
};

export type LeagueSummary = {
  id: number;
  name: string;
  entry_rank: number | null;
  entry_last_rank: number | null;
  league_type?: string | null;
  scoring?: string | null;
  size?: number | null;
};

export const fetchUserLeagues = async (
  entryId: number,
  signal?: AbortSignal
): Promise<{ entry_id: number; leagues: LeagueSummary[] }> => {
  const apiBase = getEnvString("VITE_FPL_API_BASE_URL") ?? "";
  const path = `/league/list?entry_id=${encodeURIComponent(entryId)}`;
  const url = apiBase ? new URL(path, apiBase).toString() : path;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to fetch leagues (${response.status}): ${body.slice(0, 200)}`);
  }
  return (await response.json()) as { entry_id: number; leagues: LeagueSummary[] };
};

export type LeagueStrategyMode = "chase" | "defend" | "differential";

export type LeagueRivalEntry = {
  entry_id: number;
  player_name: string | null;
  entry_name: string | null;
  rank: number | null;
  last_rank: number | null;
  total: number | null;
  event_total: number | null;
};

export type LeagueStrategyCandidate = {
  id: number;
  web_name: string | null;
  team_short: string | null;
  position_id: number | null;
  now_cost: number | null;
  selected_by_percent: string | null;
  ep_next: string | number | null;
  form: string | null;
  model_xpts_horizon: number | null;
  model_xpts_per_gw: Record<string, number> | null;
  league_ownership: number | null;
};

export type LeagueStrategyNarrative = {
  headline?: string;
  key_gap?: string;
  recommended_targets?: Array<{ player_id: number; name?: string; rationale: string }>;
  watchouts?: string;
  model?: string;
  error?: string;
};

export type LeagueStrategyResponse = {
  mode: LeagueStrategyMode;
  league: { id: number; name: string };
  user: LeagueRivalEntry;
  rivals_above: LeagueRivalEntry[];
  rivals_below: LeagueRivalEntry[];
  differentials_count: {
    owned_by_me_not_rivals: number;
    owned_by_rivals_not_me: number;
    shared: number;
  };
  candidates: LeagueStrategyCandidate[];
  narrative: LeagueStrategyNarrative;
  projection_horizon_gws?: number;
  projection_error?: string;
  error?: string;
};

export const fetchLeagueStrategy = async (
  params: { entry_id: number; league_id: number; mode: LeagueStrategyMode; event_id?: number; horizon_gws?: number },
  signal?: AbortSignal
): Promise<LeagueStrategyResponse> => {
  const apiBase = getEnvString("VITE_FPL_API_BASE_URL") ?? "";
  const url = apiBase ? new URL("/league/strategy", apiBase).toString() : "/league/strategy";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to fetch league strategy (${response.status}): ${body.slice(0, 200)}`);
  }
  return (await response.json()) as LeagueStrategyResponse;
};
