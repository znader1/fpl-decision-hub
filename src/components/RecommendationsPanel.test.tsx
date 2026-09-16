// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HorizonTransferPlan } from "./RecommendationsPanel";
import type { FplTransferPlanHorizon } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const basePlan: FplTransferPlanHorizon = {
  valid: true,
  gws: [1],
  horizon_gws: 1,
  start_free_transfers: 2,
  ft_cap: 5,
  allow_hits: false,
  total_net_gain: 0,
  final_bank: 0,
  plan: [
    {
      gw: 1,
      action: "roll",
      free_transfers_before: 2,
      free_transfers_after: 3,
      hits: 0,
      hit_cost: 0,
      gw_gain: 0,
      net_gain: 0,
      bank_after: 0,
      moves: [],
      note: "No move clears the bar this GW.",
    },
  ],
};

describe("HorizonTransferPlan verdict banner", () => {
  it("renders roll verdict with FT progression", () => {
    render(
      <HorizonTransferPlan
        plan={{
          ...basePlan,
          verdict: "roll",
          reasoning: "Roll the FT (2→3).",
          first_gw_ft_before: 2,
          first_gw_ft_after: 3,
        }}
      />
    );
    const banner = screen.getByTestId("plan-verdict-banner");
    expect(banner.textContent).toMatch(/roll it/i);
    expect(screen.getByText(/roll the ft/i)).toBeTruthy();
    expect(banner.textContent).toMatch(/FT 2→3/);
  });

  it("renders spend verdict distinctly", () => {
    render(
      <HorizonTransferPlan
        plan={{
          ...basePlan,
          verdict: "spend",
          reasoning: "Move gains 3.2 xPts this GW — take it.",
        }}
      />
    );
    const banner = screen.getByTestId("plan-verdict-banner");
    expect(banner.textContent).toMatch(/make the move/i);
    expect(screen.getByText(/take it/i)).toBeTruthy();
  });

  it("renders injury-forced verdict distinctly", () => {
    render(
      <HorizonTransferPlan
        plan={{
          ...basePlan,
          verdict: "spend_forced_injury",
          reasoning: "Flagged player is a doubt — replace now.",
        }}
      />
    );
    const banner = screen.getByTestId("plan-verdict-banner");
    expect(banner.textContent).toMatch(/injury: act now/i);
    expect(screen.getByText(/flagged player/i)).toBeTruthy();
  });

  it("renders nothing extra when verdict absent", () => {
    render(<HorizonTransferPlan plan={basePlan} />);
    expect(screen.queryByTestId("plan-verdict-banner")).toBeNull();
  });

  it("renders no banner at all when plan is undefined", () => {
    const { container } = render(<HorizonTransferPlan plan={undefined} />);
    expect(container.querySelector('[data-testid="plan-verdict-banner"]')).toBeNull();
  });

  it("renders the banner alone when plan.plan is empty (e.g. a forced-injury verdict issued before a walk exists)", () => {
    render(
      <HorizonTransferPlan
        plan={{
          verdict: "spend_forced_injury",
          reasoning: "Flagged player is a doubt — replace now.",
          plan: [],
        }}
      />
    );
    const banner = screen.getByTestId("plan-verdict-banner");
    expect(banner.textContent).toMatch(/injury: act now/i);
    expect(screen.getByText(/flagged player/i)).toBeTruthy();
    // the detailed multi-GW plan card must not render when there's no plan walk
    expect(screen.queryByText(/multi-gw plan/i)).toBeNull();
  });

  it("folds the later gameweeks behind a disclosure", () => {
    const { container } = render(
      <HorizonTransferPlan
        plan={{
          ...basePlan,
          verdict: "spend",
          gws: [1, 2, 3],
          horizon_gws: 3,
          plan: [
            {
              ...basePlan.plan[0],
              action: "transfer",
              moves: [
                {
                  position: "MID",
                  sell: { id: 1, name: "NowSell", team: "AAA", price: 5.0 },
                  buy: { id: 2, name: "NowBuy", team: "BBB", price: 5.5 },
                  score_gain: 4.2,
                },
              ],
            },
            { ...basePlan.plan[0], gw: 2 },
            { ...basePlan.plan[0], gw: 3 },
          ],
        }}
      />
    );
    // This week's move visible; GW2/GW3 rows live inside the fold.
    expect(screen.getByText("NowBuy")).toBeTruthy();
    const details = Array.from(container.querySelectorAll("details")).find((d) =>
      d.textContent?.includes("rest of the plan")
    );
    expect(details).toBeTruthy();
    expect(details?.textContent).toContain("GW3");
  });

  it("flags a move that faces one of your own players", () => {
    render(
      <HorizonTransferPlan
        plan={{
          ...basePlan,
          verdict: "spend",
          plan: [
            {
              ...basePlan.plan[0],
              action: "transfer",
              moves: [
                {
                  position: "MID",
                  sell: { id: 1, name: "Seller", team: "AAA", price: 5.0 },
                  buy: { id: 2, name: "Buyer", team: "BBB", price: 5.5 },
                  score_gain: 4.2,
                  h2h_conflicts: ["Guéhi"],
                },
              ],
            },
          ],
        }}
      />
    );
    expect(screen.getByText(/faces your Guéhi/i)).toBeTruthy();
  });
});

describe("HorizonTransferPlan labels", () => {
  const spendPlan: FplTransferPlanHorizon = {
    ...basePlan,
    gws: [5, 6, 7],
    horizon_gws: 3,
    total_net_gain: 6.5,
    verdict: "spend",
    reasoning: "Move now.",
    plan: [
      {
        gw: 5, action: "transfer", free_transfers_before: 1, free_transfers_after: 0,
        hits: 0, hit_cost: 0, gw_gain: 2.8, net_gain: 2.8, bank_after: 1.0,
        moves: [{
          sell: { id: 1, name: "Szoboszlai", team: "LIV", price: 7 },
          buy: { id: 2, name: "Tavernier", team: "BOU", price: 6.1 },
          score_gain: 2.8, this_gw_gain: 0.9,
        }],
        note: "Szoboszlai → Tavernier",
      },
      { gw: 6, action: "roll", free_transfers_before: 1, free_transfers_after: 2, hits: 0, hit_cost: 0,
        gw_gain: 0, net_gain: 0, bank_after: 1.0, moves: [], note: "Roll." },
      { gw: 7, action: "roll", free_transfers_before: 2, free_transfers_after: 3, hits: 0, hit_cost: 0,
        gw_gain: 0, net_gain: 0, bank_after: 1.0, moves: [], note: "Roll." },
    ],
  };

  it("names the GW range in the header and the net line", () => {
    render(<HorizonTransferPlan plan={spendPlan} />);
    expect(screen.getByText("Plan GW5–7")).toBeTruthy();
    // Exact string: the legacy banner also says "...using free transfers only."
    expect(screen.getByText("free transfers only")).toBeTruthy();
    // The net line mixes text nodes and a <b>, so read the element, not getByText.
    expect(screen.getByTestId("plan-net").textContent).toBe("Net +6.5 over GW5–7");
  });

  it("shows this-GW and horizon gains on a move row", () => {
    render(<HorizonTransferPlan plan={spendPlan} />);
    expect(screen.getByText(/\+0\.9 this GW · \+2\.8/)).toBeTruthy();
  });

  it("labels a hits plan with the move and hit counts", () => {
    const hits = { ...spendPlan, plan: [{ ...spendPlan.plan![0], hits: 1, hit_cost: 4, net_gain: -1.2 }] };
    render(<HorizonTransferPlan plan={hits} />);
    expect(screen.getByText(/1 move, 1 hit/)).toBeTruthy();
  });
});
