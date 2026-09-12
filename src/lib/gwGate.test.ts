import { describe, it, expect } from "vitest";

import { resolveGwGateState } from "./gwGate";

/**
 * Regression guard for the wedged-/app bug (audit finding U1).
 *
 * `nextEventQuery` ran with `retry: false`, the snap-back effect returns early
 * on `isError` (deliberately — latching the GW-38 placeholder is what once
 * pinned users to GW38), and the render then fell through to a bare "Loading…"
 * with no error and no retry. One failed /events/next call wedged the app.
 */
describe("resolveGwGateState", () => {
  it("is ready once a gameweek is resolved", () => {
    expect(
      resolveGwGateState({
        gwResolved: true,
        nextEventError: false,
        nextEventFetching: false,
      }),
    ).toBe("ready");
  });

  it("surfaces an error instead of loading forever when next-event fails", () => {
    expect(
      resolveGwGateState({
        gwResolved: false,
        nextEventError: true,
        nextEventFetching: false,
      }),
    ).toBe("error");
  });

  it("shows loading while a retry is in flight, not the stale error", () => {
    expect(
      resolveGwGateState({
        gwResolved: false,
        nextEventError: true,
        nextEventFetching: true,
      }),
    ).toBe("loading");
  });

  it("shows loading on the first attempt", () => {
    expect(
      resolveGwGateState({
        gwResolved: false,
        nextEventError: false,
        nextEventFetching: true,
      }),
    ).toBe("loading");
  });

  it("stays ready even if a later refetch errors", () => {
    expect(
      resolveGwGateState({
        gwResolved: true,
        nextEventError: true,
        nextEventFetching: false,
      }),
    ).toBe("ready");
  });
});
