// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ChipRoadmapPanel } from "./ChipRoadmapPanel";
import type { ChipPlanResponse } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const basePlan: ChipPlanResponse = {
  entry_id: 123,
  current_gw: 5,
  chips_remaining: [
    { name: "wildcard", available: true, half: 1, expires_gw: 19 },
    { name: "free_hit", available: true, half: 1, expires_gw: 19 },
    { name: "bench_boost", available: false, half: 1, expires_gw: 19 },
    { name: "triple_captain", available: true, half: 1, expires_gw: 19 },
  ],
  horizon_model_gws: 8,
  recommendations: [
    {
      chip: "wildcard",
      event_id: 8,
      ev_gain: 9.1,
      provisional: false,
      reasons: ["Large gap to optimal — squad needs reset"],
      ev_curve: [
        { gw: 5, ev: 4.2 },
        { gw: 8, ev: 9.1 },
      ],
    },
    {
      chip: "triple_captain",
      event_id: 30,
      ev_gain: null,
      provisional: true,
      reasons: ["GW30 is a double gameweek (from announced fixtures)"],
      ev_curve: [],
    },
  ],
  nudge: null,
  transfer_context: { planned_transfers_net_gain: 3.0, wc_alternative_gw: 8 },
};

describe("ChipRoadmapPanel", () => {
  it("renders a row per recommendation with GW and EV", () => {
    render(<ChipRoadmapPanel plan={basePlan} isLoading={false} />);
    expect(screen.getByText("Wildcard")).toBeTruthy();
    expect(screen.getByText(/GW8/)).toBeTruthy();
    expect(screen.getByText(/\+9\.1/)).toBeTruthy();
  });

  it("marks structural-zone recommendations as provisional", () => {
    render(<ChipRoadmapPanel plan={basePlan} isLoading={false} />);
    expect(screen.getByText(/provisional/i)).toBeTruthy();
    expect(screen.getByText("Triple Captain")).toBeTruthy();
  });

  it("shows played chips as used", () => {
    render(<ChipRoadmapPanel plan={basePlan} isLoading={false} />);
    expect(screen.getByText("Bench Boost")).toBeTruthy();
    // "used" appears in both the section header and the row — use getAllByText
    expect(screen.getAllByText(/used/i).length).toBeGreaterThan(0);
  });

  it("shows expiry deadline for available chips without a recommendation", () => {
    render(<ChipRoadmapPanel plan={basePlan} isLoading={false} />);
    // free_hit is available, unrecommended → hold with its expiry shown
    expect(screen.getAllByText(/expires GW19/i).length).toBeGreaterThan(0);
  });

  it("renders loading state without a plan", () => {
    render(<ChipRoadmapPanel plan={undefined} isLoading={true} />);
    expect(screen.getByText(/analyzing chip windows/i)).toBeTruthy();
  });

  it("renders empty state when idle without a plan", () => {
    render(<ChipRoadmapPanel plan={null} isLoading={false} />);
    expect(screen.getByText(/no chip plan/i)).toBeTruthy();
  });
});
