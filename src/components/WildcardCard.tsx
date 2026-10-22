import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { CHIP_LABELS, type ChipOutlookRow } from "@/lib/fplAssistantApi";
import { fmtGain } from "@/lib/format";

type Props = {
  /** The chip plan's wildcard outlook row; absent once the wildcard is played. */
  row: ChipOutlookRow | undefined;
  /** The GW the preview drafts for (the deadline GW) — not necessarily the best week. */
  draftGw?: number;
  /** The pitch is showing the wildcard draft. */
  previewing: boolean;
  /** ZN Pick is running; the button waits for it. */
  busy?: boolean;
  onToggle: () => void;
};

/** The wildcard on the main page: its best week and the engine's guidance, with a
 *  preview of the wildcard draft on the pitch. Quieter than ChipNudgeCard — it is an
 *  option, not a recommendation, until the backend's wildcard timing clears its bar. */
export const WildcardCard = ({ row, draftGw, previewing, busy = false, onToggle }: Props) => {
  const [why, setWhy] = useState(false);
  if (!row) return null;
  const best = row.event_id !== null && row.ev_gain !== null ? { gw: row.event_id, gain: row.ev_gain } : null;

  const guidance = previewing
    ? `The pitch shows a wildcard${draftGw ? ` for GW${draftGw}` : ""}, drafted on your horizon setting${
        best && draftGw && best.gw !== draftGw ? ` — not the GW${best.gw} window above` : ""
      }. Play it from the Chip step.`
    : row.guidance;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-start gap-2 text-sm">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p>
            <span className="font-semibold">{CHIP_LABELS.wildcard}</span>
            {best ? (
              <>
                {" "}
                · best week GW{best.gw}: <span className="font-semibold text-primary">{fmtGain(best.gain)} xPts</span>
                <span className="hidden sm:inline"> over the weeks from there, beyond what your planned transfers already gain</span>
              </>
            ) : (
              " · no wildcard week stands out yet"
            )}
          </p>
          {/* Phones: one line plus a Why toggle. Wider screens: the guidance inline. */}
          <button
            type="button"
            onClick={() => setWhy((v) => !v)}
            aria-expanded={why}
            className="mt-0.5 text-xs font-medium text-primary sm:hidden"
          >
            {why ? "Hide" : "Why"}
          </button>
          <p className={`mt-0.5 text-xs text-muted-foreground sm:block ${why ? "" : "hidden"}`}>{guidance}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className="w-full shrink-0 rounded-md border border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:ml-auto sm:w-auto"
      >
        {previewing ? "Back to my squad" : `See ${draftGw ? `GW${draftGw} ` : ""}wildcard draft`}
      </button>
    </div>
  );
};
