import { describe, expect, it } from "vitest";
import { parseMonitorReport, playerOf } from "./monitorReport";
import gw1 from "./__tests__/fixtures/monitor_gw1.json";
import gw7 from "./__tests__/fixtures/monitor_gw7.json";
import gw9 from "./__tests__/fixtures/monitor_gw9.json";
import gw10 from "./__tests__/fixtures/monitor_gw10.json";

describe("parseMonitorReport", () => {
  it("parses the four real reports", () => {
    for (const f of [gw1, gw7, gw9, gw10]) {
      expect(parseMonitorReport(f)?.gw).toBe(f.gw);
    }
  });

  it("returns null for a non-object or a row without gw/state/players", () => {
    expect(parseMonitorReport(null)).toBeNull();
    expect(parseMonitorReport("x")).toBeNull();
    expect(parseMonitorReport({ gw: 3 })).toBeNull();
    expect(parseMonitorReport({ gw: 3, state: "finished", players: {} })).toBeNull();
    expect(parseMonitorReport({ gw: 3, state: "done", players: {}, headline: {} })).toBeNull();
  });

  it("GW1 has no app column and a bench boost", () => {
    const r = parseMonitorReport(gw1)!;
    expect(r.app_xi.available).toBe(false);
    expect(r.you.available && r.you.chip).toBe("bboost");
  });

  it("GW9 names the inferred Scout captain without stating it", () => {
    const s = parseMonitorReport(gw9)!.scout_xi;
    expect(s.available && s.captain_stated).toBe(false);
    expect(s.available && s.captain_inferred_id).toBe(411);
  });

  it("GW10 is live with the owner's picks unavailable", () => {
    const r = parseMonitorReport(gw10)!;
    expect(r.state).toBe("live");
    expect(r.you.available).toBe(false);
    expect(r.headline.app).toBeNull();
  });
});

describe("playerOf", () => {
  it("reads a player by numeric id", () => {
    expect(playerOf(parseMonitorReport(gw9)!, 411)).toMatchObject({ name: "Haaland", club: "MCI", points: 2 });
  });

  it("falls back to #id with null fields", () => {
    expect(playerOf(parseMonitorReport(gw9)!, 999999)).toMatchObject({
      name: "#999999",
      club: null,
      pos: null,
      points: null,
      minutes: null,
      xpts: null,
    });
  });
});
