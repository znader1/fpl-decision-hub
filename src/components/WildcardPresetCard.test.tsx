// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WildcardPresetCard } from "./WildcardPresetCard";
import type { WildcardDraftPreset } from "@/lib/wildcardDrafts";
import type { FplTeamRecommendationPlayer } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const player = (id: number, pos: FplTeamRecommendationPlayer["pos"], role: string): FplTeamRecommendationPlayer => ({
  player_id: id, web_name: `P${id}`, pos, team_short: "ARS", team_name: "Arsenal",
  is_captain: false, is_vice_captain: false, multiplier: 1, xpts: 4,
  score_breakdown: { horizon_xpts: 20, wildcard: { score: 20, role } },
});

const xi = [player(1, "GKP", "xi"), ...[2, 3, 4].map((i) => player(i, "DEF", "xi")), ...[5, 6, 7, 8].map((i) => player(i, "MID", "xi")), ...[9, 10, 11].map((i) => player(i, "FWD", "xi"))];
const bench = [player(12, "GKP", "gk2"), player(13, "DEF", "def_cover"), player(14, "MID", "dc_mid"), player(15, "DEF", "free")];

const preset: WildcardDraftPreset = {
  name: "balanced", label: "Balanced", ok: true, squad: [...xi, ...bench],
  xi_ids: xi.map((p) => p.player_id), captain_id: 9, vice_id: 5,
  objective_score_total: 70, xi_xpts_horizon: 61.2, bench_xpts_horizon: 8.1,
  squad_cost_m: 100.2, remaining_budget_m: 0.2, premiums: 2, avg_ownership: 21.3,
  transfers_from_current: 11, flags: 0, notes: ["dc_mid fallback: DEF"], pins_conflict: [],
  bench_roles: { 12: "gk2", 13: "def_cover", 14: "dc_mid", 15: "free" },
};

describe("WildcardPresetCard", () => {
  it("renders the headline stats, the bench roles and the notes", () => {
    render(<WildcardPresetCard preset={preset} budgetM={100.4} onUse={() => {}} pinned={new Set()} excluded={new Set()} onPin={() => {}} onExclude={() => {}} />);
    expect(screen.getByText("Balanced")).toBeTruthy();
    expect(screen.getByTestId("xi-xpts").textContent).toBe("61.2");
    expect(screen.getByText("2 premiums")).toBeTruthy();
    expect(screen.getByText("11 transfers")).toBeTruthy();
    expect(screen.getByText("DC mid")).toBeTruthy();
    expect(screen.getByText("dc_mid fallback: DEF")).toBeTruthy();
  });

  it("calls onUse with the preset name", () => {
    const onUse = vi.fn();
    render(<WildcardPresetCard preset={preset} budgetM={100.4} onUse={onUse} pinned={new Set()} excluded={new Set()} onPin={() => {}} onExclude={() => {}} />);
    fireEvent.click(screen.getByText("Use this squad"));
    expect(onUse).toHaveBeenCalledWith("balanced");
  });

  it("pin and ban buttons report the player id", () => {
    const onPin = vi.fn();
    const onExclude = vi.fn();
    render(<WildcardPresetCard preset={preset} budgetM={100.4} onUse={() => {}} pinned={new Set([9])} excluded={new Set()} onPin={onPin} onExclude={onExclude} />);
    fireEvent.click(screen.getAllByLabelText("Pin P5")[0]);
    expect(onPin).toHaveBeenCalledWith(5);
    fireEvent.click(screen.getAllByLabelText("Ban P5")[0]);
    expect(onExclude).toHaveBeenCalledWith(5);
    expect(screen.getAllByLabelText("Unpin P9").length).toBeGreaterThan(0);
  });
});

describe("WildcardPresetCard summary mode", () => {
  it("renders stats without a pitch and reports selection", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <WildcardPresetCard preset={preset} budgetM={100.4} mode="summary" selected={false} onSelect={onSelect} onUse={() => {}} pinned={new Set()} excluded={new Set()} onPin={() => {}} onExclude={() => {}} />,
    );
    expect(screen.getByTestId("xi-xpts").textContent).toBe("61.2");
    expect(container.querySelector("[data-testid='draft-pitch']")).toBeNull();
    fireEvent.click(screen.getByText("View squad"));
    expect(onSelect).toHaveBeenCalledWith("balanced");
  });
});
