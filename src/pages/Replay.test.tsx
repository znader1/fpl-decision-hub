import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Replay from "./Replay";

afterEach(() => vi.restoreAllMocks());

const RECORD = {
  season: "2025-26", gw: 7, setup_gw: false,
  players: [{ element: 351, model_xpts: 6.4, actual_points: 12 }],
  model_captain: 351, optimal_captain: 351,
  suggested_transfer: { sell: 233, buy: 99, expected_gain: 1.2 },
  sp2_candidates: [{ element: 99, differential_ev: 2.1, template_xpts: 4.0, global_ownership: 0.08, ownership_basis: "global" }],
  your: { captain: 233, points: 61 },
};

describe("Replay page", () => {
  it("renders the four panels from a fetched record", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(RECORD), { status: 200, headers: { "Content-Type": "application/json" } }));
    render(<Replay />);
    await waitFor(() => expect(screen.getByTestId("panel-players")).toBeInTheDocument());
    expect(screen.getByTestId("panel-captain")).toBeInTheDocument();
    expect(screen.getByTestId("panel-transfer")).toBeInTheDocument();
    expect(screen.getByTestId("panel-sp2")).toBeInTheDocument();
    expect(screen.getByText(/global/i)).toBeInTheDocument();   // SP2 basis label
  });
});
