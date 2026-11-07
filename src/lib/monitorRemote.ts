import { supabase } from "@/integrations/supabase/client";
import {
  parseMonitorReport,
  type MonitorCaptain,
  type MonitorHeadline,
  type MonitorReport,
  type MonitorState,
  type TransferVerdict,
  type WildcardVerdict,
} from "./monitorReport";

/** One gameweek of the season listing: the small part of a report the season
 *  tab needs, pulled with JSON-path columns so the page never loads every
 *  full report at once. */
export interface SeasonRow {
  season: string;
  gw: number;
  entry_id: number;
  state: MonitorState;
  built_at: string;
  headline: MonitorHeadline;
  transfers_verdict: TransferVerdict;
  wildcard_verdict: WildcardVerdict;
  captain: MonitorCaptain | null;
  app_projected: number | null;
  app_points_no_captain: number | null;
  chip_week: boolean;
}

export interface MonitorRemote {
  /** True when `monitor_owners` holds the user's row (RLS lets him read only his own). */
  isOwner(userId: string): Promise<boolean>;
  listSeason(): Promise<SeasonRow[]>;
  loadReport(season: string, entryId: number, gw: number): Promise<MonitorReport | null>;
}

const SEASON_SELECT = [
  "season",
  "gw",
  "entry_id",
  "built_at",
  "state:report->>state",
  "headline:report->headline",
  "transfers_verdict:report->transfers->>verdict",
  "wildcard_verdict:report->wildcard->>verdict",
  "captain:report->captain",
  "app_projected:report->app_xi->projected",
  "app_points_no_captain:report->app_xi->points_no_captain",
  "chip_week:report->transfers->chip_week",
].join(", ");

const STATES: readonly string[] = ["before_deadline", "live", "finished"];
const TRANSFER_VERDICTS: readonly string[] = ["app", "you", "level"];
const WILDCARD_VERDICTS: readonly string[] = ["app", "kept", "level"];

const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const verdict = <T extends string>(v: unknown, allowed: readonly string[]): T | null =>
  typeof v === "string" && allowed.includes(v) ? (v as T) : null;

function headlineOf(v: unknown): MonitorHeadline {
  const h = isObject(v) ? v : {};
  return {
    app: num(h.app),
    scout: num(h.scout),
    you: num(h.you),
    best: num(h.best),
    basis: h.basis === "with_captain" ? "with_captain" : "no_captain",
  };
}

/** Coerce one raw listing row; null when it cannot be placed on the season. */
export function seasonRowOf(raw: unknown): SeasonRow | null {
  if (!isObject(raw)) return null;
  const gw = num(raw.gw);
  const entry = num(raw.entry_id);
  if (gw === null || !Number.isInteger(gw) || entry === null) return null;
  if (typeof raw.state !== "string" || !STATES.includes(raw.state)) return null;
  return {
    season: String(raw.season ?? ""),
    gw,
    entry_id: entry,
    state: raw.state as MonitorState,
    built_at: String(raw.built_at ?? ""),
    headline: headlineOf(raw.headline),
    transfers_verdict: verdict<Exclude<TransferVerdict, null>>(raw.transfers_verdict, TRANSFER_VERDICTS),
    wildcard_verdict: verdict<Exclude<WildcardVerdict, null>>(raw.wildcard_verdict, WILDCARD_VERDICTS),
    captain: isObject(raw.captain) ? (raw.captain as unknown as MonitorCaptain) : null,
    app_projected: num(raw.app_projected),
    app_points_no_captain: num(raw.app_points_no_captain),
    chip_week: raw.chip_week === true,
  };
}

export const supabaseMonitorRemote: MonitorRemote = {
  async isOwner(userId) {
    const { data, error } = await supabase
      .from("monitor_owners")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },

  async listSeason() {
    const { data, error } = await supabase
      .from("monitor_reports")
      .select(SEASON_SELECT)
      .order("gw", { ascending: true })
      .returns<unknown[]>();
    if (error) throw error;
    return (data ?? []).map(seasonRowOf).filter((r): r is SeasonRow => r !== null);
  },

  async loadReport(season, entryId, gw) {
    const { data, error } = await supabase
      .from("monitor_reports")
      .select("report")
      .eq("season", season)
      .eq("entry_id", entryId)
      .eq("gw", gw)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return parseMonitorReport(data.report);
  },
};
