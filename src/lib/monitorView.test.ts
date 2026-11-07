import { describe, expect, it } from "vitest";
import { parseMonitorReport, type MonitorReport, type YouAvailable } from "./monitorReport";
import type { SeasonRow } from "./monitorRemote";
import {
  bestStrip,
  doubledId,
  fmtGain,
  pitchModel,
  seasonRows,
  seasonSummary,
  verdictLabel,
} from "./monitorView";
import gw1Json from "./__tests__/fixtures/monitor_gw1.json";
import gw7Json from "./__tests__/fixtures/monitor_gw7.json";
import gw9Json from "./__tests__/fixtures/monitor_gw9.json";
import gw10Json from "./__tests__/fixtures/monitor_gw10.json";

const gw1 = parseMonitorReport(gw1Json)!;
const gw7 = parseMonitorReport(gw7Json)!;
const gw9 = parseMonitorReport(gw9Json)!;
const gw10 = parseMonitorReport(gw10Json)!;
const clone = (r: MonitorReport): MonitorReport => JSON.parse(JSON.stringify(r));

describe("pitchModel", () => {
  it("GW9 app pitch: 11 cards, headline total 70, Haaland captain but not doubled (basis no_captain)", () => {
    const m = pitchModel(gw9, "app");
    expect(m.unavailable).toBeNull();
    expect(m.rows.flat()).toHaveLength(11);
    expect(m.rows.map((r) => r.length)).toEqual([1, 3, 5, 2]);
    const h = m.rows.flat().find((c) => c.id === 411)!;
    expect(h.isCaptain).toBe(true);
    expect(h.doubled).toBe(false);
    expect(h.points).toBe(2);
    expect(m.total).toBe(70);
    expect(m.totalNote).toBe("projected 60.0");
    expect(m.subtitle).toBe("best eleven from the app's projections");
  });

  it("GW7 app pitch doubles the captain when the basis is with_captain", () => {
    const m = pitchModel(gw7, "app");
    const h = m.rows.flat().find((c) => c.id === 411)!;
    expect(h.doubled).toBe(true);
    expect(h.points).toBe(26);
    expect(m.total).toBe(56);
  });

  it("GW9 scout pitch marks the inferred captain without doubling him", () => {
    const m = pitchModel(gw9, "scout");
    const c = m.rows.flat().find((x) => x.id === 411)!;
    expect(c.isCaptain).toBe(true);
    expect(c.doubled).toBe(false);
    expect(m.total).toBe(69);
    expect(m.subtitle).toBe("published 29 Oct, premierleague.com");
    expect(m.totalNote).toBeNull();
  });

  it("you pitch doubles the captain, marks app-shared players, keeps the bench in stored order", () => {
    const m = pitchModel(gw9, "you");
    const h = m.rows.flat().find((c) => c.id === 411)!;
    expect(h.doubled).toBe(true);
    expect(h.points).toBe(4);
    expect(m.rows.flat().find((c) => c.id === 112)!.shared).toBe(true); // Van Hecke, also in the app XI
    expect(m.rows.flat().find((c) => c.id === 496)!.shared).toBe(false); // Kinsky, not in the app XI
    expect(m.bench.map((c) => c.id)).toEqual([109, 552, 115, 423]);
    expect(m.bench.find((c) => c.id === 423)!.faded).toBe(true); // Shaw, 0 minutes
    expect(m.total).toBe(64);
    expect(m.totalNote).toBe("22 on bench");
    expect(m.subtitle).toBe("as picked");
  });

  it("GW1 you pitch names the chip; app pitch is unavailable with the reason", () => {
    expect(pitchModel(gw1, "you").subtitle).toBe("Bench Boost played");
    const app = pitchModel(gw1, "app");
    expect(app.unavailable).toBe("no pre-deadline snapshot");
    expect(app.rows).toEqual([]);
    expect(app.total).toBeNull();
  });

  it("GW10 (live, no points yet) fades nobody, shows no points and no total", () => {
    const m = pitchModel(gw10, "app");
    expect(m.rows.flat().every((c) => !c.faded)).toBe(true);
    expect(m.rows.flat().every((c) => c.points === null)).toBe(true);
    expect(m.rows.flat().find((c) => c.id === 249)!.xpts).toBe(6.22);
    expect(m.total).toBeNull();
  });

  it("the app pitch never marks its own players as shared", () => {
    expect(pitchModel(gw9, "app").rows.flat().every((c) => !c.shared)).toBe(true);
  });

  it("a partial scout eleven keeps its total off", () => {
    const r = clone(gw9);
    (r.scout_xi as { partial?: boolean }).partial = true;
    const m = pitchModel(r, "scout");
    expect(m.total).toBeNull();
    expect(m.totalNote).toBe("partial");
  });

  it("an id missing from players renders as #id", () => {
    const r = clone(gw9);
    delete r.players["496"];
    const k = pitchModel(r, "you").rows.flat().find((c) => c.id === 496)!;
    expect(k.name).toBe("#496");
    expect(k.club).toBe("—");
  });
});

describe("doubledId", () => {
  it("is the captain when he played", () => {
    expect(doubledId(gw9.you as YouAvailable, gw9)).toBe(411);
  });

  it("is the vice when the captain has 0 minutes and the vice played", () => {
    const r = clone(gw9);
    r.players["411"].minutes = 0;
    expect(doubledId(r.you as YouAvailable, r)).toBe(154);
  });

  it("stays the captain when neither played, and is null with no captain", () => {
    const r = clone(gw9);
    r.players["411"].minutes = 0;
    r.players["154"].minutes = 0;
    expect(doubledId(r.you as YouAvailable, r)).toBe(411);
    expect(doubledId({ captain_id: null, vice_id: 154 }, r)).toBeNull();
  });
});

describe("bestStrip", () => {
  it("lists the eleven with the total", () => {
    const s = bestStrip(gw9);
    expect(s.points).toBe(115);
    expect(s.names).toHaveLength(11);
    expect(s.names[0]).toBe("Verbruggen");
    expect(s.reason).toBeNull();
  });

  it("carries the reason on a live gameweek", () => {
    expect(bestStrip(gw10)).toEqual({ points: null, names: [], reason: "gameweek not finished" });
  });
});

describe("verdictLabel and fmtGain", () => {
  it("formats gains with a real minus sign", () => {
    expect(fmtGain(-13)).toBe("−13");
    expect(fmtGain(15)).toBe("+15");
    expect(fmtGain(0)).toBe("0");
    expect(fmtGain(null)).toBe("—");
    expect(fmtGain(undefined)).toBe("—");
  });

  it("names the winner over the window, or says the contest is open", () => {
    expect(verdictLabel("you", 3, 3)).toBe("You, over 3 gameweeks");
    expect(verdictLabel("app", 3, 3)).toBe("App, over 3 gameweeks");
    expect(verdictLabel("kept", 5, 5)).toBe("Kept squad, over 5 gameweeks");
    expect(verdictLabel("level", 3, 3)).toBe("Level over 3 gameweeks");
    expect(verdictLabel(null, 3, 1)).toBe("Open (1 of 3 played)");
    expect(verdictLabel(null, 3, 3)).toBe("No verdict");
  });
});

const row = (over: Partial<SeasonRow>): SeasonRow => ({
  season: "2026-27",
  gw: 1,
  entry_id: 107342,
  state: "finished",
  built_at: "",
  headline: { app: null, scout: null, you: null, best: null, basis: "no_captain" },
  transfers_verdict: null,
  wildcard_verdict: null,
  captain: null,
  app_projected: null,
  app_points_no_captain: null,
  chip_week: false,
  ...over,
});

const cap = (you: number, best: number) => ({
  you: { id: you, points: 0 },
  best_in_squad: { id: best, points: 0 },
  app_for_you: null,
  scout: null,
  best_overall: null,
});

// Real headline numbers for entry 107342, GW1–GW10 (backfill of 2026-11-07).
const SEASON: SeasonRow[] = [
  row({ gw: 1, headline: { app: null, scout: null, you: 56, best: 148, basis: "no_captain" }, captain: cap(411, 165) }),
  row({ gw: 2, headline: { app: 109, scout: 96, you: 84, best: 143, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept", app_projected: 70, app_points_no_captain: 95, captain: cap(411, 411) }),
  row({ gw: 3, headline: { app: 57, scout: 60, you: 49, best: 127, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept", app_projected: 65, app_points_no_captain: 50 }),
  row({ gw: 4, headline: { app: 80, scout: 80, you: 90, best: 146, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept" }),
  row({ gw: 5, headline: { app: 50, scout: 57, you: 42, best: 150, basis: "with_captain" }, transfers_verdict: "level", wildcard_verdict: "kept" }),
  row({ gw: 6, headline: { app: 48, scout: 38, you: 75, best: 132, basis: "with_captain" }, transfers_verdict: "level" }),
  row({ gw: 7, headline: { app: 56, scout: 64, you: 76, best: 127, basis: "with_captain" }, chip_week: true }),
  row({ gw: 8, headline: { app: 56, scout: 48, you: 32, best: 128, basis: "with_captain" } }),
  row({ gw: 9, headline: { app: 70, scout: 69, you: 64, best: 115, basis: "no_captain" }, app_projected: 60, app_points_no_captain: 70, captain: cap(411, 112) }),
  row({ gw: 10, state: "live", headline: { app: null, scout: null, you: null, best: null, basis: "with_captain" } }),
  row({ gw: 9, entry_id: 5645321, headline: { app: 70, scout: 69, you: 40, best: 115, basis: "no_captain" } }),
];

describe("seasonRows", () => {
  it("keeps one entry, counts only gameweeks with both app and scout, and runs the totals", () => {
    const rows = seasonRows(SEASON, 107342);
    expect(rows.map((r) => r.gw)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rows[0].counted).toBe(false);
    expect(rows[0].closer).toBeNull();
    expect(rows[1]).toMatchObject({ counted: true, closer: "app", runApp: 109, runScout: 96, runYou: 140 });
    expect(rows[3].closer).toBe("level");
    const gw9 = rows.find((r) => r.gw === 9)!;
    expect(gw9.runApp).toBe(526);
    expect(gw9.runScout).toBe(512);
    expect(gw9.captainHit).toBe(false);
    expect(gw9.projectionError).toBe(-10);
    expect(rows[1].captainHit).toBe(true);
    expect(rows[2].captainHit).toBeNull();
    expect(rows[9]).toMatchObject({ state: "live", counted: false, projectionError: null });
  });
});

describe("seasonSummary", () => {
  it("tallies verdicts, captain hits and the projection error", () => {
    const s = seasonSummary(seasonRows(SEASON, 107342));
    expect(s.transfers).toEqual({ app: 0, you: 3, level: 2, open: 2 }); // GW8, GW9 open; GW1 no advice; GW7 chip week; GW10 live
    expect(s.wildcard).toEqual({ app: 0, kept: 4, level: 0, open: 4 }); // GW6–GW9 open
    expect(s.captain).toEqual({ hits: 1, of: 3 });
    expect(s.projection.n).toBe(3);
    expect(s.projection.meanSigned).toBeCloseTo((-25 + 15 - 10) / 3, 5);
    expect(s.projection.meanAbs).toBeCloseTo((25 + 15 + 10) / 3, 5);
  });

  it("is empty-safe", () => {
    expect(seasonSummary([]).projection).toEqual({ meanSigned: null, meanAbs: null, n: 0 });
  });
});
