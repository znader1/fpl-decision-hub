import {
  CHIP_LABELS,
  type ChipName,
  type FplPosition,
  type FplSquad,
  type FplTeamRecommendation,
  type FplTeamRecommendationPlayer,
  type FplTransferVerdictMove,
} from "./fplAssistantApi";

/**
 * The single client-side plan for one gameweek (v2 flow handoff §1). Every
 * step reads and writes this; nothing rebuilds the squad from the server.
 * Chips use the canonical vocabulary (never bb/fh/tc) — see CLAUDE.md.
 */
export type PlanStep = "squad" | "transfers" | "captain" | "bench" | "chip" | "confirm";
export const PLAN_STEPS: PlanStep[] = ["squad", "transfers", "captain", "bench", "chip", "confirm"];
export const STEP_LABELS: Record<PlanStep, string> = {
  squad: "Squad",
  transfers: "Transfers",
  captain: "Captain",
  bench: "Bench",
  chip: "Chip",
  confirm: "Review",
};
export type PlanDecisionKey = Exclude<PlanStep, "squad" | "confirm">;
export const isPlanStep = (v: string | undefined): v is PlanStep => PLAN_STEPS.includes(v as PlanStep);

export type PlanChip = "none" | ChipName | null;

export interface GwPlan {
  /** 11 starters, as the user has them (not the optimiser's XI). */
  xi: number[];
  /** [GK, sub1, sub2, sub3]. */
  bench: number[];
  /** Ties to `verdict_detail`: "make" applies its moves, "roll" banks the FT. */
  transfer: "make" | "roll" | null;
  cap: number;
  vice: number;
  chip: PlanChip;
  reviewed: Partial<Record<PlanDecisionKey, true>>;
  /** "Saved". Any material edit clears it. */
  locked: boolean;
  /** Set when "make" started a benched seller's buy over the weakest legal
   *  starter (plan ids); "roll" / undecided swaps them back. Absent on older plans. */
  promoted?: { seller: number; starter: number; buy?: number; rule?: 2 } | null;
  /** A runner-up ("Also considered") the user chose over ZN Pick's move; "make"
   *  applies it instead of the verdict's moves. Null / absent = ZN Pick's move. */
  pick?: { sell: number; buy: number } | null;
}

export type PlanPatch = Partial<GwPlan> | ((plan: GwPlan) => Partial<GwPlan>);

const NON_MATERIAL: ReadonlySet<keyof GwPlan> = new Set(["reviewed", "locked"]);

export function seedPlan(squad: FplSquad): GwPlan {
  const xi = squad.starting_xi.map((p) => p.player_id);
  // FPL keeps the reserve keeper in the first bench slot; some payloads order
  // him last, so pin him by position and sort only the outfield subs.
  const sorted = [...squad.bench].sort((a, b) => a.bench_order - b.bench_order);
  const bench = [...sorted.filter((p) => p.pos === "GKP"), ...sorted.filter((p) => p.pos !== "GKP")].map((p) => p.player_id);
  const all = [...squad.starting_xi, ...squad.bench];
  const cap = squad.captain_player_id ?? all.find((p) => p.is_captain)?.player_id ?? xi[0];
  const vice = squad.vice_player_id ?? all.find((p) => p.is_vice_captain)?.player_id ?? xi.find((id) => id !== cap) ?? xi[0];
  return { xi, bench, transfer: null, cap, vice, chip: null, reviewed: {}, locked: false };
}

/** Merge a patch; a material change (anything but reviewed/locked) reopens a saved plan. */
export function applyPatch(plan: GwPlan, patch: PlanPatch): GwPlan {
  const p = typeof patch === "function" ? patch(plan) : patch;
  const material = (Object.keys(p) as (keyof GwPlan)[]).some((k) => !NON_MATERIAL.has(k));
  const next = { ...plan, ...p };
  return material ? { ...next, locked: false } : next;
}

/** The plan still describes this squad (the user hasn't transferred in the FPL app since it was seeded). */
export function samePlayers(plan: GwPlan, squad: FplSquad): boolean {
  const a = [...plan.xi, ...plan.bench].sort((x, y) => x - y);
  const b = [...squad.starting_xi, ...squad.bench].map((p) => p.player_id).sort((x, y) => x - y);
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

// ---- lineup rules -----------------------------------------------------------

const MIN_BY_POS: Partial<Record<FplPosition, [number, string]>> = {
  DEF: [3, "You need at least 3 defenders."],
  MID: [2, "You need at least 2 midfielders."],
  FWD: [1, "You need at least 1 forward."],
};

/** Null when `benchId` may replace `starterId` in `xi`; otherwise the rule that stops it. */
export function swapCheck(xi: number[], benchId: number, starterId: number, posOf: (id: number) => FplPosition): string | null {
  const bp = posOf(benchId);
  const sp = posOf(starterId);
  if ((bp === "GKP") !== (sp === "GKP")) return "Goalkeepers can only swap with goalkeepers.";
  const counts: Partial<Record<FplPosition, number>> = {};
  for (const id of xi) {
    const pos = id === starterId ? bp : posOf(id);
    counts[pos] = (counts[pos] ?? 0) + 1;
  }
  for (const [pos, [min, msg]] of Object.entries(MIN_BY_POS) as [FplPosition, [number, string]][]) {
    if ((counts[pos] ?? 0) < min) return msg;
  }
  return null;
}

export function swapPlayers(plan: GwPlan, benchId: number, starterId: number): GwPlan {
  return {
    ...plan,
    xi: plan.xi.map((id) => (id === starterId ? benchId : id)),
    bench: plan.bench.map((id) => (id === benchId ? starterId : id)),
  };
}

/** Move the sub at `index` by `dir` (±1). The GK slot (0) is pinned, the ends stop. */
export function moveBench(plan: GwPlan, index: number, dir: -1 | 1): GwPlan {
  const to = index + dir;
  if (index <= 0 || to <= 0 || to >= plan.bench.length) return plan;
  const bench = [...plan.bench];
  [bench[index], bench[to]] = [bench[to], bench[index]];
  return { ...plan, bench };
}

// ---- transfers --------------------------------------------------------------

/** FPL's XI limits per outfield position (1 GKP is fixed). */
const XI_LIMITS: Record<Exclude<FplPosition, "GKP">, [number, number]> = { DEF: [3, 5], MID: [2, 5], FWD: [1, 3] };

/**
 * The starter a promoted buy replaces: the weakest (this-GW xPts) non-captain
 * starter whose removal, with a `buyPos` player added, leaves a legal XI. Any
 * outfield position qualifies — a FWD buy can push out a MID — so the user's
 * best starters stay on (user testing, GW11: Evanilson pushed out Barry, not
 * Schade). A GKP buy only replaces the GKP. Undefined when nothing fits.
 */
export function promotionStarter(
  xi: number[],
  buyPos: FplPosition,
  cap: number,
  lookup: PlayerLookup,
  /** Plan id → id on screen (a sold starter shows as his buy); ranks by the shown player. */
  shown: (id: number) => number = (id) => id,
): number | undefined {
  const posOf = (id: number) => lookup[id]?.pos;
  const xp = (id: number) => lookup[shown(id)]?.xpts ?? Infinity;
  const counts: Partial<Record<FplPosition, number>> = {};
  for (const id of xi) {
    const pos = posOf(id);
    if (pos) counts[pos] = (counts[pos] ?? 0) + 1;
  }
  const legal = (out: FplPosition) => {
    if (buyPos === "GKP" || out === "GKP") return buyPos === out;
    const after = { ...counts };
    after[out] = (after[out] ?? 0) - 1;
    after[buyPos] = (after[buyPos] ?? 0) + 1;
    return (Object.entries(XI_LIMITS) as [FplPosition, [number, number]][]).every(([pos, [lo, hi]]) => {
      const n = after[pos] ?? 0;
      return n >= lo && n <= hi;
    });
  };
  return xi
    .filter((id) => id !== cap && posOf(id) !== undefined && legal(posOf(id)!))
    .sort((a, b) => xp(a) - xp(b))[0];
}

/**
 * The plan patch for a transfer decision. A buy is meant to play, so "make"
 * starts a benched seller's buy over `promotionStarter` (weakest legal
 * non-captain starter, any outfield position); leaving "make" swaps that
 * pair back if the user hasn't moved them since.
 */
export function transferChoicePatch(
  plan: GwPlan,
  choice: GwPlan["transfer"],
  moves: FplTransferVerdictMove[],
  lookup: PlayerLookup,
): Partial<GwPlan> {
  let { xi, bench } = plan;
  let promoted = plan.promoted ?? null;
  if (promoted && choice !== "make") {
    if (xi.includes(promoted.seller) && bench.includes(promoted.starter)) {
      ({ xi, bench } = swapPlayers(plan, promoted.starter, promoted.seller));
    }
    promoted = null;
  }
  if (choice === "make" && !promoted) {
    const swap = new Map(moves.map((m) => [m.sell.id, m.buy.id]));
    const shown = (id: number) => swap.get(id) ?? id;
    for (const m of moves) {
      if (!bench.includes(m.sell.id) || bench[0] === m.sell.id) continue;
      // A transfer is bought to play (user testing, 2026-11): the buy starts
      // whatever this week's projection says, over the weakest same-position starter.
      const pos = lookup[m.buy.id]?.pos ?? (m.position as FplPosition | undefined) ?? lookup[m.sell.id]?.pos;
      if (!pos) continue;
      const weakest = promotionStarter(xi, pos, plan.cap, lookup, shown);
      if (weakest === undefined) continue;
      ({ xi, bench } = swapPlayers({ ...plan, xi, bench }, m.sell.id, weakest));
      promoted = { seller: m.sell.id, starter: weakest, buy: m.buy.id, rule: 2 };
      break;
    }
  }
  return { transfer: choice, xi, bench, promoted };
}

/**
 * Keeps a "make" plan's promotion in step with the moves on screen: a rerun
 * (horizon change, new recommendation) may bring a different move, and a plan
 * saved before promotions existed has none. Null when nothing needs to change.
 */
export function reconcilePromotion(plan: GwPlan, moves: FplTransferVerdictMove[], lookup: PlayerLookup): Partial<GwPlan> | null {
  if (plan.transfer !== "make" || moves.length === 0) return null;
  const pr = plan.promoted;
  if (pr && moves.some((m) => m.sell.id === pr.seller && (pr.buy === undefined || m.buy.id === pr.buy))) {
    // Same move. A promotion made under the old same-position rule (no `rule`
    // tag) may have benched the wrong starter: re-pick it once, and only while
    // the user hasn't touched that pair. Tagged promotions are never re-picked,
    // so later lineup edits are the user's to keep.
    if (pr.rule === 2) return null;
    if (!plan.xi.includes(pr.seller) || !plan.bench.includes(pr.starter)) return null;
    const move = moves.find((m) => m.sell.id === pr.seller)!;
    const pos = lookup[move.buy.id]?.pos ?? (move.position as FplPosition | undefined) ?? lookup[pr.seller]?.pos;
    if (!pos) return null;
    const undone = swapPlayers(plan, pr.starter, pr.seller);
    const swap = new Map(moves.map((m) => [m.sell.id, m.buy.id]));
    const want = promotionStarter(undone.xi, pos, plan.cap, lookup, (id) => swap.get(id) ?? id);
    if (want === undefined || want === pr.starter) return null;
    const { xi, bench } = swapPlayers(undone, pr.seller, want);
    return { xi, bench, promoted: { ...pr, starter: want, rule: 2 } };
  }
  // A promotion the user already undid by hand (seller back on the bench) is theirs to keep.
  const base = pr ? { ...plan, ...transferChoicePatch(plan, null, moves, lookup), transfer: plan.transfer } : plan;
  const next = transferChoicePatch(base, "make", moves, lookup);
  const same =
    next.promoted?.seller === pr?.seller &&
    next.promoted?.starter === pr?.starter &&
    next.xi!.every((id, i) => id === plan.xi[i]) &&
    next.bench!.every((id, i) => id === plan.bench[i]);
  return same ? null : next;
}

/** Outfield subs ordered by this week's xPts (GK slot pinned): the bench order
 *  ZN Pick would set. Plan ids in, plan ids out; `xptsOf` reads the shown player. */
export function suggestedBench(bench: number[], xptsOf: (planId: number) => number | undefined): number[] {
  const [gk, ...subs] = bench;
  return [gk, ...[...subs].sort((a, b) => (xptsOf(b) ?? -Infinity) - (xptsOf(a) ?? -Infinity))];
}

/** The moves "Make the move" applies: the verdict's on spend, the rejected walk's
 *  on roll, or the one runner-up the user picked instead. */
export function makeMoves(rec: FplTeamRecommendation | undefined, pick?: GwPlan["pick"]): FplTransferVerdictMove[] {
  const d = rec?.transfer_plan_horizon?.verdict_detail;
  if (!d) return [];
  if (pick) {
    const alt = (d.runner_ups ?? []).find((m) => m.sell.id === pick.sell && m.buy.id === pick.buy);
    if (alt) return [alt];
  }
  return d.action === "roll" ? d.roll_alternative?.moves ?? [] : d.moves;
}

/** The plan's runner-up pick is gone from a fresh recommendation (a rerun ranked
 *  other moves): "make" would silently apply ZN Pick's move under a stale pick. */
export function pickIsStale(plan: GwPlan, rec: FplTeamRecommendation | undefined): boolean {
  const d = rec?.transfer_plan_horizon?.verdict_detail;
  if (!plan.pick || !d) return false;
  return !(d.runner_ups ?? []).some((m) => m.sell.id === plan.pick!.sell && m.buy.id === plan.pick!.buy);
}

/** The hit a "make" plan pays: the verdict's own, or −4 for a runner-up with no FT left. */
export function planHitCost(plan: GwPlan, rec: FplTeamRecommendation | undefined): number {
  const d = rec?.transfer_plan_horizon?.verdict_detail;
  if (!d) return 0;
  return plan.pick ? (d.ft_before === 0 ? 4 : 0) : d.hit_cost;
}

/**
 * The plan patch for picking a transfer card: ZN Pick's move, a runner-up
 * (`pick`), "roll" or undecided. Undoes the old move's promotion before
 * applying the new one, so switching between moves never strands a starter.
 */
export function transferPickPatch(
  plan: GwPlan,
  choice: GwPlan["transfer"],
  pick: GwPlan["pick"],
  rec: FplTeamRecommendation | undefined,
  lookup: PlayerLookup,
): Partial<GwPlan> {
  const cleared = { ...plan, ...transferChoicePatch(plan, null, [], lookup) };
  const nextPick = choice === "make" ? pick ?? null : null;
  return { ...transferChoicePatch(cleared, choice, makeMoves(rec, nextPick), lookup), pick: nextPick };
}

export interface ResolvedPlan {
  xi: number[];
  bench: number[];
  cap: number;
  vice: number;
  /** Incoming players → this-GW gain of the move that brought them in (the "IN" pill). */
  incoming: Record<number, number>;
}

/** The plan with its transfer decision applied: sell → buy everywhere. */
export function resolvePlan(plan: GwPlan, moves: FplTransferVerdictMove[], lookup?: PlayerLookup): ResolvedPlan {
  if (plan.transfer !== "make" || moves.length === 0) {
    return { xi: plan.xi, bench: plan.bench, cap: plan.cap, vice: plan.vice, incoming: {} };
  }
  const swap = new Map(moves.map((m) => [m.sell.id, m.buy.id]));
  const sub = (id: number) => swap.get(id) ?? id;
  const incoming: Record<number, number> = {};
  // The pill shows what the pitch gained: buy minus whoever he actually
  // replaced in the XI (the promoted starter, else the seller). Without a
  // lookup, or with a buy still on the bench, the engine's estimate stands.
  const x = (id: number) => lookup?.[id]?.xpts;
  for (const m of moves) {
    const pr = plan.promoted;
    const replaced = pr && pr.seller === m.sell.id && plan.xi.includes(pr.seller) && plan.bench.includes(pr.starter) ? pr.starter : plan.xi.includes(m.sell.id) ? m.sell.id : undefined;
    const buyX = x(m.buy.id);
    const outX = replaced !== undefined ? x(replaced) : undefined;
    incoming[m.buy.id] = typeof buyX === "number" && typeof outX === "number" ? buyX - outX : m.this_gw_gain;
  }
  return { xi: plan.xi.map(sub), bench: plan.bench.map(sub), cap: sub(plan.cap), vice: sub(plan.vice), incoming };
}

/** The id the plan stores for a player on screen: a buy maps back to the seller
 *  he replaced, so a later "roll" leaves the lineup edits intact. */
export const toPlanId = (id: number, moves: FplTransferVerdictMove[]) => moves.find((m) => m.buy.id === id)?.sell.id ?? id;

// ---- player records ---------------------------------------------------------

export type PlayerLookup = Record<number, FplTeamRecommendationPlayer>;

/**
 * Every player the plan might show, by id. Recommendation records win (they
 * carry the plan GW's xPts; the squad's are for the GW on screen), then the
 * applied-step squads (real records for the buys), then a record synthesised
 * from the move itself for a buy no step squad carries — its xPts is the
 * seller's plus the move's this-GW gain, an estimate.
 */
export function buildPlayerLookup(squad: FplSquad | undefined, rec: FplTeamRecommendation | undefined): PlayerLookup {
  const out: PlayerLookup = {};
  const add = (players: FplTeamRecommendationPlayer[] | undefined) => {
    for (const p of players ?? []) out[p.player_id] = p;
  };
  add(squad?.starting_xi);
  add(squad?.bench);
  add(rec?.starting_xi);
  add(rec?.bench);
  for (const step of rec?.squad_with_transfers_steps ?? []) {
    for (const p of [...step.starting_xi, ...step.bench]) if (!out[p.player_id]) out[p.player_id] = p;
  }
  if (rec?.squad_with_transfers) {
    for (const p of [...rec.squad_with_transfers.starting_xi, ...rec.squad_with_transfers.bench]) if (!out[p.player_id]) out[p.player_id] = p;
  }
  const d = rec?.transfer_plan_horizon?.verdict_detail;
  for (const m of [...makeMoves(rec), ...(d?.runner_ups ?? [])]) {
    if (out[m.buy.id]) continue;
    const seller = out[m.sell.id];
    out[m.buy.id] = {
      player_id: m.buy.id,
      web_name: m.buy.name,
      pos: (m.position as FplPosition | undefined) ?? seller?.pos ?? "MID",
      team_short: m.buy.team,
      team_name: m.buy.team,
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      // The backend's own projection when it sends one; older payloads only
      // allow the estimate (seller's xPts plus the move's this-GW gain).
      xpts: typeof m.buy.xpts === "number" ? m.buy.xpts : (seller?.xpts ?? 0) + m.this_gw_gain,
      next_fixtures: m.buy.next_fixtures ?? m.buy.next_fixture,
    };
  }
  return out;
}

// ---- projection -------------------------------------------------------------

/**
 * Client-side projected points for the resolved plan: XI xPts plus the captain
 * again (only while he starts), plus the chip: Bench Boost adds the bench,
 * Triple Captain the captain once more, Free Hit the engine's gain when known.
 * Null when any starter has no xPts yet.
 */
export function projectPlan(r: ResolvedPlan, lookup: PlayerLookup, chip: PlanChip, freeHitGain?: number | null): number | null {
  let total = 0;
  for (const id of r.xi) {
    const x = lookup[id]?.xpts;
    if (typeof x !== "number" || !Number.isFinite(x)) return null;
    total += x;
  }
  const capIn = r.xi.includes(r.cap);
  const capX = lookup[r.cap]?.xpts ?? 0;
  if (capIn) total += capX;
  if (chip === "triple_captain" && capIn) total += capX;
  if (chip === "bench_boost") for (const id of r.bench) total += lookup[id]?.xpts ?? 0;
  if (chip === "free_hit" && typeof freeHitGain === "number") total += freeHitGain;
  return Math.round(total * 10) / 10;
}

// ---- diff against the no-change plan ----------------------------------------

const sameOrder = (a: number[], b: number[]) => a.length === b.length && a.every((id, i) => id === b[i]);

export const lineupChanged = (plan: GwPlan, base: GwPlan) => !sameOrder(plan.xi, base.xi) || !sameOrder(plan.bench, base.bench);

/** How many things the user would have to change in the FPL app — the navbar pill's number. */
export function countChanges(plan: GwPlan, base: GwPlan, moves: FplTransferVerdictMove[]): number {
  let n = 0;
  if (plan.transfer === "make" && moves.length > 0) n += 1;
  if (plan.cap !== base.cap) n += 1;
  if (plan.vice !== base.vice) n += 1;
  if (lineupChanged(plan, base)) n += 1;
  if (plan.chip && plan.chip !== "none") n += 1;
  return n;
}

/** The teal "do this in the FPL app" list on the saved review. */
export function buildTodo(plan: GwPlan, base: GwPlan, moves: FplTransferVerdictMove[], lookup: PlayerLookup, hitCost = 0): string[] {
  const name = (id: number) => lookup[id]?.web_name ?? `#${id}`;
  const todo: string[] = [];
  if (plan.transfer === "make" && moves.length > 0) {
    const cost = hitCost > 0 ? `−${hitCost} hit` : "free";
    for (const m of moves) todo.push(`Transfer out ${m.sell.name}, bring in ${m.buy.name} (${cost}).`);
  }
  const r = resolvePlan(plan, moves);
  if (plan.cap !== base.cap || plan.vice !== base.vice) todo.push(`Set ${name(r.cap)} as captain and ${name(r.vice)} as vice.`);
  if (lineupChanged(plan, base)) todo.push(`Set your bench to ${r.bench.slice(1).map(name).join(", ")}.`);
  if (plan.chip && plan.chip !== "none") todo.push(`Activate ${CHIP_LABELS[plan.chip]}.`);
  if (todo.length === 0) todo.push("No changes needed. Your FPL team already matches this plan.");
  return todo;
}

// ---- storage ----------------------------------------------------------------

export const planStorageKey = (entryId: number, gw: number) => `fpl_gw_plan:${entryId}:${gw}`;

export interface StoredPlan {
  plan: GwPlan;
  base: GwPlan;
  /** ISO time of the last edit; absent on an untouched seed (so the account's
   *  copy always beats it) and on rows written before account sync existed. */
  updatedAt?: string;
}

const isIdList = (v: unknown, n?: number): v is number[] =>
  Array.isArray(v) && v.every((x) => typeof x === "number") && (n === undefined || v.length === n);

function isGwPlan(v: unknown): v is GwPlan {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    isIdList(p.xi) &&
    isIdList(p.bench) &&
    (p.transfer === "make" || p.transfer === "roll" || p.transfer === null) &&
    typeof p.cap === "number" &&
    typeof p.vice === "number" &&
    (p.chip === null || p.chip === "none" || (typeof p.chip === "string" && p.chip in CHIP_LABELS)) &&
    typeof p.reviewed === "object" &&
    p.reviewed !== null &&
    typeof p.locked === "boolean"
  );
}

export function parseStoredPlan(raw: string | null): StoredPlan | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { plan?: unknown; base?: unknown; updatedAt?: unknown };
    if (!isGwPlan(v?.plan) || !isGwPlan(v?.base)) return null;
    return typeof v.updatedAt === "string" ? { plan: v.plan, base: v.base, updatedAt: v.updatedAt } : { plan: v.plan, base: v.base };
  } catch {
    return null;
  }
}
