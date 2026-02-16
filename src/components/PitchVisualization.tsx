import { useMemo } from "react";
import { PlayerCard, type Player } from "./PlayerCard";
import { GameweekNav } from "./GameweekNav";
import type {
  FplSquad,
  FplTeamRecommendation,
  FplTeamRecommendationBenchPlayer,
  FplTeamRecommendationPlayer,
} from "@/lib/fplAssistantApi";

type PitchTeam = FplSquad | FplTeamRecommendation;

interface PitchVisualizationProps {
  team: PitchTeam;
  requestedGw: number;
  onRequestedGwChange: (gw: number) => void;
  gwSelectable: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  requestUrl?: string;
  sourceLabel?: string;
}

const getRowGapClass = (count: number) => {
  if (count >= 6) return "gap-2";
  if (count === 5) return "gap-4";
  if (count === 4) return "gap-6";
  if (count === 3) return "gap-10";
  if (count === 2) return "gap-14";
  return "gap-6";
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const getCaptainIds = (team: PitchTeam) => {
  const captainFromId = typeof team.captain_player_id === "number" ? team.captain_player_id : undefined;
  const viceFromId = typeof team.vice_player_id === "number" ? team.vice_player_id : undefined;
  const captainFromFlags = team.starting_xi.find((p) => p.is_captain)?.player_id;
  const viceFromFlags = team.starting_xi.find((p) => p.is_vice_captain)?.player_id;
  return {
    captainId: captainFromId ?? captainFromFlags,
    viceId: viceFromId ?? viceFromFlags,
  };
};

const toPitchPlayer = (
  player: FplTeamRecommendationPlayer,
  captainId?: number,
  viceId?: number
): Player => ({
  id: player.player_id,
  name: player.web_name,
  team: player.team_short,
  points: player.xpts,
  isCaptain:
    (typeof captainId === "number" && player.player_id === captainId) ||
    player.is_captain ||
    Boolean(player.is_captain_suggested),
  isViceCaptain:
    (typeof viceId === "number" && player.player_id === viceId) ||
    player.is_vice_captain ||
    Boolean(player.is_vice_suggested),
});

const toBenchPlayer = (
  player: FplTeamRecommendationBenchPlayer,
  captainId?: number,
  viceId?: number
): Player => ({
  ...toPitchPlayer(player, captainId, viceId),
  number: player.bench_order,
});

const computeTeamPoints = (team: PitchTeam) => {
  if ("projected_points_with_captain" in team && typeof team.projected_points_with_captain === "number") {
    return team.projected_points_with_captain;
  }
  return team.starting_xi.reduce((sum, p) => sum + p.xpts * p.multiplier, 0);
};

export const PitchVisualization = ({
  team,
  requestedGw,
  onRequestedGwChange,
  gwSelectable,
  isLoading = false,
  errorMessage,
  requestUrl,
  sourceLabel = "Squad",
}: PitchVisualizationProps) => {
  const pageOrigin = useMemo(() => {
    try {
      return window.location.origin;
    } catch {
      return "";
    }
  }, []);

  const { captainId, viceId } = useMemo(() => getCaptainIds(team), [team]);

  const gwPoints = useMemo(() => {
    const points = computeTeamPoints(team);
    return Number.isFinite(points) ? round2(points) : 0;
  }, [team]);

  const { goalkeeper, defenders, midfielders, forwards } = useMemo(() => {
    const starting = team.starting_xi;
    return {
      goalkeeper: starting.filter((p) => p.pos === "GKP"),
      defenders: starting.filter((p) => p.pos === "DEF"),
      midfielders: starting.filter((p) => p.pos === "MID"),
      forwards: starting.filter((p) => p.pos === "FWD"),
    };
  }, [team.starting_xi]);

  const bench = useMemo(() => {
    return [...team.bench].sort((a, b) => a.bench_order - b.bench_order);
  }, [team.bench]);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>Failed to load from backend. Showing sample data instead.</p>
            <p className="mt-1 text-xs text-destructive/90">{errorMessage}</p>
            {requestUrl && <p className="mt-1 text-xs text-destructive/80 break-all">{requestUrl}</p>}
          </div>
        )}

        <GameweekNav
          currentGW={requestedGw}
          totalGW={38}
          points={gwPoints}
          rank="—"
          onPrev={() => gwSelectable && onRequestedGwChange(Math.max(1, requestedGw - 1))}
          onNext={() => gwSelectable && onRequestedGwChange(Math.min(38, requestedGw + 1))}
          navEnabled={gwSelectable}
          onSelectGW={(gw) => gwSelectable && onRequestedGwChange(gw)}
        />

        <div className="mb-6 rounded-xl bg-card border border-border px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <span className="font-semibold text-foreground">Entry ID:</span> {team.entry_id}
            </span>
            <span>
              <span className="font-semibold text-foreground">Requested GW:</span> {requestedGw}
            </span>
            <span>
              <span className="font-semibold text-foreground">Returned Event ID:</span> {team.event_id}
            </span>
            <span>
              <span className="font-semibold text-foreground">Source:</span> {sourceLabel}
            </span>
            {pageOrigin && (
              <span>
                <span className="font-semibold text-foreground">Origin:</span> {pageOrigin}
              </span>
            )}
            {isLoading && <span className="text-muted-foreground">Updating…</span>}
          </div>
          {requestUrl && (
            <div className="mt-2 break-all">
              <span className="font-semibold text-foreground">Request:</span> {requestUrl}
            </div>
          )}
        </div>

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
            {goalkeeper.map((player) => (
              <PlayerCard key={player.player_id} player={toPitchPlayer(player, captainId, viceId)} />
            ))}
          </div>

          {/* Defenders */}
          <div className={`flex justify-center ${getRowGapClass(defenders.length)} mb-12 relative z-10`}>
            {defenders.map((player) => (
              <PlayerCard key={player.player_id} player={toPitchPlayer(player, captainId, viceId)} />
            ))}
          </div>

          {/* Midfielders */}
          <div className={`flex justify-center ${getRowGapClass(midfielders.length)} mb-12 relative z-10`}>
            {midfielders.map((player) => (
              <PlayerCard key={player.player_id} player={toPitchPlayer(player, captainId, viceId)} />
            ))}
          </div>

          {/* Forwards */}
          <div className={`flex justify-center ${getRowGapClass(forwards.length)} relative z-10`}>
            {forwards.map((player) => (
              <PlayerCard key={player.player_id} player={toPitchPlayer(player, captainId, viceId)} />
            ))}
          </div>
        </div>

        {/* Bench */}
        <div className="mt-4 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Substitutes</p>
            {isLoading && <p className="text-xs text-muted-foreground">Updating…</p>}
          </div>
          <div className="flex justify-center gap-8">
            {bench.map((player) => (
              <PlayerCard key={player.player_id} player={toBenchPlayer(player, captainId, viceId)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

