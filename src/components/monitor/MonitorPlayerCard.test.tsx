// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MonitorPlayerCard } from "./MonitorPlayerCard";
import type { CardModel } from "@/lib/monitorView";

afterEach(cleanup);

const base: CardModel = {
  id: 566,
  name: "Silva",
  club: "BOU",
  pos: "DEF",
  points: 8,
  xpts: 5.78,
  isCaptain: false,
  isVice: false,
  doubled: false,
  shared: false,
  faded: false,
};

const renderCard = (over: Partial<CardModel> = {}) => render(<MonitorPlayerCard card={{ ...base, ...over }} />);

describe("MonitorPlayerCard", () => {
  it("shows the name, club, points then the projection", () => {
    renderCard();
    const card = screen.getByTestId("monitor-card");
    expect(card.textContent).toContain("Silva");
    expect(card.textContent).toContain("BOU");
    expect(screen.getByTitle("Points").textContent).toBe("8");
    expect(screen.getByTitle("App projection").textContent).toBe("5.8");
  });

  it("shows — for a missing projection and for missing points", () => {
    renderCard({ xpts: null, points: null });
    expect(screen.getByTitle("Points").textContent).toBe("—");
    expect(screen.getByTitle("App projection").textContent).toBe("—");
  });

  it("flags shared and faded cards for styling", () => {
    renderCard({ shared: true, faded: true });
    const card = screen.getByTestId("monitor-card");
    expect(card.getAttribute("data-shared")).toBe("true");
    expect(card.getAttribute("data-faded")).toBe("true");
  });

  it("marks the vice and the doubled captain", () => {
    renderCard({ isVice: true });
    expect(screen.getByText("V")).toBeTruthy();
    cleanup();
    renderCard({ isCaptain: true, doubled: true, points: 26 });
    expect(screen.getByTitle("Points").textContent).toBe("26");
    expect(screen.getByTestId("monitor-card").getAttribute("data-doubled")).toBe("true");
  });
});
