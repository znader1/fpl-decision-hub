import { Zap } from "lucide-react";
import {
  CHIP_LABELS,
  type ChipName,
  type ChipNudge,
  type FplChipStrategy,
} from "@/lib/fplAssistantApi";

type Props = {
  nudge: ChipNudge | null | undefined;
  activeChipStrategy: FplChipStrategy;
  onApplyChip: (chip: ChipName) => void;
};

export const ChipNudgeCard = ({ nudge, activeChipStrategy, onApplyChip }: Props) => {
  if (!nudge || nudge.chip === activeChipStrategy) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
      <Zap className="h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm min-w-0">
        <span className="font-semibold">{CHIP_LABELS[nudge.chip]}</span> this gameweek
        projects <span className="font-semibold text-primary">+{nudge.ev_gain.toFixed(1)} xPts</span>{" "}
        over holding it.
      </p>
      <button
        onClick={() => onApplyChip(nudge.chip)}
        className="ml-auto shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Apply chip
      </button>
    </div>
  );
};
