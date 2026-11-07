// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MonitorGwBar } from "./MonitorGwBar";
import { BestXiStrip } from "./BestXiStrip";
import type { MonitorHeadline } from "@/lib/monitorReport";

afterEach(cleanup);

const headline: MonitorHeadline = { app: 70, scout: 69, you: 64, best: 115, basis: "no_captain" };

const renderBar = (over: Partial<Parameters<typeof MonitorGwBar>[0]> = {}) => {
  const props = {
    gw: 9,
    entries: [107342, 5645321],
    entryId: 107342,
    onEntry: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    hasPrev: true,
    hasNext: true,
    state: "finished" as const,
    headline,
    scoutPartial: false,
    ...over,
  };
  render(<MonitorGwBar {...props} />);
  return props;
};

describe("MonitorGwBar", () => {
  it("shows the gameweek, the state and the four chips", () => {
    renderBar();
    expect(screen.getByText("GW 9")).toBeTruthy();
    expect(screen.getByText("Finished")).toBeTruthy();
    expect(screen.getByTestId("chip-app").textContent).toContain("70");
    expect(screen.getByTestId("chip-scout").textContent).toContain("69");
    expect(screen.getByTestId("chip-you").textContent).toContain("64");
    expect(screen.getByTestId("chip-best").textContent).toContain("115");
    expect(screen.getByText("no captains")).toBeTruthy();
  });

  it("shows — for missing values, Live state, and the captains note", () => {
    renderBar({ state: "live", headline: { app: null, scout: null, you: null, best: null, basis: "with_captain" } });
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByTestId("chip-app").textContent).toContain("—");
    expect(screen.getByText("captains doubled")).toBeTruthy();
  });

  it("notes a partial Scout eleven", () => {
    renderBar({ scoutPartial: true });
    expect(screen.getByTestId("chip-scout").textContent).toContain("partial");
  });

  it("drives prev/next and the entry selector", () => {
    const p = renderBar({ hasPrev: false });
    const prev = screen.getByRole("button", { name: /previous gameweek/i }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /next gameweek/i }));
    expect(p.onNext).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Entry"), { target: { value: "5645321" } });
    expect(p.onEntry).toHaveBeenCalledWith(5645321);
  });
});

describe("BestXiStrip", () => {
  it("lists the eleven with the total", () => {
    render(<BestXiStrip strip={{ points: 115, names: ["Verbruggen", "Van Hecke"], reason: null }} />);
    const strip = screen.getByTestId("best-strip");
    expect(strip.textContent).toContain("115");
    expect(strip.textContent).toContain("Verbruggen, Van Hecke");
  });

  it("shows the reason when there is no best eleven", () => {
    render(<BestXiStrip strip={{ points: null, names: [], reason: "gameweek not finished" }} />);
    expect(screen.getByTestId("best-strip").textContent).toContain("gameweek not finished");
  });
});
