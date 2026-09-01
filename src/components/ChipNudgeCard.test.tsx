// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});
