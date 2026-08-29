// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GameweekNav } from "./GameweekNav";

afterEach(cleanup);

const base = {
  currentGW: 2,
  totalGW: 38,
  points: 44,
  rank: "412,338",
  onPrev: () => {},
  onNext: () => {},
};

describe("live-gameweek indicator", () => {
  it("labels a live gameweek and stamps the refresh time", () => {
    // A frozen score and a genuine zero are indistinguishable without this.
    const at = new Date("2026-08-29T14:35:00Z").getTime();
    render(<GameweekNav {...base} isLiveGw updatedAt={at} />);
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByTitle("Last refreshed")).toBeTruthy();
  });

  it("hides the timestamp outside a live gameweek", () => {
    render(<GameweekNav {...base} isLiveGw={false} updatedAt={Date.now()} />);
    expect(screen.getByText("Planning")).toBeTruthy();
    expect(screen.queryByTitle("Last refreshed")).toBeNull();
  });

  it("hides the timestamp when nothing has been fetched yet", () => {
    render(<GameweekNav {...base} isLiveGw updatedAt={0} />);
    expect(screen.queryByTitle("Last refreshed")).toBeNull();
  });
});
