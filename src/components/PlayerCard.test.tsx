// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PlayerCard, type Player } from "./PlayerCard";

afterEach(cleanup);

const basePlayer: Player = {
  id: 1,
  name: "Haaland",
  team: "MCI",
  teamName: "Man City",
  points: 6.4,
};

const renderCard = (over: Partial<Player> = {}) =>
  render(<PlayerCard player={{ ...basePlayer, ...over }} />);

describe("points under the player", () => {
  it("shows the projection when no actual points exist", () => {
    renderCard();
    expect(screen.getByText("6.4")).toBeTruthy();
  });

  it("shows actual points for a finished gameweek, not the projection", () => {
    // Browsing back to a finished GW used to fall through to the projection
    // because the actual score was gated on isLiveGw.
    renderCard({ livePoints: 13, isLiveGw: false });
    const actual = screen.getByTitle("Final points");
    expect(actual.textContent).toBe("13");
  });

  it("marks actual points as live during the current gameweek", () => {
    renderCard({ livePoints: 9, isLiveGw: true });
    expect(screen.getByTitle("Live points").textContent).toBe("9");
  });

  it("shows the projection alongside the actual score", () => {
    renderCard({ livePoints: 9, isLiveGw: true });
    expect(screen.getByTitle("Projected points").textContent).toBe("6.4");
  });

  it("renders a dash when neither a score nor a projection is available", () => {
    renderCard({ points: Number.NaN });
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("does not render a stray separator when only an actual score exists", () => {
    renderCard({ points: Number.NaN, livePoints: 4 });
    expect(screen.queryByTitle("Projected points")).toBeNull();
    expect(screen.getByTitle("Final points").textContent).toBe("4");
  });

  it("shows a zero score rather than treating it as missing", () => {
    renderCard({ livePoints: 0, isLiveGw: true });
    expect(screen.getByTitle("Live points").textContent).toBe("0");
  });
});
