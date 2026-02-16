import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
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
}: GameweekNavProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPrev}
          disabled={!navEnabled || currentGW <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          {onSelectGW ? (
            <div className="flex flex-col items-center gap-1">
              <Select
                value={String(currentGW)}
                onValueChange={(value) => onSelectGW(Number(value))}
                disabled={!navEnabled}
              >
                <SelectTrigger className="h-9 w-[160px] text-base font-bold justify-center">
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
              <p className="text-xs text-muted-foreground">of {totalGW}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Gameweek {currentGW}</h1>
              <p className="text-xs text-muted-foreground">of {totalGW}</p>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          disabled={!navEnabled || currentGW >= totalGW}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">GW Points</p>
          <p className="text-2xl font-bold text-primary">{points}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 justify-center">
            <Trophy className="h-3 w-3" />
            Overall Rank
          </p>
          <p className="text-lg font-bold text-foreground">{rank}</p>
        </div>
      </div>
    </div>
  );
};
