// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ChipStep } from "./ChipStep";
import type { ChipOption } from "@/lib/planFlow";

afterEach(cleanup);

const options: ChipOption[] = [
  { chip: "none", title: "Save chips", zn: true, gain: 0, why: "keep them", used: false },
  { chip: "wildcard", title: "Wildcard", zn: false, gain: 12.3, gainNote: "over 5 GWs", why: "fixture swing", used: false },
];

describe("ChipStep", () => {
  it("links the wildcard option to the three-squad comparison without picking it", () => {
    const onPick = vi.fn();
    render(<ChipStep options={options} value={null} onPick={onPick} />);
    const link = screen.getByText("Compare three wildcard squads");
    expect(link.closest("a")?.getAttribute("href")).toBe("/app/wildcard");
    fireEvent.click(link);
    expect(onPick).not.toHaveBeenCalled();
  });
});
