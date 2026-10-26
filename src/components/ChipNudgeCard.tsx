import { RefreshCw, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  CHIP_LABELS,
  type ChipName,
  type ChipNudge,
  type FplChipStrategy,
} from "@/lib/fplAssistantApi";
import { gwRange } from "@/lib/format";

type Props = {
  nudge: ChipNudge | null | undefined;
  activeChipStrategy: FplChipStrategy;
  onApplyChip: (chip: ChipName) => void;
};

/** The wildcard's verdict in plain words — the only time the main page mentions
 *  the wildcard. It links to the three-squad page and never commits the chip:
 *  the Chip step is where the plan records it. */
const wildcardVerdict = (nudge: ChipNudge) => {
  const range = nudge.window_gws
    ? gwRange({ start_gw: nudge.window_gws[0], end_gw: nudge.window_gws[1] })
    : "the next 5 GWs";
  return `Play your wildcard this week · about +${Math.round(nudge.ev_gain)} pts over ${range} vs your planned transfers`;
};

export const ChipNudgeCard = ({ nudge, activeChipStrategy, onApplyChip }: Props) => {
  if (!nudge || nudge.chip === activeChipStrategy) return null;

  if (nudge.chip === "wildcard") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-start gap-2 text-sm">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="min-w-0">{wildcardVerdict(nudge)}</p>
        </div>
        <Link
          to="/app/wildcard"
          className="w-full shrink-0 rounded-md border border-primary/50 px-3 py-1.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:ml-auto sm:w-auto"
        >
          See the squad
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
      <Zap className="h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm min-w-0">
        <span className="font-semibold">{CHIP_LABELS[nudge.chip]}</span> this gameweek
        projects <span className="font-semibold text-primary">+{nudge.ev_gain.toFixed(1)} xPts</span>{" "}
        over holding it
        {nudge.p_beats_bar !== undefined && (
          <>
            {" "}
            <span className="text-muted-foreground whitespace-nowrap">
              · {Math.round(nudge.p_beats_bar * 100)}% chance it beats the bar
            </span>
          </>
        )}
        .
      </p>
      {nudge.wait_for_team_news && (
        <span className="shrink-0 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          post-break — wait for team news
        </span>
      )}
      <button
        onClick={() => onApplyChip(nudge.chip)}
        className="ml-auto shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Apply chip
      </button>
    </div>
  );
};
