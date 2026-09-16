// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
  it("collapses the alternatives behind a closed disclosure counting only non-plan moves", () => {
    const { container } = render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    const details = container.querySelector("details");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    expect(screen.getByText(/Alternatives \(1\) — best single swaps over 3 GWs, not the recommendation/i)).toBeTruthy();
  });

  it("excludes the plan's own moves — they belong to the decision card", () => {
    const { container } = render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    const details = within(container.querySelector("details")!);
    expect(details.queryByText("Seller")).toBeNull();
    expect(details.queryByText("Buyer")).toBeNull();
    expect(details.getByText("Other")).toBeTruthy();
    expect(details.getByText("Punt")).toBeTruthy();
  });

  it("carries no apply controls at all", () => {
    const { container } = render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    const details = within(container.querySelector("details")!);
    expect(details.queryAllByRole("button")).toHaveLength(0);
  });

  it("drops the overloaded beam badges", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    expect(screen.queryByText(/Moves:/i)).toBeNull();
    expect(screen.queryByText(/Gain:/i)).toBeNull();
    expect(screen.queryByText(/ITB after moves/i)).toBeNull();
    expect(screen.queryByText(/Applied/i)).toBeNull();
  });

  it("shows only the horizon gain on an alternative row", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div>PLAN</div>} />);
    expect(screen.getByText(/^\+3\.0 pts$/)).toBeTruthy();
    expect(screen.queryByText(/this GW/)).toBeNull();
  });

  it("renders the plan slot before the alternatives summary", () => {
    render(<TransferPlanner transfers={transfers} planSlot={<div data-testid="plan-slot">PLAN</div>} />);
    const slot = screen.getByTestId("plan-slot");
    const summary = screen.getByText(/alternatives/i);
    expect(slot.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders no disclosure when every move is in the plan", () => {
    const allInPlan = {
      ...transfers,
      moves: [(transfers as unknown as { moves: unknown[] }).moves[0]],
    } as unknown as FplTransfersRecommendation;
    const { container } = render(<TransferPlanner transfers={allInPlan} planSlot={<div>PLAN</div>} />);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText(/No transfer suggestions returned/i)).toBeNull();
  });

  it("still reports an empty beam list", () => {
    const none = { ...transfers, moves: [] } as unknown as FplTransfersRecommendation;
    render(<TransferPlanner transfers={none} planSlot={<div>PLAN</div>} />);
    expect(screen.getByText(/No transfer suggestions returned/i)).toBeTruthy();
  });

  it("uses a singular horizon label", () => {
    const oneGw = { ...transfers, transfer_plan: { ...(transfers as { transfer_plan: object }).transfer_plan, horizon_gws: 1 } } as unknown as FplTransfersRecommendation;
    render(<TransferPlanner transfers={oneGw} planSlot={<div>PLAN</div>} />);
    expect(screen.getByText(/over 1 GW, not the recommendation/i)).toBeTruthy();
  });
});
