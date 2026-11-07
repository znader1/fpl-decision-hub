// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Monitor from "./Monitor";
import { parseMonitorReport } from "@/lib/monitorReport";
import type { MonitorRemote, SeasonRow } from "@/lib/monitorRemote";
import gw1Json from "@/lib/__tests__/fixtures/monitor_gw1.json";
import gw9Json from "@/lib/__tests__/fixtures/monitor_gw9.json";

const ownerState = { owner: true as boolean | null, loading: false, error: null as unknown, refetch: vi.fn() };
vi.mock("@/hooks/useMonitorOwner", () => ({ useMonitorOwner: () => ownerState }));
vi.mock("@/components/layout/Navbar", () => ({ Navbar: () => <div data-testid="navbar" /> }));
// The page defaults to the real remote, whose module builds the Supabase client from env.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

afterEach(cleanup);
beforeEach(() => {
  ownerState.owner = true;
  ownerState.loading = false;
  ownerState.error = null;
});

const reports = {
  1: parseMonitorReport(gw1Json)!,
  9: parseMonitorReport(gw9Json)!,
};

const row = (gw: number, entry: number, headline: SeasonRow["headline"], state: SeasonRow["state"] = "finished"): SeasonRow => ({
  season: "2026-27",
  gw,
  entry_id: entry,
  state,
  built_at: "",
  headline,
  transfers_verdict: null,
  wildcard_verdict: null,
  captain: null,
  app_projected: null,
  app_points_no_captain: null,
  chip_week: false,
});

const listing: SeasonRow[] = [
  row(1, 107342, { app: null, scout: null, you: 56, best: 148, basis: "no_captain" }),
  row(9, 107342, { app: 70, scout: 69, you: 64, best: 115, basis: "no_captain" }),
  row(10, 107342, { app: null, scout: null, you: null, best: null, basis: "with_captain" }, "live"),
  row(9, 5645321, { app: 70, scout: 69, you: 40, best: 115, basis: "no_captain" }),
];

const fakeRemote = (over: Partial<MonitorRemote> = {}): MonitorRemote => ({
  isOwner: async () => true,
  listSeason: async () => listing,
  loadReport: async (_season, entry, gw) => (entry === 107342 ? (reports as Record<number, typeof reports[1]>)[gw] ?? null : null),
  ...over,
});

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.search}</div>;
}

const renderAt = (path: string, remote = fakeRemote()) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/app/monitor"
            element={
              <>
                <Monitor remote={remote} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Monitor page: owner gate", () => {
  it("shows the not-found page to a non-owner", () => {
    ownerState.owner = false;
    renderAt("/app/monitor");
    expect(screen.getByText("404")).toBeTruthy();
  });

  it("shows a spinner while the owner check runs, never a 404", () => {
    ownerState.owner = null;
    ownerState.loading = true;
    renderAt("/app/monitor");
    expect(screen.queryByText("404")).toBeNull();
    expect(screen.getByTestId("monitor-loading")).toBeTruthy();
  });

  it("shows a retry card on an owner-check error", () => {
    ownerState.owner = null;
    ownerState.error = new Error("network");
    renderAt("/app/monitor");
    expect(screen.queryByText("404")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(ownerState.refetch).toHaveBeenCalled();
  });
});

describe("Monitor page: gameweek tab", () => {
  it("renders three pitches and the chips for the requested gameweek", async () => {
    renderAt("/app/monitor?entry=107342&gw=9");
    await waitFor(() => expect(screen.getAllByTestId("monitor-pitch")).toHaveLength(3));
    expect(screen.getByTestId("chip-app").textContent).toContain("70");
    expect(screen.getByTestId("chip-scout").textContent).toContain("69");
    expect(screen.getByTestId("chip-you").textContent).toContain("64");
    expect(screen.getByTestId("chip-best").textContent).toContain("115");
    expect(screen.getByTestId("transfers-card")).toBeTruthy();
    expect(screen.getByTestId("captain-card")).toBeTruthy();
    expect(screen.getByTestId("wildcard-card")).toBeTruthy();
    expect(screen.getByTestId("buy-lists-card")).toBeTruthy();
    expect(screen.getByTestId("best-strip").textContent).toContain("115");
  });

  it("opens on the entry's latest gameweek when the URL names none", async () => {
    renderAt("/app/monitor");
    await waitFor(() => expect(screen.getByText("GW 10")).toBeTruthy());
    expect(screen.getByText("No report for GW 10")).toBeTruthy();
  });

  it("steps to the previous gameweek and writes it to the URL", async () => {
    renderAt("/app/monitor?entry=107342&gw=9");
    await waitFor(() => expect(screen.getAllByTestId("monitor-pitch")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: /previous gameweek/i }));
    await waitFor(() => expect(screen.getByText("GW 1")).toBeTruthy());
    expect(screen.getByTestId("location").textContent).toContain("gw=1");
    await waitFor(() => expect(screen.getByText("no pre-deadline snapshot")).toBeTruthy());
  });

  it("says so when there are no reports at all", async () => {
    renderAt("/app/monitor", fakeRemote({ listSeason: async () => [] }));
    await waitFor(() => expect(screen.getByText("No reports yet. Run the backfill job.")).toBeTruthy());
  });
});

describe("Monitor page: season tab", () => {
  it("shows the table and opens a gameweek from a row", async () => {
    renderAt("/app/monitor?entry=107342&tab=season");
    await waitFor(() => expect(screen.getByRole("row", { name: "Open gameweek 9" })).toBeTruthy());
    fireEvent.click(screen.getByRole("row", { name: "Open gameweek 9" }));
    await waitFor(() => expect(screen.getAllByTestId("monitor-pitch")).toHaveLength(3));
    expect(screen.getByTestId("location").textContent).toContain("gw=9");
    expect(screen.getByTestId("location").textContent).toContain("tab=gameweek");
  });
});
