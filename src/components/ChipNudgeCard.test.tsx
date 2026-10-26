// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChipNudgeCard } from "./ChipNudgeCard";
import type { ChipNudge } from "@/lib/fplAssistantApi";

afterEach(cleanup);

const nudge: ChipNudge = { chip: "bench_boost", event_id: 5, ev_gain: 7.1 };

describe("ChipNudgeCard", () => {
  it("renders chip name and EV with an apply CTA", () => {
    render(
      <ChipNudgeCard nudge={nudge} activeChipStrategy="none" onApplyChip={() => {}} />
    );
    expect(screen.getByText(/bench boost/i)).toBeTruthy();
    expect(screen.getByText(/\+7\.1/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /apply/i })).toBeTruthy();
  });

  it("calls onApplyChip with the chip name", () => {
    const onApply = vi.fn();
    render(
      <ChipNudgeCard nudge={nudge} activeChipStrategy="none" onApplyChip={onApply} />
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith("bench_boost");
  });

  it("renders nothing without a nudge", () => {
    const { container } = render(
      <ChipNudgeCard nudge={null} activeChipStrategy="none" onApplyChip={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the chip is already active", () => {
    const { container } = render(
      <ChipNudgeCard
        nudge={nudge}
        activeChipStrategy="bench_boost"
        onApplyChip={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the team-news pill and softened copy when wait_for_team_news is set", () => {
    render(
      <ChipNudgeCard
        nudge={{ chip: "triple_captain", event_id: 5, ev_gain: 6.2, wait_for_team_news: true }}
        activeChipStrategy="none"
        onApplyChip={() => {}}
      />
    );
    expect(screen.getByText(/wait for team news/i)).toBeTruthy();
  });

  it("no pill when wait_for_team_news is absent", () => {
    render(
      <ChipNudgeCard
        nudge={{ chip: "triple_captain", event_id: 5, ev_gain: 6.2 }}
        activeChipStrategy="none"
        onApplyChip={() => {}}
      />
    );
    expect(screen.queryByText(/wait for team news/i)).toBeNull();
  });
});

describe("ChipNudgeCard — wildcard verdict", () => {
  const wc: ChipNudge = { chip: "wildcard", event_id: 9, ev_gain: 14.3, window_gws: [9, 13] };
  const renderWc = (n: ChipNudge, onApply = vi.fn()) => {
    render(
      <MemoryRouter>
        <ChipNudgeCard nudge={n} activeChipStrategy="none" onApplyChip={onApply} />
      </MemoryRouter>,
    );
    return onApply;
  };

  it("renders the wildcard verdict in plain words", () => {
    renderWc(wc);
    expect(
      screen.getByText("Play your wildcard this week · about +14 pts over GW9–13 vs your planned transfers"),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "See the squad" }).getAttribute("href")).toBe("/app/wildcard");
  });

  it("the wildcard link never applies the chip", () => {
    const onApply = renderWc(wc);
    fireEvent.click(screen.getByRole("link", { name: "See the squad" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();
  });

  it("falls back without window_gws", () => {
    renderWc({ chip: "wildcard", event_id: 9, ev_gain: 14.3 });
    expect(
      screen.getByText("Play your wildcard this week · about +14 pts over the next 5 GWs vs your planned transfers"),
    ).toBeTruthy();
  });

  it("other chips are unchanged", () => {
    const onApply = vi.fn();
    render(
      <MemoryRouter>
        <ChipNudgeCard nudge={{ chip: "triple_captain", event_id: 9, ev_gain: 6 }} activeChipStrategy="none" onApplyChip={onApply} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith("triple_captain");
  });
});
