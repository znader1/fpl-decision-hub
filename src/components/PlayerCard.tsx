import { JerseyIcon } from "./JerseyIcon";

export interface Player {
  id: number;
  name: string;
  team: string;
  price?: number;
  points: number;
  number?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface PlayerCardProps {
  player: Player;
}

const formatPoints = (points: number) => {
  if (!Number.isFinite(points)) return "—";
  if (Number.isInteger(points)) return points.toString();
  return points.toFixed(2).replace(/\.?0+$/, "");
};

export const PlayerCard = ({ player }: PlayerCardProps) => {
  return (
    <div className="flex flex-col items-center gap-1 group cursor-pointer">
      <div className="relative transition-transform group-hover:scale-110">
        <JerseyIcon
          team={player.team}
          number={player.number}
          size="md"
          isCaptain={player.isCaptain}
        />
        {player.isViceCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted-foreground flex items-center justify-center text-[8px] font-bold text-background border border-background">
            V
          </div>
        )}
      </div>
      <div className="bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 text-center shadow-sm border border-border min-w-[80px]">
        <p className="text-xs font-bold text-foreground truncate">{player.name}</p>
        <div className="flex justify-center gap-2 text-[10px]">
          <span className="text-muted-foreground">{player.team}</span>
          <span className="font-semibold text-primary">{formatPoints(player.points)}</span>
        </div>
      </div>
    </div>
  );
};
