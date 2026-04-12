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
}: GameweekNavProps) => {
  return (
    <div className="flex items-center gap-3 mb-5 bg-card border border-border rounded-xl px-4 py-2.5">
      {/* GW navigation */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
            <SelectTrigger className="h-8 w-[108px] text-sm font-bold border-0 bg-transparent focus:ring-0 px-2">
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
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onNext}
          disabled={!navEnabled || currentGW >= totalGW}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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
