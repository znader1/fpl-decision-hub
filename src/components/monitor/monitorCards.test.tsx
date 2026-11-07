// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TransfersCard } from "./TransfersCard";
import { BuyListsCard } from "./BuyListsCard";
import { MonitorCaptainCard } from "./MonitorCaptainCard";
import { MonitorWildcardCard } from "./MonitorWildcardCard";
import { parseMonitorReport, type MonitorReport } from "@/lib/monitorReport";
import gw1Json from "@/lib/__tests__/fixtures/monitor_gw1.json";
import gw7Json from "@/lib/__tests__/fixtures/monitor_gw7.json";
import gw9Json from "@/lib/__tests__/fixtures/monitor_gw9.json";

afterEach(cleanup);

const gw1 = parseMonitorReport(gw1Json)!;
const gw7 = parseMonitorReport(gw7Json)!;
const gw9 = parseMonitorReport(gw9Json)!;
const clone = (r: MonitorReport): MonitorReport => JSON.parse(JSON.stringify(r));

describe("TransfersCard", () => {
  it("names both moves with their gains and says the contest is open", () => {
    render(<TransfersCard report={gw9} />);
    const card = screen.getByTestId("transfers-card");
    expect(card.textContent).toContain("Calafiori → Silva");
    expect(card.textContent).toContain("Maguire → Van Hecke");
    expect(screen.getByTestId("transfers-app-3").textContent).toBe("+2 · 1 of 3");
    expect(screen.getByTestId("transfers-you-3").textContent).toBe("+15 · 1 of 3");
    expect(screen.getByTestId("transfers-app-1").textContent).toBe("+2");
    expect(screen.getByTestId("transfers-verdict").textContent).toBe("Open (1 of 3 played)");
    expect(screen.getByText("rebuilt")).toBeTruthy();
  });

  it("says chip week and shows no verdict", () => {
    render(<TransfersCard report={gw7} />);
    expect(screen.getByText("Chip week: no transfer contest")).toBeTruthy();
    expect(screen.queryByTestId("transfers-verdict")).toBeNull();
  });

  it("shows the app side's reason and 'no transfer' for an empty move list", () => {
    render(<TransfersCard report={gw1} />);
    expect(screen.getByText("no advice stored or rebuilt for this gameweek")).toBeTruthy();
    expect(screen.getByText("no transfer")).toBeTruthy();
  });

  it("shows a settled verdict and a hit", () => {
    const r = clone(gw9);
    r.transfers.verdict = "you";
    (r.transfers.you as { hits: number }).hits = 1;
    render(<TransfersCard report={r} />);
    expect(screen.getByTestId("transfers-verdict").textContent).toBe("You, over 3 gameweeks");
    expect(screen.getByText("−4 hit")).toBeTruthy();
  });
});

describe("BuyListsCard", () => {
  it("lists both sides with averages", () => {
    render(<BuyListsCard report={gw9} />);
    const card = screen.getByTestId("buy-lists-card");
    expect(card.textContent).toContain("Gabriel");
    expect(card.textContent).toContain("Manzambi");
    expect(screen.getByTestId("buy-avg-app").textContent).toBe("5.0 · 5.0 · 5.0");
    expect(screen.getByTestId("buy-avg-scout").textContent).toBe("8.8 · 8.8 · 8.8");
  });

  it("shows the reason when a side is unavailable", () => {
    render(<BuyListsCard report={gw1} />);
    expect(screen.getByText("no advice stored or rebuilt for this gameweek")).toBeTruthy();
    expect(screen.getByTestId("buy-avg-scout").textContent).toBe("2.5 · 16.8 · 22.0");
  });
});

describe("MonitorCaptainCard", () => {
  it("shows the five lines with the inferred note", () => {
    render(<MonitorCaptainCard report={gw9} />);
    expect(screen.getByTestId("captain-app_for_you").textContent).toBe("Haaland · 2");
    expect(screen.getByTestId("captain-scout").textContent).toBe("Haaland · 2 (inferred)");
    expect(screen.getByTestId("captain-you").textContent).toBe("Haaland · 2");
    expect(screen.getByTestId("captain-best_in_squad").textContent).toBe("Van Hecke · 15");
    expect(screen.getByTestId("captain-best_overall").textContent).toBe("Van Hecke · 15");
  });

  it("shows — for a missing line", () => {
    render(<MonitorCaptainCard report={gw1} />);
    expect(screen.getByTestId("captain-scout").textContent).toBe("—");
    expect(screen.getByTestId("captain-best_in_squad").textContent).toBe("João Pedro · 11");
  });
});

describe("MonitorWildcardCard", () => {
  it("shows the kept squad, the headline preset first, the Scout reason and the actual", () => {
    render(<MonitorWildcardCard report={gw9} />);
    const card = screen.getByTestId("wildcard-card");
    expect(card.textContent).toContain("5 gameweeks from GW 9");
    const rows = screen.getAllByTestId("wildcard-row").map((r) => r.textContent);
    expect(rows[0]).toContain("Kept squad");
    expect(rows[0]).toContain("67");
    expect(rows[1]).toContain("Balanced");
    expect(rows[1]).toContain("58");
    expect(rows[2]).toContain("Aggressive");
    expect(rows[3]).toContain("Gems");
    expect(card.textContent).toContain("no Scout wildcard squad this gameweek");
    expect(card.textContent).toContain("You scored");
    expect(card.textContent).toContain("64");
    expect(screen.getByTestId("wildcard-verdict").textContent).toBe("Open (1 of 5 played)");
  });

  it("shows the reasons and the absent players on GW1", () => {
    const r = clone(gw1);
    (r.wildcard.kept as { absent_by_gw: Record<string, number[]> }).absent_by_gw = { "3": [411] };
    render(<MonitorWildcardCard report={r} />);
    const card = screen.getByTestId("wildcard-card");
    expect(card.textContent).toContain("no advice stored or rebuilt for this gameweek");
    expect(card.textContent).toContain("squad article needs review");
    expect(card.textContent).toContain("could not field 1 player in GW 3");
    expect(card.textContent).toContain("no projection for GW 1");
  });

  it("shows a settled verdict", () => {
    const r = clone(gw9);
    r.wildcard.verdict = "kept";
    render(<MonitorWildcardCard report={r} />);
    expect(screen.getByTestId("wildcard-verdict").textContent).toBe("Kept squad, over 5 gameweeks");
  });
});
