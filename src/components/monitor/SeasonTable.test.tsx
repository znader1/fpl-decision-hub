// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SeasonTable } from "./SeasonTable";
import { SeasonSideCards } from "./SeasonSideCards";
import type { SeasonRow } from "@/lib/monitorRemote";
import { seasonRows, seasonSummary } from "@/lib/monitorView";

afterEach(cleanup);

const row = (over: Partial<SeasonRow>): SeasonRow => ({
  season: "2026-27",
  gw: 1,
  entry_id: 107342,
  state: "finished",
  built_at: "",
  headline: { app: null, scout: null, you: null, best: null, basis: "no_captain" },
  transfers_verdict: null,
  wildcard_verdict: null,
  captain: null,
  app_projected: null,
  app_points_no_captain: null,
  chip_week: false,
  ...over,
});

const SEASON: SeasonRow[] = [
  row({ gw: 1, headline: { app: null, scout: null, you: 56, best: 148, basis: "no_captain" } }),
  row({ gw: 2, headline: { app: 109, scout: 96, you: 84, best: 143, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept", app_projected: 70, app_points_no_captain: 95 }),
  row({ gw: 3, headline: { app: 57, scout: 60, you: 49, best: 127, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept" }),
  row({ gw: 4, headline: { app: 80, scout: 80, you: 90, best: 146, basis: "with_captain" }, transfers_verdict: "you", wildcard_verdict: "kept" }),
  row({ gw: 5, headline: { app: 50, scout: 57, you: 42, best: 150, basis: "with_captain" }, transfers_verdict: "level", wildcard_verdict: "kept" }),
  row({ gw: 6, headline: { app: 48, scout: 38, you: 75, best: 132, basis: "with_captain" }, transfers_verdict: "level" }),
  row({ gw: 7, headline: { app: 56, scout: 64, you: 76, best: 127, basis: "with_captain" }, chip_week: true }),
  row({ gw: 8, headline: { app: 56, scout: 48, you: 32, best: 128, basis: "with_captain" } }),
  row({ gw: 9, headline: { app: 70, scout: 69, you: 64, best: 115, basis: "no_captain" }, app_projected: 60, app_points_no_captain: 70 }),
  row({ gw: 10, state: "live", headline: { app: null, scout: null, you: null, best: null, basis: "with_captain" } }),
];

const rows = seasonRows(SEASON, 107342, "2026-27");

describe("SeasonTable", () => {
  it("renders one row per gameweek with the running totals and opens a gameweek on click", () => {
    const onOpenGw = vi.fn();
    render(<SeasonTable rows={rows} onOpenGw={onOpenGw} />);
    const trs = screen.getAllByRole("row").filter((r) => r.getAttribute("aria-label")?.startsWith("Open gameweek"));
    expect(trs).toHaveLength(10);
    const gw9 = screen.getByRole("row", { name: "Open gameweek 9" });
    expect(gw9.textContent).toContain("526");
    expect(gw9.textContent).toContain("512");
    expect(gw9.textContent).toContain("App");
    const gw1 = screen.getByRole("row", { name: "Open gameweek 1" });
    expect(gw1.textContent).toContain("—");
    const gw10 = screen.getByRole("row", { name: "Open gameweek 10" });
    expect(gw10.textContent).toContain("Live");
    fireEvent.click(gw9);
    expect(onOpenGw).toHaveBeenCalledWith(9);
  });

  it("says so when there are no rows", () => {
    render(<SeasonTable rows={[]} onOpenGw={vi.fn()} />);
    expect(screen.getByText("No gameweeks yet")).toBeTruthy();
  });
});

describe("SeasonSideCards", () => {
  it("shows the four records", () => {
    render(<SeasonSideCards summary={seasonSummary(rows)} />);
    expect(screen.getByTestId("season-transfers").textContent).toBe("app 0 · you 3 · level 2 · open 2");
    expect(screen.getByTestId("season-wildcard").textContent).toBe("app 0 · kept 4 · level 0 · open 4");
    expect(screen.getByTestId("season-captain").textContent).toBe("no captain data yet");
    expect(screen.getByTestId("season-projection").textContent).toBe("mean −17.5, abs 17.5 over 2 gameweeks");
  });

  it("is empty-safe", () => {
    render(<SeasonSideCards summary={seasonSummary([])} />);
    expect(screen.getByTestId("season-projection").textContent).toBe("no finished gameweek with an app column yet");
  });
});
