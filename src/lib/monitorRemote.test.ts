import { beforeEach, describe, expect, it, vi } from "vitest";
import gw9 from "./__tests__/fixtures/monitor_gw9.json";

// A chainable fake of the parts of the Supabase query builder the remote uses.
// Each test sets `result` to what the terminal call resolves with.
let result: { data: unknown; error: unknown };
let calls: { table: string; select: string; filters: [string, string, unknown][] }[];

function builder(table: string) {
  const call = { table, select: "", filters: [] as [string, string, unknown][] };
  calls.push(call);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: (s: string) => ((call.select = s), chain),
    eq: (c: string, v: unknown) => (call.filters.push(["eq", c, v]), chain),
    order: () => chain,
    maybeSingle: () => Promise.resolve(result),
    returns: () => Promise.resolve(result),
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => builder(table) },
}));

import { supabaseMonitorRemote } from "./monitorRemote";

beforeEach(() => {
  calls = [];
  result = { data: null, error: null };
});

describe("supabaseMonitorRemote.isOwner", () => {
  it("is true only when the owner's row comes back", async () => {
    result = { data: { user_id: "u1" }, error: null };
    expect(await supabaseMonitorRemote.isOwner("u1")).toBe(true);
    expect(calls[0]).toMatchObject({ table: "monitor_owners", filters: [["eq", "user_id", "u1"]] });

    result = { data: null, error: null };
    expect(await supabaseMonitorRemote.isOwner("u1")).toBe(false);
  });

  it("throws on a query error instead of answering false", async () => {
    result = { data: null, error: new Error("network") };
    await expect(supabaseMonitorRemote.isOwner("u1")).rejects.toThrow("network");
  });
});

describe("supabaseMonitorRemote.loadReport", () => {
  it("runs the row through parseMonitorReport", async () => {
    result = { data: { report: gw9 }, error: null };
    const r = await supabaseMonitorRemote.loadReport("2026-27", 107342, 9);
    expect(r?.gw).toBe(9);
    expect(calls[0]).toMatchObject({
      table: "monitor_reports",
      filters: [
        ["eq", "season", "2026-27"],
        ["eq", "entry_id", 107342],
        ["eq", "gw", 9],
      ],
    });
  });

  it("returns null for a missing or malformed row", async () => {
    result = { data: null, error: null };
    expect(await supabaseMonitorRemote.loadReport("2026-27", 107342, 3)).toBeNull();
    result = { data: { report: { bad: true } }, error: null };
    expect(await supabaseMonitorRemote.loadReport("2026-27", 107342, 3)).toBeNull();
  });
});

describe("supabaseMonitorRemote.listSeason", () => {
  it("coerces the JSON-path columns", async () => {
    result = {
      data: [
        {
          season: "2026-27",
          gw: 9,
          entry_id: 107342,
          built_at: "2026-11-07T10:40:00Z",
          state: "finished",
          headline: gw9.headline,
          transfers_verdict: "you",
          wildcard_verdict: null,
          captain: gw9.captain,
          app_projected: 60,
          app_points_no_captain: "70",
          chip_week: false,
        },
        {
          season: "2026-27",
          gw: 10,
          entry_id: 107342,
          built_at: "2026-11-07T10:40:00Z",
          state: "live",
          headline: { app: null, scout: null, you: null, best: null, basis: "with_captain" },
          transfers_verdict: null,
          wildcard_verdict: null,
          captain: null,
          app_projected: null,
          app_points_no_captain: null,
          chip_week: null,
        },
      ],
      error: null,
    };
    const rows = await supabaseMonitorRemote.listSeason();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      gw: 9,
      state: "finished",
      transfers_verdict: "you",
      app_projected: 60,
      app_points_no_captain: 70,
      chip_week: false,
    });
    expect(rows[0].headline.app).toBe(70);
    expect(rows[1]).toMatchObject({ gw: 10, state: "live", chip_week: false, captain: null });
    expect(calls[0].select).toContain("report->headline");
  });

  it("drops rows whose state or gameweek is unreadable", async () => {
    result = { data: [{ gw: "x", state: "finished" }, { gw: 2, state: "done" }], error: null };
    expect(await supabaseMonitorRemote.listSeason()).toEqual([]);
  });
});
