import { useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { GameweekNav } from "./GameweekNav";

const gameweekData: Record<number, {
  points: number;
  rank: string;
  players: {
    goalkeeper: typeof defaultPlayers.goalkeeper;
    defenders: typeof defaultPlayers.defenders;
    midfielders: typeof defaultPlayers.midfielders;
    forwards: typeof defaultPlayers.forwards;
  };
}> = {};

const defaultPlayers = {
  goalkeeper: [{ id: 1, name: "Alisson", team: "LIV", price: 5.5, points: 6, number: 1 }],
  defenders: [
    { id: 2, name: "Saliba", team: "ARS", price: 6.0, points: 9, number: 2 },
    { id: 3, name: "TAA", team: "LIV", price: 7.5, points: 12, number: 66 },
    { id: 4, name: "Gabriel", team: "ARS", price: 6.0, points: 6, number: 6 },
    { id: 5, name: "Gvardiol", team: "MCI", price: 5.5, points: 2, number: 24 },
  ],
  midfielders: [
    { id: 6, name: "Salah", team: "LIV", price: 13.0, points: 15, number: 11, isCaptain: true },
    { id: 7, name: "Saka", team: "ARS", price: 9.0, points: 8, number: 7 },
    { id: 8, name: "Palmer", team: "CHE", price: 10.5, points: 11, number: 20, isViceCaptain: true },
  ],
  forwards: [
    { id: 9, name: "Haaland", team: "MCI", price: 14.5, points: 13, number: 9 },
    { id: 10, name: "Watkins", team: "AVL", price: 9.0, points: 5, number: 11 },
  ],
};

// Generate mock GW data
for (let i = 1; i <= 38; i++) {
  gameweekData[i] = {
    points: Math.floor(Math.random() * 60) + 30,
    rank: `${Math.floor(Math.random() * 500) + 1}k`,
    players: defaultPlayers,
  };
}
gameweekData[25] = { points: 78, rank: "142k", players: defaultPlayers };

export const PitchVisualization = () => {
  const [currentGW, setCurrentGW] = useState(25);
  const gw = gameweekData[currentGW];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <GameweekNav
          currentGW={currentGW}
          totalGW={38}
          points={gw.points}
          rank={gw.rank}
          onPrev={() => setCurrentGW((g) => Math.max(1, g - 1))}
          onNext={() => setCurrentGW((g) => Math.min(38, g + 1))}
        />

        <div
          className="relative rounded-2xl overflow-hidden px-4 py-8"
          style={{
            background: `linear-gradient(180deg, 
              hsl(142 55% 38%) 0%, 
              hsl(142 50% 42%) 25%,
              hsl(142 55% 38%) 25.5%,
              hsl(142 50% 42%) 50%,
              hsl(142 55% 38%) 50.5%,
              hsl(142 50% 42%) 75%,
              hsl(142 55% 38%) 75.5%,
              hsl(142 50% 42%) 100%)`,
            minHeight: "600px",
          }}
        >
          {/* Center circle */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-20"
            style={{
              width: "120px",
              height: "120px",
              borderColor: "hsl(0 0% 100%)",
            }}
          />
          {/* Center line */}
          <div
            className="absolute left-0 right-0 top-1/2 h-[2px] opacity-15"
            style={{ background: "hsl(0 0% 100%)" }}
          />

          {/* Goalkeeper */}
          <div className="flex justify-center mb-10 relative z-10">
            {gw.players.goalkeeper.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-6 mb-12 relative z-10">
            {gw.players.defenders.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center gap-10 mb-12 relative z-10">
            {gw.players.midfielders.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {/* Forwards */}
          <div className="flex justify-center gap-14 relative z-10">
            {gw.players.forwards.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Bench */}
        <div className="mt-4 p-4 rounded-xl bg-card border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Substitutes</p>
          <div className="flex justify-center gap-8">
            {[
              { id: 11, name: "Raya", team: "ARS", price: 5.5, points: 4, number: 13 },
              { id: 12, name: "Mykolenko", team: "EVE", price: 4.5, points: 1, number: 19 },
              { id: 13, name: "Eze", team: "CRY", price: 7.0, points: 3, number: 10 },
              { id: 14, name: "João Pedro", team: "BHA", price: 5.5, points: 2, number: 9 },
            ].map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
