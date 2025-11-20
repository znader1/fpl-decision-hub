import { PlayerCard } from "./PlayerCard";

const mockPlayers = {
  goalkeeper: [{ id: 1, name: "Alisson", team: "LIV", price: 5.5, points: 142 }],
  defenders: [
    { id: 2, name: "Saliba", team: "ARS", price: 6.0, points: 156 },
    { id: 3, name: "TAA", team: "LIV", price: 7.5, points: 178 },
    { id: 4, name: "Gabriel", team: "ARS", price: 6.0, points: 145 },
    { id: 5, name: "Walker", team: "MCI", price: 5.5, points: 134 },
  ],
  midfielders: [
    { id: 6, name: "Salah", team: "LIV", price: 13.0, points: 234 },
    { id: 7, name: "Saka", team: "ARS", price: 9.0, points: 198 },
    { id: 8, name: "Palmer", team: "CHE", price: 10.5, points: 201 },
  ],
  forwards: [
    { id: 9, name: "Haaland", team: "MCI", price: 14.5, points: 267 },
    { id: 10, name: "Watkins", team: "AVL", price: 9.0, points: 187 },
  ],
};

export const PitchVisualization = () => {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Squad</h1>
          <p className="text-muted-foreground">Formation: 4-3-3</p>
        </div>

        <div 
          className="relative rounded-2xl overflow-hidden p-8"
          style={{
            background: `linear-gradient(180deg, 
              hsl(var(--pitch)) 0%, 
              hsl(var(--pitch) / 0.85) 50%, 
              hsl(var(--pitch)) 100%)`,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                hsl(var(--pitch-lines) / 0.1) 100px,
                hsl(var(--pitch-lines) / 0.1) 101px
              )
            `,
            minHeight: "700px",
          }}
        >
          {/* Goalkeeper */}
          <div className="flex justify-center mb-16">
            {mockPlayers.goalkeeper.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-4 mb-16">
            {mockPlayers.defenders.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center gap-8 mb-16">
            {mockPlayers.midfielders.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Forwards */}
          <div className="flex justify-center gap-12">
            {mockPlayers.forwards.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
