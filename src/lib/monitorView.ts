// Pure view models for the monitor page. Everything here is derived from one
// stored report (or the season listing); nothing is fetched or summed anew —
// totals are the report's, cards are per player.
import {
  playerOf,
  type MonitorPlayer,
  type MonitorReport,
  type MonitorState,
  type TransferVerdict,
  type WildcardVerdict,
  type XiAvailable,
  type YouAvailable,
} from "./monitorReport";
import type { SeasonRow } from "./monitorRemote";

export type Tone = "app" | "scout" | "you";

/** The scoring windows every contest is reported over, as the report keys them. */
export const WINDOW_KEYS = ["1", "3", "5"] as const;

export interface CardModel {
  id: number;
  name: string;
  club: string;
  pos: MonitorPlayer["pos"];
  /** Real points, doubled when this card carries the armband on a doubled column; null before points exist. */
  points: number | null;
  xpts: number | null;
  isCaptain: boolean;
  isVice: boolean;
  doubled: boolean;
  /** Also in the app's eleven (never set on the app column itself). */
  shared: boolean;
  /** Did not play (0 minutes) in a started gameweek. */
  faded: boolean;
}

export interface PitchModel {
  tone: Tone;
  title: string;
  subtitle: string;
  total: number | null;
  totalNote: string | null;
  /** The other basis, e.g. "72 with captain" on a week whose headline excludes captains. */
  totalAlt: string | null;
  rows: CardModel[][];
  bench: CardModel[];
  unavailable: string | null;
}

const TITLES: Record<Tone, string> = { app: "App best XI", scout: "Scout Selection", you: "Your team" };
const POS_ORDER: NonNullable<MonitorPlayer["pos"]>[] = ["GKP", "DEF", "MID", "FWD"];
const CHIP_NAMES: Record<string, string> = {
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
  "3xc": "Triple Captain",
};

/** FPL's chip code as a name; the code itself when unknown. */
export const chipName = (chip: string | null | undefined): string | null =>
  chip ? (Object.prototype.hasOwnProperty.call(CHIP_NAMES, chip) ? CHIP_NAMES[chip] : chip) : null;

const fmtPrice = (m: number | null | undefined) => (typeof m === "number" ? `£${m.toFixed(1)}m` : null);
const joinNotes = (...parts: (string | null)[]) => parts.filter((x): x is string => !!x).join(" · ") || null;

const MINUS = "−";

/** "+15", "−13", "0", "—". */
export function fmtGain(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  return n > 0 ? `+${n}` : `${MINUS}${Math.abs(n)}`;
}

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

/**
 * Which player carries the doubled score: the captain, or the vice when the
 * captain did not play and the vice did (FPL's rule). Null with no captain.
 */
export function doubledId(
  xi: { captain_id: number | null; vice_id: number | null },
  report: MonitorReport,
): number | null {
  const captain = xi.captain_id;
  if (captain === null || captain === undefined) return null;
  const vice = xi.vice_id;
  if (vice === null || vice === undefined) return captain;
  const cMin = playerOf(report, captain).minutes;
  const vMin = playerOf(report, vice).minutes;
  if (cMin === 0 && typeof vMin === "number" && vMin > 0) return vice;
  return captain;
}

const started = (state: MonitorState) => state !== "before_deadline";

function card(
  report: MonitorReport,
  id: number,
  ctx: { captainId: number | null; viceId: number | null; doubled: number | null; multiplier: number; appIds: Set<number>; tone: Tone },
): CardModel {
  const p = playerOf(report, id);
  const doubled = ctx.doubled === id;
  const points = typeof p.points === "number" ? (doubled ? p.points * ctx.multiplier : p.points) : null;
  return {
    id,
    name: p.name ?? `#${id}`,
    club: p.club ?? "—",
    pos: p.pos,
    points,
    xpts: p.xpts,
    isCaptain: ctx.captainId === id,
    isVice: ctx.viceId === id,
    doubled,
    shared: ctx.tone !== "app" && ctx.appIds.has(id),
    faded: started(report.state) && p.minutes === 0,
  };
}

function formationRows(cards: CardModel[]): CardModel[][] {
  const rows = POS_ORDER.map((pos) => cards.filter((c) => c.pos === pos));
  const unknown = cards.filter((c) => !c.pos || !POS_ORDER.includes(c.pos));
  if (unknown.length) rows[rows.length - 1].push(...unknown);
  return rows;
}

const unavailableModel = (tone: Tone, reason: string): PitchModel => ({
  tone,
  title: TITLES[tone],
  subtitle: "",
  total: null,
  totalNote: null,
  totalAlt: null,
  rows: [],
  bench: [],
  unavailable: reason,
});

/** One coloured pitch from a report. The total is the column's headline value
 *  (same basis across the three columns); a card is doubled only on a column
 *  whose total includes the armband: you always, app and Scout when the
 *  headline basis is with_captain. */
export function pitchModel(report: MonitorReport, tone: Tone): PitchModel {
  const appIds = new Set(report.app_xi.available ? report.app_xi.ids : []);
  const block = tone === "app" ? report.app_xi : tone === "scout" ? report.scout_xi : report.you;
  if (block.available === false) return unavailableModel(tone, block.reason);

  const columnDoubles = tone === "you" || report.headline.basis === "with_captain";
  let captainId: number | null;
  let xiIds: number[];
  let benchIds: number[] = [];
  let subtitle: string;
  let totalNote: string | null = null;
  let totalAlt: string | null = null;
  let total: number | null;
  let multiplier = 2;

  if (tone === "you") {
    const you = block as YouAvailable;
    captainId = you.captain_id;
    xiIds = you.xi_ids;
    benchIds = you.bench_ids;
    const chip = chipName(you.chip);
    subtitle = chip ? `${chip} played` : "as picked";
    if (you.chip === "3xc") multiplier = 3;
    total = report.headline.you;
    if (typeof you.points_on_bench === "number") totalNote = `${you.points_on_bench} on bench`;
  } else {
    const xi = block as XiAvailable;
    captainId = xi.captain_id ?? xi.captain_inferred_id ?? null;
    xiIds = xi.ids;
    // The headline leaves captains out on a week the Scout did not state his;
    // the with-captain figure is still worth a glance.
    if (report.headline.basis === "no_captain" && typeof xi.points_with_captain === "number") {
      totalAlt = `${xi.points_with_captain} with captain`;
    }
    if (tone === "app") {
      subtitle = "best eleven from the app's projections";
      total = report.headline.app;
      totalNote = joinNotes(typeof xi.projected === "number" ? `projected ${xi.projected.toFixed(1)}` : null, fmtPrice(xi.price_m));
    } else {
      const when = xi.published_at ? fmtDate(xi.published_at) : "";
      const inferred = xi.captain_id === null && xi.captain_inferred_id !== null && xi.captain_inferred_id !== undefined;
      subtitle = joinNotes(when ? `published ${when}, premierleague.com` : "premierleague.com", inferred ? "captain inferred" : null) ?? "";
      if (xi.partial) {
        total = null;
        totalNote = joinNotes("partial", fmtPrice(xi.price_m));
      } else {
        total = report.headline.scout;
        totalNote = fmtPrice(xi.price_m);
      }
    }
  }

  const doubled = columnDoubles && started(report.state) ? doubledId({ captain_id: block.captain_id, vice_id: block.vice_id }, report) : null;
  const ctx = { captainId, viceId: block.vice_id, doubled, multiplier, appIds, tone };
  const cards = xiIds.map((id) => card(report, id, ctx));
  return {
    tone,
    title: TITLES[tone],
    subtitle,
    total,
    totalNote,
    totalAlt,
    rows: formationRows(cards),
    bench: benchIds.map((id) => card(report, id, ctx)),
    unavailable: null,
  };
}

export function bestStrip(report: MonitorReport): { points: number | null; names: string[]; reason: string | null } {
  const b = report.best_xi;
  if (b.available === false) return { points: null, names: [], reason: b.reason };
  return { points: b.points, names: b.ids.map((id) => playerOf(report, id).name ?? `#${id}`), reason: null };
}

/** "You, over 3 gameweeks" | "App, over 3 gameweeks" | "Kept squad, over 5 gameweeks" |
 *  "Level over 3 gameweeks" | "Open (1 of 3 played)" | "No verdict". */
export function verdictLabel(v: TransferVerdict | WildcardVerdict, window: number, played: number): string {
  const over = `over ${window} gameweeks`;
  switch (v) {
    case "you":
      return `You, ${over}`;
    case "app":
      return `App, ${over}`;
    case "kept":
      return `Kept squad, ${over}`;
    case "level":
      return `Level ${over}`;
    default:
      return played >= window ? "No verdict" : `Open (${played} of ${window} played)`;
  }
}

export interface SeasonRowModel {
  gw: number;
  state: MonitorState;
  app: number | null;
  scout: number | null;
  you: number | null;
  best: number | null;
  closer: "app" | "scout" | "level" | null;
  runApp: number;
  runScout: number;
  runYou: number;
  /** Both the app and the Scout have a total this gameweek, so it enters the running totals. */
  counted: boolean;
  transfersVerdict: TransferVerdict;
  wildcardVerdict: WildcardVerdict;
  chipWeek: boolean;
  /** Your captain was the best pick in your squad; null when either is unknown. */
  captainHit: boolean | null;
  /** app projected − app points (no captain), finished gameweeks with an app column only. */
  projectionError: number | null;
}

export function seasonRows(rows: SeasonRow[], entryId: number, season: string): SeasonRowModel[] {
  const mine = rows.filter((r) => r.entry_id === entryId && r.season === season).sort((a, b) => a.gw - b.gw);
  let runApp = 0;
  let runScout = 0;
  let runYou = 0;
  return mine.map((r) => {
    const { app, scout, you, best } = r.headline;
    const counted = app !== null && scout !== null;
    if (counted) {
      runApp += app;
      runScout += scout;
    }
    if (you !== null) runYou += you;
    const closer = !counted ? null : app > scout ? "app" : scout > app ? "scout" : "level";
    const yc = r.captain?.you?.id ?? null;
    const bc = r.captain?.best_in_squad?.id ?? null;
    const captainHit = yc === null || bc === null ? null : yc === bc;
    const projectionError =
      r.state === "finished" && r.app_projected !== null && r.app_points_no_captain !== null
        ? r.app_projected - r.app_points_no_captain
        : null;
    return {
      gw: r.gw,
      state: r.state,
      app,
      scout,
      you,
      best,
      closer,
      runApp,
      runScout,
      runYou,
      counted,
      transfersVerdict: r.transfers_verdict,
      wildcardVerdict: r.wildcard_verdict,
      chipWeek: r.chip_week,
      captainHit,
      projectionError,
    };
  });
}

export interface SeasonSummary {
  transfers: { app: number; you: number; level: number; open: number };
  captain: { hits: number; of: number };
  wildcard: { app: number; kept: number; level: number; open: number };
  projection: { meanSigned: number | null; meanAbs: number | null; n: number };
}

export function seasonSummary(rows: SeasonRowModel[]): SeasonSummary {
  const transfers = { app: 0, you: 0, level: 0, open: 0 };
  const wildcard = { app: 0, kept: 0, level: 0, open: 0 };
  const captain = { hits: 0, of: 0 };
  const errors: number[] = [];
  for (const r of rows) {
    // A verdict can only be pending where the app had advice (an app total
    // exists) and the gameweek has finished; a chip week has no transfer contest.
    const advised = r.state === "finished" && r.app !== null;
    if (r.transfersVerdict) transfers[r.transfersVerdict] += 1;
    else if (advised && !r.chipWeek) transfers.open += 1;
    if (r.wildcardVerdict) wildcard[r.wildcardVerdict] += 1;
    else if (advised) wildcard.open += 1;
    if (r.captainHit !== null) {
      captain.of += 1;
      if (r.captainHit) captain.hits += 1;
    }
    if (r.projectionError !== null) errors.push(r.projectionError);
  }
  const n = errors.length;
  return {
    transfers,
    captain,
    wildcard,
    projection: {
      n,
      meanSigned: n ? errors.reduce((a, b) => a + b, 0) / n : null,
      meanAbs: n ? errors.reduce((a, b) => a + Math.abs(b), 0) / n : null,
    },
  };
}

/** Resolve the entry and gameweek the URL asks for against what the listing holds. */
export function resolveSelection(allRows: SeasonRow[], wantEntry: number | null, wantGw: number | null) {
  // One season at a time: the latest one listed. Without this, August's new
  // rows would sit beside last season's under the same gameweek numbers.
  const season = allRows.reduce<string | null>((best, r) => (best === null || r.season > best ? r.season : best), null);
  const rows = allRows.filter((r) => r.season === season);
  const entries = [...new Set(rows.map((r) => r.entry_id))].sort((a, b) => a - b);
  const entryId = wantEntry !== null && entries.includes(wantEntry) ? wantEntry : (entries[0] ?? null);
  const gws = rows
    .filter((r) => r.entry_id === entryId)
    .map((r) => r.gw)
    .sort((a, b) => a - b);
  const gw = wantGw !== null && gws.includes(wantGw) ? wantGw : (gws[gws.length - 1] ?? null);
  return { entries, entryId, gws, gw, season };
}
