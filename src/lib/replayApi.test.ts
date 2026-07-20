import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchReplayGw } from "./replayApi";

afterEach(() => vi.restoreAllMocks());

describe("fetchReplayGw", () => {
  it("calls the replay endpoint with entry_id and returns the record", async () => {
    const record = { season: "2025-26", gw: 7, setup_gw: false, players: [],
      model_captain: 351, optimal_captain: 351, suggested_transfer: null,
      sp2_candidates: [], your: { captain: 233, points: 61 } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(record), { status: 200, headers: { "Content-Type": "application/json" } }));
    const out = await fetchReplayGw("2025-26", 7, 588004);
    expect(out.your?.captain).toBe(233);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/replay/2025-26/gw/7");
    expect(calledUrl).toContain("entry_id=588004");
  });
});
