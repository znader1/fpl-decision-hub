import { describe, expect, it } from "vitest";
import {
  coreFrom,
  summary,
  toDraftPitchPlayers,
  type WildcardDraftPreset,
} from "@/lib/wildcardDrafts";
import type { FplTeamRecommendationPlayer } from "@/lib/fplAssistantApi";

const player = (id: number, over: Partial<FplTeamRecommendationPlayer> = {}): FplTeamRecommendationPlayer => ({
  player_id: id, web_name: `P${id}`, pos: "MID", team_short: "ARS", team_name: "Arsenal",
  is_captain: false, is_vice_captain: false, multiplier: 1, xpts: 4,
  fixtures_horizon: [{ event_id: 8, fixtures: "BHA (H)", diff_avg: 2 }],
  score_breakdown: { horizon_xpts: 22.5, wildcard: { score: 25, weighted_xpts: 22.5, role: "xi" } },
  ...over,
});

const preset = (name: WildcardDraftPreset["name"], xi: number[], over: Partial<WildcardDraftPreset> = {}): WildcardDraftPreset => ({
  name, label: name, ok: true,
  squad: [...xi.map((id) => player(id)), player(99, { pos: "GKP", score_breakdown: { wildcard: { role: "gk2" } } })],
  xi_ids: xi, captain_id: xi[0], vice_id: xi[1] ?? null,
  objective_score_total: 60, xi_xpts_horizon: 55.5, bench_xpts_horizon: 4.2,
  squad_cost_m: 99.5, remaining_budget_m: 0.9, premiums: 2, avg_ownership: 18.4,
  transfers_from_current: 9, flags: 1, notes: [], pins_conflict: [], bench_roles: { 99: "gk2" },
  ...over,
});

describe("toDraftPitchPlayers", () => {
  it("maps lineup records to pitch players with horizon xPts and next fixture", () => {
    const out = toDraftPitchPlayers([player(1, { price_m: 8.5 } as never)]);
    expect(out[0]).toMatchObject({ player_id: 1, web_name: "P1", pos: "MID", team_short: "ARS", xpts_horizon: 22.5 });
    expect(out[0].fixtures?.[0]).toEqual({ gw: 8, opp: "BHA", home: true, diff: 2 });
  });
});

describe("coreFrom", () => {
  it("returns the XI ids shared by every preset", () => {
    const presets = [preset("aggressive", [1, 2, 3]), preset("balanced", [2, 3, 4]), preset("gems", [3, 2, 9])];
    expect(coreFrom(presets)).toEqual([2, 3]);
  });
  it("ignores presets that failed to build", () => {
    const presets = [preset("aggressive", [1, 2]), preset("balanced", [], { ok: false })];
    expect(coreFrom(presets)).toEqual([1, 2]);
  });
});

describe("summary", () => {
  it("collects the headline stats for a card", () => {
    const s = summary(preset("balanced", [1, 2]), 100.4);
    expect(s).toEqual({
      xi: 55.5, bench: 4.2, cost: 99.5, budget: 100.4, left: 0.9, premiums: 2,
      ownership: 18.4, transfers: 9, flags: 1,
    });
  });
});

describe("hand-off storage", () => {
  it("stores and reads the chosen preset with pins, bans and horizon", async () => {
    const mod = await import("@/lib/wildcardDrafts");
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    mod.storeHandoff({ preset: "gems", pinnedIds: [5, 9], excludedIds: [2], horizonGws: 7, playEventId: 8 });
    expect(mod.readHandoff()).toEqual({ preset: "gems", pinnedIds: [5, 9], excludedIds: [2], horizonGws: 7, playEventId: 8 });
    expect(store.get("fpl_chip_strategy")).toBe("wildcard");
    expect(store.get("fpl_horizon_gws")).toBe("7");
    expect(store.get("fpl_chip_play_event_id")).toBe("8");
  });

  it("reads safe defaults when nothing is stored", async () => {
    const mod = await import("@/lib/wildcardDrafts");
    (globalThis as { localStorage?: unknown }).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    expect(mod.readHandoff()).toEqual({ preset: "balanced", pinnedIds: [], excludedIds: [], horizonGws: null, playEventId: null });
  });
});

describe("fixture labels from the backend", () => {
  it("parses the backend's H-NFO(D3) / A-LIV(D4) form into opp, home and difficulty", async () => {
    const { parseFixtureLabel } = await import("@/lib/wildcardDrafts");
    expect(parseFixtureLabel("H-NFO(D3)")).toEqual({ opp: "NFO", home: true, diff: 3 });
    expect(parseFixtureLabel("A-LIV(D4)")).toEqual({ opp: "LIV", home: false, diff: 4 });
    expect(parseFixtureLabel("A-COV(D3)")).toEqual({ opp: "COV", home: false, diff: 3 });
    expect(parseFixtureLabel("BHA (H)")).toEqual({ opp: "BHA", home: true, diff: null });
    expect(parseFixtureLabel("")).toBeNull();
  });
  it("toDraftPitchPlayers uses the parsed label so the pitch does not double-prefix", async () => {
    const { toDraftPitchPlayers } = await import("@/lib/wildcardDrafts");
    const out = toDraftPitchPlayers([{
      player_id: 1, web_name: "P1", pos: "DEF", team_short: "BUR", team_name: "Burnley",
      is_captain: false, is_vice_captain: false, multiplier: 1, xpts: 4,
      fixtures_horizon: [{ event_id: 8, fixtures: "H-NFO(D3)", diff_avg: 2.86 }],
    }]);
    expect(out[0].fixtures?.[0]).toEqual({ gw: 8, opp: "NFO", home: true, diff: 3 });
  });
});

describe("pitch number", () => {
  it("shows raw horizon xPts, the same unit as the tab header, not the weighted score input", () => {
    const p = {
      ...player(1),
      score_breakdown: { horizon_xpts: 33.2, wildcard: { score: 34.9, weighted_xpts: 28.65, role: "xi" } },
    } as unknown as FplTeamRecommendationPlayer;
    expect(toDraftPitchPlayers([p])[0].xpts_horizon).toBe(33.2);
  });
});
