import { ChevronLeft, ChevronRight, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GameweekNavProps {
  currentGW: number;
  totalGW: number;
  points: number;
  rank: string;
  onPrev: () => void;
  onNext: () => void;
  navEnabled?: boolean;
  onSelectGW?: (gw: number) => void;
  isRecommendation?: boolean;
  isLiveGw?: boolean;
  /** `Date.now()`-style timestamp of the last successful squad fetch. */
  updatedAt?: number | null;
}

export const GameweekNav = ({
  currentGW,
  totalGW,
  points,
  rank,
  onPrev,
  onNext,
  navEnabled = true,
  onSelectGW,
  isRecommendation = false,
  isLiveGw = false,
  updatedAt = null,
}: GameweekNavProps) => {
  const stateLabel = isLiveGw ? "Live" : "Planning";
  const stateDotClass = isLiveGw ? "bg-rose-500 animate-pulse" : "bg-emerald-500";
  // Only while live: a frozen score and a genuine zero look identical without
  // a timestamp, and the difference is the whole reason to trust the number.
  const updatedLabel =
    isLiveGw && typeof updatedAt === "number" && updatedAt > 0
      ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5 bg-card border border-border rounded-xl px-4 py-2.5">
      {/* GW navigation */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Previous gameweek"
          onClick={onPrev}
          disabled={!navEnabled || currentGW <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {onSelectGW ? (
          <Select
            value={String(currentGW)}
            onValueChange={(v) => onSelectGW(Number(v))}
            disabled={!navEnabled}
          >
            <SelectTrigger className="h-8 w-[108px] text-sm font-bold text-foreground border-0 bg-transparent focus:ring-0 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalGW }, (_, i) => i + 1).map((gw) => (
                <SelectItem key={gw} value={String(gw)}>
                  GW {gw}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm font-bold text-foreground w-[108px] text-center">
            Gameweek {currentGW}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Next gameweek"
          onClick={onNext}
          disabled={!navEnabled || currentGW >= totalGW}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* State pill */}
      <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-muted/50 px-2 py-0.5">
        <span className={`h-1.5 w-1.5 rounded-full ${stateDotClass}`} />
        <span className="text-[11px] font-medium text-muted-foreground">{stateLabel}</span>
        {updatedLabel && (
          <span className="text-[11px] text-muted-foreground/70" title="Last refreshed">
            · {updatedLabel}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border shrink-0" />

      {/* Stats */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">
            {isRecommendation ? "Proj. xPts" : "GW Pts"}
          </span>
          <span className="text-sm font-bold text-primary tabular-nums">{points}</span>
        </div>

        {!isRecommendation && rank !== "—" && (
          <>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">Rank</span>
              <span className="text-sm font-bold text-foreground tabular-nums truncate">{rank}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
