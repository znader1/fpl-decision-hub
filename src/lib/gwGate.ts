/**
 * What /app should render before a gameweek has been resolved.
 *
 * The bug this closes: `nextEventQuery` ran with `retry: false`, the snap-back
 * effect returns early on `isError` (deliberately — latching the GW-38
 * placeholder is what once pinned users to GW38), and the render then fell
 * through to a bare "Loading…" with no error and no retry. So a single failed
 * /events/next call wedged the app permanently. Only first-time users were
 * exposed, since a stored `fpl_selected_gw` resolves the GW without the API —
 * and Fly's scale-to-zero makes one cold-start 502 enough to trigger it.
 *
 * See docs/prelaunch_audit_2026-09-12.md (U1) in the backend repo.
 */
export type GwGateState = "ready" | "loading" | "error";

export interface GwGateInput {
  /** True once a gameweek is known (from the API or from localStorage). */
  gwResolved: boolean;
  /** The /events/next query failed and is not currently retrying. */
  nextEventError: boolean;
  /** A fetch or retry is in flight. */
  nextEventFetching: boolean;
}

export const resolveGwGateState = ({
  gwResolved,
  nextEventError,
  nextEventFetching,
}: GwGateInput): GwGateState => {
  if (gwResolved) return "ready";
  // A retry in flight outranks the stale error — show the spinner, not the card.
  if (nextEventError && !nextEventFetching) return "error";
  return "loading";
};
