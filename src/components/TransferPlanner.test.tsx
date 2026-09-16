// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TransferPlanner } from "./TransferPlanner";
import type { FplTransfersRecommendation } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const transfers = {
  moves: [
    {
      position: "DEF",
      sell: { id: 1, name: "Seller", team: "AAA", price: 4.9 },
      buy: { id: 2, name: "Buyer", team: "BBB", price: 4.1 },
      score_gain: 7.1,
      this_gw_gain: 2.2,
      in_plan: true,
    },
    {
      position: "MID",
      sell: { id: 3, name: "Other", team: "CCC", price: 6.0 },
      buy: { id: 4, name: "Punt", team: "DDD", price: 5.5 },
      score_gain: 3.0,
      in_plan: false,
    },
  ],
  transfer_plan: { free_transfers: 1, horizon_gws: 3, hit_cap: 0, transfer_count_target: 1, transfer_count_built: 2 },
  remaining_itb: 0.5,
} as unknown as FplTransfersRecommendation;

describe("TransferPlanner alternatives", () => {
  it("collapses the alternatives behind a closed disclosure labelled with the beam horizon", () => {
    const { container } = render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    const details = container.querySelector("details");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    expect(screen.getByText(/Alternatives \(2\) — best single swaps over 3 GWs, not the recommendation/i)).toBeTruthy();
  });

  it("renders the plan slot before the alternatives and their controls", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div data-testid="plan-slot">PLAN</div>} />);
    const slot = screen.getByTestId("plan-slot");
    const summary = screen.getByText(/alternatives/i);
    expect(slot.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const reset = screen.getByRole("button", { name: /reset applied/i });
    expect(slot.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("has no top-level 'Apply next transfer' button", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    expect(screen.queryByRole("button", { name: /apply next transfer/i })).toBeNull();
  });

  it("chips a move that is in the plan and never says 'not in plan'", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    expect(screen.getAllByText(/^in plan$/i)).toHaveLength(1);
    expect(screen.queryByText(/not in plan/i)).toBeNull();
  });

  it("shows this-GW gain alongside the horizon gain when present", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    expect(screen.getByText(/\+2\.2 this GW · \+7\.1 pts/)).toBeTruthy();
    expect(screen.getByText(/^\+3\.0 pts$/)).toBeTruthy();
  });

  it("labels ITB as post-move remainder", () => {
    render(<TransferPlanner transfers={transfers} />);
    expect(screen.getByText(/ITB after moves/i)).toBeTruthy();
  });

  it("uses a singular horizon label", () => {
    const oneGw = { ...transfers, transfer_plan: { ...(transfers as { transfer_plan: object }).transfer_plan, horizon_gws: 1 } } as unknown as FplTransfersRecommendation;
    render(<TransferPlanner transfers={oneGw} planSlot={<div>PLAN</div>} />);
    expect(screen.getByText(/over 1 GW, not the recommendation/i)).toBeTruthy();
  });
});
