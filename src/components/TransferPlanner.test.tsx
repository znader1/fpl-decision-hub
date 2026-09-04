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
    },
  ],
} as unknown as FplTransfersRecommendation;

describe("TransferPlanner verdict-aware layout", () => {
  it("collapses quick options behind a disclosure when the plan says roll", () => {
    const { container } = render(
      <TransferPlanner transfers={transfers} planVerdict="roll" planSlot={<div>PLAN</div>} />
    );
    const details = container.querySelector("details");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    expect(screen.getByText(/not the recommendation/i)).toBeTruthy();
  });

  it("shows quick options directly when the plan says spend", () => {
    const { container } = render(
      <TransferPlanner transfers={transfers} planVerdict="spend" planSlot={<div>PLAN</div>} />
    );
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByText("Seller")).toBeTruthy();
  });

  it("renders the plan slot before the quick options", () => {
    const { container } = render(
      <TransferPlanner transfers={transfers} planVerdict="spend" planSlot={<div data-testid="plan-slot">PLAN</div>} />
    );
    const slot = screen.getByTestId("plan-slot");
    const quick = screen.getByText(/quick options/i);
    expect(
      slot.compareDocumentPosition(quick) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(container).toBeTruthy();
  });

  it("labels ITB as post-move remainder", () => {
    render(
      <TransferPlanner
        transfers={{ ...transfers, remaining_itb: 0.5 } as unknown as FplTransfersRecommendation}
        planVerdict="spend"
      />
    );
    expect(screen.getByText(/ITB after moves/i)).toBeTruthy();
  });
});
