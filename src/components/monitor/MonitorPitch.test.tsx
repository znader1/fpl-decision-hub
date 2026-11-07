// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MonitorPitch } from "./MonitorPitch";
import { parseMonitorReport } from "@/lib/monitorReport";
import { pitchModel } from "@/lib/monitorView";
import gw1 from "@/lib/__tests__/fixtures/monitor_gw1.json";
import gw9 from "@/lib/__tests__/fixtures/monitor_gw9.json";

afterEach(cleanup);

const r9 = parseMonitorReport(gw9)!;
const r1 = parseMonitorReport(gw1)!;

describe("MonitorPitch", () => {
  it("renders the app eleven with its title, total and note", () => {
    render(<MonitorPitch model={pitchModel(r9, "app")} />);
    const pitch = screen.getByTestId("monitor-pitch");
    expect(pitch.getAttribute("data-tone")).toBe("app");
    expect(screen.getAllByTestId("monitor-card")).toHaveLength(11);
    expect(screen.getByRole("heading", { name: "App best XI" })).toBeTruthy();
    expect(screen.getByTestId("pitch-total").textContent).toBe("70");
    expect(screen.getByText("projected 60.0 · £79.9m")).toBeTruthy();
    expect(screen.getByText("72 with captain")).toBeTruthy();
    expect(screen.queryByText("Bench")).toBeNull();
  });

  it("renders the owner's bench of four under the pitch", () => {
    render(<MonitorPitch model={pitchModel(r9, "you")} />);
    expect(screen.getAllByTestId("monitor-card")).toHaveLength(15);
    expect(screen.getByText("Bench")).toBeTruthy();
    expect(screen.getByTestId("pitch-total").textContent).toBe("64");
  });

  it("renders the reason instead of players when the column is unavailable", () => {
    render(<MonitorPitch model={pitchModel(r1, "app")} />);
    expect(screen.queryAllByTestId("monitor-card")).toHaveLength(0);
    expect(screen.getByText("no pre-deadline snapshot")).toBeTruthy();
    expect(screen.getByTestId("pitch-total").textContent).toBe("—");
  });
});
