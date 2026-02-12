import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameweekNavProps {
  currentGW: number;
  totalGW: number;
  points: number;
  rank: string;
  onPrev: () => void;
  onNext: () => void;
}

export const GameweekNav = ({ currentGW, totalGW, points, rank, onPrev, onNext }: GameweekNavProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPrev}
          disabled={currentGW <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Gameweek {currentGW}</h1>
          <p className="text-xs text-muted-foreground">of {totalGW}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          disabled={currentGW >= totalGW}
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
