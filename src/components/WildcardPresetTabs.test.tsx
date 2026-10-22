// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WildcardPresetTabs } from "./WildcardPresetTabs";
import type { WildcardDraftPreset } from "@/lib/wildcardDrafts";

afterEach(cleanup);

const p = (name: WildcardDraftPreset["name"], label: string, xi: number, cost: number): WildcardDraftPreset => ({
  name, label, ok: true, squad: [], xi_ids: [], captain_id: null, vice_id: null,
  objective_score_total: 0, xi_xpts_horizon: xi, bench_xpts_horizon: 0, squad_cost_m: cost,
  remaining_budget_m: 0, premiums: 0, avg_ownership: null, transfers_from_current: null, flags: 0,
  notes: [], pins_conflict: [], bench_roles: {},
});

describe("WildcardPresetTabs", () => {
  it("shows one tab per preset with XI xPts and cost, and selects on click", () => {
    const onSelect = vi.fn();
    render(<WildcardPresetTabs presets={[p("aggressive", "Aggressive", 276.1, 99.3), p("balanced", "Balanced", 261.7, 99.9), p("gems", "Gems", 264.8, 93.7)]} selected="balanced" onSelect={onSelect} />);
    expect(screen.getByRole("tab", { name: /Aggressive/ }).textContent).toContain("276.1");
    expect(screen.getByRole("tab", { name: /Gems/ }).textContent).toContain("£93.7m");
    expect(screen.getByRole("tab", { name: /Balanced/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: /Gems/ }));
    expect(onSelect).toHaveBeenCalledWith("gems");
  });
});
