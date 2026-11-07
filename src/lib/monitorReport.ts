// Shape of one row of Supabase `monitor_reports.report`, built by the backend's
// `src/monitor_gw_report.py` (FPL-Assistant/FPL). The page reads it under RLS
// and never computes a total itself: every number shown comes from here.

export type MonitorState = "before_deadline" | "live" | "finished";

export type Unavailable = { available: false; reason: string; url?: string };

export type WindowKey = "1" | "3" | "5";
export type Window = { gain?: number; points?: number; played: number; complete: boolean };
export type Windows = Record<WindowKey, Window>;

export type Position = "GKP" | "DEF" | "MID" | "FWD";

export interface MonitorPlayer {
  name: string | null;
  club: string | null;
  pos: Position | null;
  points: number | null;
  minutes: number | null;
  xpts: number | null;
  price_m: number | null;
}

export type XiAvailable = {
  available: true;
  ids: number[];
  captain_id: number | null;
  vice_id: number | null;
  points_no_captain: number | null;
  points_with_captain: number | null;
  missing_points: number[];
  projected?: number | null;
  price_m?: number | null;
  model_version?: string | null;
  partial?: boolean;
  captain_stated?: boolean;
  captain_inferred_id?: number | null;
  needs_review?: boolean;
  unmatched?: string[];
  url?: string;
  published_at?: string;
};
export type XiBlock = XiAvailable | Unavailable;

export type YouAvailable = {
  available: true;
  ids: number[];
  xi_ids: number[];
  bench_ids: number[];
  captain_id: number | null;
  vice_id: number | null;
  chip: string | null;
  points: number | null;
  points_on_bench: number | null;
  transfer_cost: number | null;
};
export type YouBlock = YouAvailable | Unavailable;

export type BestXiBlock = { available: true; ids: number[]; points: number } | Unavailable;

export type Move = { sell_id: number; buy_id: number };

export type TransferSideAvailable = {
  available: true;
  moves: Move[];
  windows: Windows;
  hits?: number;
  action?: string;
  origin?: "replay" | "live";
};
export type TransferSide = TransferSideAvailable | Unavailable;

export type ListPlayer = { id: number; price_m: number | null; windows: Windows };
export type ListSideAvailable = {
  available: true;
  players: ListPlayer[];
  avg: Record<WindowKey, number | null>;
  avg_per_m: Record<WindowKey, number | null>;
  origin?: string;
  url?: string;
  needs_review?: boolean;
  unmatched?: string[];
};
export type ListSide = ListSideAvailable | Unavailable;

export type SquadWindowAvailable = {
  available?: true;
  ids: number[];
  points: number;
  played: number;
  complete: boolean;
  absent_by_gw: Record<string, number[]>;
  no_projection_gws: number[];
  url?: string;
};
export type SquadWindow = SquadWindowAvailable | Unavailable;

export type WildcardAppAvailable = {
  available: true;
  presets: Record<string, SquadWindowAvailable>;
  headline_preset: string;
  origin?: string;
  notes?: string[];
};
export type WildcardApp = WildcardAppAvailable | Unavailable;

export type CaptainLine = { id: number; points: number | null; stated?: boolean } | null;

export type TransferVerdict = "app" | "you" | "level" | null;
export type WildcardVerdict = "app" | "kept" | "level" | null;
export type HeadlineBasis = "no_captain" | "with_captain";

export interface MonitorHeadline {
  app: number | null;
  scout: number | null;
  you: number | null;
  best: number | null;
  basis: HeadlineBasis;
}

export interface MonitorCaptain {
  app_for_you: CaptainLine;
  scout: CaptainLine;
  you: CaptainLine;
  best_in_squad: CaptainLine;
  best_overall: CaptainLine;
}

export interface MonitorReport {
  season: string;
  gw: number;
  entry_id: number;
  state: MonitorState;
  app_xi: XiBlock;
  scout_xi: XiBlock;
  you: YouBlock;
  best_xi: BestXiBlock;
  headline: MonitorHeadline;
  captain: MonitorCaptain;
  transfers: {
    chip_week: boolean;
    verdict_window: number;
    verdict: TransferVerdict;
    app: TransferSide;
    you: TransferSide;
  };
  buy_lists: { app: ListSide; scout: ListSide };
  wildcard: {
    window: number;
    kept: SquadWindow;
    app: WildcardApp;
    scout: SquadWindow;
    actual: { played: number; points: number } | null;
    verdict: WildcardVerdict;
  };
  replay: {
    notes: string[];
    parity: { status: string; n: number; mae: number | null; corr: number | null };
    dropped_squad_ids: number[];
  };
  players: Record<string, MonitorPlayer>;
}

const STATES: readonly string[] = ["before_deadline", "live", "finished"];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Runtime gate for a `report` JSON column. Checks only what the page relies on
 * to render at all (gameweek, state, headline, players); every section is
 * typed as "available or a reason" and read defensively by the view layer.
 * Returns null for a row from an older job or a hand edit rather than crashing.
 */
export function parseMonitorReport(json: unknown): MonitorReport | null {
  if (!isObject(json)) return null;
  const gw = json.gw;
  if (typeof gw !== "number" || !Number.isInteger(gw)) return null;
  if (typeof json.state !== "string" || !STATES.includes(json.state)) return null;
  if (!isObject(json.players)) return null;
  if (!isObject(json.headline)) return null;
  const sections = ["app_xi", "scout_xi", "you", "best_xi", "captain", "transfers", "buy_lists", "wildcard", "replay"];
  for (const key of sections) {
    if (!isObject(json[key])) return null;
  }
  // Every array the page maps over must be an array when its block is available.
  const arr = (o: Record<string, unknown>, keys: string[]) => keys.every((k) => Array.isArray(o[k]));
  const avail = (o: Record<string, unknown>, keys: string[]) => o.available === false || arr(o, keys);
  const app_xi = json.app_xi as Record<string, unknown>;
  const scout_xi = json.scout_xi as Record<string, unknown>;
  const you = json.you as Record<string, unknown>;
  const best_xi = json.best_xi as Record<string, unknown>;
  const replay = json.replay as Record<string, unknown>;
  const transfers = json.transfers as Record<string, unknown>;
  const buy_lists = json.buy_lists as Record<string, unknown>;
  const wildcard = json.wildcard as Record<string, unknown>;
  if (!avail(app_xi, ["ids"]) || !avail(scout_xi, ["ids"]) || !avail(you, ["xi_ids", "bench_ids"]) || !avail(best_xi, ["ids"])) return null;
  if (!arr(replay, ["notes", "dropped_squad_ids"]) || !isObject(replay.parity)) return null;
  for (const side of [transfers.app, transfers.you]) {
    if (!isObject(side) || !avail(side, ["moves"]) || (side.available !== false && !isObject(side.windows))) return null;
  }
  for (const side of [buy_lists.app, buy_lists.scout]) {
    if (!isObject(side) || !avail(side, ["players"])) return null;
  }
  for (const key of ["kept", "scout", "app"]) {
    if (!isObject(wildcard[key])) return null;
  }
  const wapp = wildcard.app as Record<string, unknown>;
  if (wapp.available !== false && !isObject(wapp.presets)) return null;
  for (const sq of [wildcard.kept, wildcard.scout, ...(wapp.available !== false ? Object.values(wapp.presets as object) : [])]) {
    if (!isObject(sq) || !avail(sq, ["ids"])) return null;
  }
  return json as unknown as MonitorReport;
}

const EMPTY_PLAYER: Omit<MonitorPlayer, "name"> = {
  club: null,
  pos: null,
  points: null,
  minutes: null,
  xpts: null,
  price_m: null,
};

/** The report's record for a player id; `#id` with null fields when the row
 *  does not describe him (older row, hand edit). */
export function playerOf(report: MonitorReport, id: number): MonitorPlayer {
  const row = report.players[String(id)];
  if (!row) return { name: `#${id}`, ...EMPTY_PLAYER };
  return { ...EMPTY_PLAYER, ...row, name: row.name ?? `#${id}` };
}
