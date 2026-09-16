// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DecisionCard, fmtGain, gwRange } from "./DecisionCard";
import type { FplTransferPlanHorizon, FplTransferVerdictDetail, FplTransferVerdictMove } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const mv = (sellId: number, buyId: number, thisGw = 0.9, horizon = 2.8): FplTransferVerdictMove => ({
  sell: { id: sellId, name: `S${sellId}`, team: "LIV", price: 7.0 },
  buy: { id: buyId, name: `B${buyId}`, team: "BOU", price: 6.1 },
  position: "MID",
  this_gw_gain: thisGw,
  horizon_gain: horizon,
});

const detail = (over: Partial<FplTransferVerdictDetail>): FplTransferVerdictDetail => ({
  action: "spend",
  horizon: { start_gw: 5, end_gw: 7, n: 3 },
  ft_before: 1,
  ft_after: 0,
  threshold: 2.0,
  moves: [mv(1, 2)],
  this_gw_gain: 0.9,
  horizon_gain: 2.8,
  hit_cost: 0,
  plan_net: 6.5,
  roll_alternative: { net: 0, gw: 6, moves: [] },
  next_move: null,
  ...over,
});

const plan = (d?: FplTransferVerdictDetail, extra: Partial<FplTransferPlanHorizon> = {}): FplTransferPlanHorizon => ({
  verdict: d?.action ?? "spend",
  reasoning: "legacy prose",
  verdict_detail: d,
  horizon_gws: 3,
  allow_hits: false,
  ...extra,
});

describe("helpers", () => {
  it("formats gains with sign and one decimal", () => {
    expect(fmtGain(0.94)).toBe("+0.9");
    expect(fmtGain(-1.25)).toBe("−1.3");
    expect(fmtGain(0)).toBe("+0.0");
  });
  it("formats GW ranges", () => {
    expect(gwRange({ start_gw: 5, end_gw: 7 })).toBe("GW5–7");
    expect(gwRange({ start_gw: 5, end_gw: 5 })).toBe("GW5");
    expect(gwRange({ start_gw: null, end_gw: null })).toBe("the horizon");
  });
});

describe("DecisionCard spend", () => {
  it("shows the move, both gains with the GW range, and the roll comparison", () => {
    render(<DecisionCard plan={plan(detail({}))} />);
    const card = screen.getByTestId("plan-verdict-banner");
    expect(card.textContent).toMatch(/make the move/i);
    expect(card.textContent).toContain("S1");
    expect(card.textContent).toContain("B2");
    expect(screen.getByTestId("decision-gains").textContent).toBe("+0.9 this GW · +2.8 over GW5–7");
    expect(card.textContent).toMatch(/Plan GW5–7 nets \+6\.5/);
    expect(card.textContent).toMatch(/rolling instead nets \+0\.0/);
    expect(card.textContent).toContain("FT 1→0");
    expect(card.textContent).not.toContain("legacy prose");
  });

  it("applies the plan's moves via onApplyTransferAtIndex(k-1)", () => {
    const onApply = vi.fn();
    render(<DecisionCard plan={plan(detail({ moves: [mv(1, 2), mv(3, 4)] }))} onApplyTransferAtIndex={onApply} appliedTransferCount={0} />);
    fireEvent.click(screen.getByRole("button", { name: /apply 2 moves/i }));
    expect(onApply).toHaveBeenCalledWith(1);
  });

  it("marks applied once appliedTransferCount covers the plan moves", () => {
    render(<DecisionCard plan={plan(detail({}))} onApplyTransferAtIndex={() => {}} appliedTransferCount={1} />);
    const btn = screen.getByRole("button", { name: /applied/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("hides the apply button when no handler is given", () => {
    render(<DecisionCard plan={plan(detail({}))} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the hit cost when hits were taken", () => {
    render(<DecisionCard plan={plan(detail({ hit_cost: 4, this_gw_gain: 3.2, horizon_gain: 9.1 }))} />);
    expect(screen.getByTestId("decision-gains").textContent).toContain("−4 hit");
  });

  it("uses the injury tone and flags the seller on a forced sell", () => {
    render(<DecisionCard plan={plan(detail({ action: "spend_forced_injury", moves: [{ ...mv(1, 2), forced_injury: true }], roll_alternative: null }))} />);
    const card = screen.getByTestId("plan-verdict-banner");
    expect(card.textContent).toMatch(/injury: act now/i);
    expect(card.textContent).toMatch(/flagged/i);
    expect(card.className).toContain("destructive");
  });
});

describe("DecisionCard roll", () => {
  it("explains the bank and names the next planned move", () => {
    render(<DecisionCard plan={plan(detail({
      action: "roll", moves: [], this_gw_gain: 0, horizon_gain: 0, ft_before: 1, ft_after: 2,
      roll_alternative: null, plan_net: 3.7,
      next_move: { gw: 6, moves: [mv(5, 6, 3.7, 3.7)], horizon_gain: 3.7 },
    }))} />);
    const card = screen.getByTestId("plan-verdict-banner");
    expect(card.textContent).toMatch(/roll it/i);
    expect(card.textContent).toMatch(/No move clears \+2\.0 over GW5–7/);
    expect(card.textContent).toMatch(/Next planned move: S5 → B6 in GW6 \(\+3\.7 over GW6–7\)/);
    expect(card.textContent).toContain("FT 1→2");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("quotes the rejected spend when the counterfactual flipped the verdict", () => {
    render(<DecisionCard plan={plan(detail({
      action: "roll", moves: [], this_gw_gain: 0, horizon_gain: 0, ft_before: 1, ft_after: 2,
      plan_net: 14, roll_alternative: { net: 13, gw: 5, moves: [mv(1, 3)] },
      next_move: { gw: 6, moves: [mv(1, 3), mv(2, 4)], horizon_gain: 14 },
    }))} />);
    expect(screen.getByTestId("plan-verdict-banner").textContent)
      .toMatch(/Moving now \(S1 → B3\) would net \+13\.0 over GW5–7; rolling nets \+14\.0/);
  });
});

describe("DecisionCard fallback", () => {
  it("renders the legacy reasoning banner when verdict_detail is absent", () => {
    render(<DecisionCard plan={plan(undefined, { verdict: "spend", first_gw_ft_before: 1, first_gw_ft_after: 0 })} />);
    const card = screen.getByTestId("plan-verdict-banner");
    expect(card.textContent).toContain("legacy prose");
    expect(card.textContent).toMatch(/Planned across 3 GWs/);
  });

  it("renders nothing without a verdict", () => {
    const { container } = render(<DecisionCard plan={{}} />);
    expect(container.querySelector('[data-testid="plan-verdict-banner"]')).toBeNull();
  });
});
