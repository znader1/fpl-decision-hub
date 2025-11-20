import { Card } from "@/components/ui/card";

interface Player {
  id: number;
  name: string;
  team: string;
  price: number;
  points: number;
}

interface PlayerCardProps {
  player: Player;
}

export const PlayerCard = ({ player }: PlayerCardProps) => {
  return (
    <Card 
      className="w-32 p-3 bg-card/95 backdrop-blur-sm border-2 border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="text-center space-y-1">
        <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
          <span className="text-lg font-bold text-foreground">{player.name.slice(0, 2)}</span>
        </div>
        <h3 className="font-bold text-sm text-foreground truncate">{player.name}</h3>
        <p className="text-xs text-muted-foreground font-medium">{player.team}</p>
        <div className="flex justify-between text-xs pt-2 border-t border-border">
          <span className="text-muted-foreground">£{player.price}m</span>
          <span className="font-semibold text-primary">{player.points}pts</span>
        </div>
      </div>
    </Card>
  );
};
