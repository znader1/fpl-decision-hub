import { useMemo } from "react";
import { PlayerCard, type Player } from "./PlayerCard";
import { GameweekNav } from "./GameweekNav";
import type {
  FplSquad,
  FplTeamFixture,
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
  fixturesByTeam?: Record<string, FplTeamFixture[]>;
}

const getRowGapClass = (count: number) => {
  if (count >= 6) return "gap-2";
  if (count === 5) return "gap-4";
  if (count === 4) return "gap-6";
  if (count === 3) return "gap-10";
  if (count === 2) return "gap-14";
  return "gap-6";
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const chipLabel = (value?: string | null) => {
  if (!value) return "";
  if (value === "free_hit") return "Free Hit";
  if (value === "wildcard") return "Wildcard";
  return value;
};

const parseNextFixturesLabel = (label?: string): Player["fixture"] | undefined => {
  if (typeof label !== "string") return undefined;
  const trimmed = label.trim();
  if (!trimmed) return undefined;

  const difficultyMatch = trimmed.match(/\(D([1-5])\)/i);
  const difficulty = difficultyMatch ? Number(difficultyMatch[1]) : undefined;

  const isHome = trimmed.startsWith("H-") ? true : trimmed.startsWith("A-") ? false : undefined;
  const opponentMatch = trimmed.match(/^[HA]-([A-Z]{2,4})/);
  const opponent = opponentMatch?.[1] ?? "";

  return {
    label: trimmed,
    opponent,
    isHome,
    difficulty,
  };
};

const getCaptainIds = (team: PitchTeam) => {
  const captainFromId = typeof team.captain_player_id === "number" ? team.captain_player_id : undefined;
  const viceFromId = typeof team.vice_player_id === "number" ? team.vice_player_id : undefined;

  if ("horizon_gws" in team) {
    const all = [...team.starting_xi, ...team.bench];
    const captainSuggested = all.find((p) => p.is_captain_suggested)?.player_id;
    const viceSuggested = all.find((p) => p.is_vice_suggested)?.player_id;
    return {
      captainId: captainSuggested ?? captainFromId,
      viceId: viceSuggested ?? viceFromId,
    };
  }

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
  viceId?: number,
  fixture?: Player["fixture"]
): Player => ({
  id: player.player_id,
  name: player.web_name,
  team: player.team_short,
  teamName: player.team_name,
  points: player.xpts,
  fixture,
  isCaptain: typeof captainId === "number" && player.player_id === captainId,
  isViceCaptain: typeof viceId === "number" && player.player_id === viceId,
  alerts: player.alerts,
  scoreBreakdown: player.score_breakdown,
});

const toBenchPlayer = (
  player: FplTeamRecommendationBenchPlayer,
  captainId?: number,
  viceId?: number,
  fixture?: Player["fixture"]
): Player => ({
  ...toPitchPlayer(player, captainId, viceId, fixture),
  number: player.bench_order,
});

const computeTeamPoints = (team: PitchTeam) => {
  if ("projected_points_with_captain" in team && typeof team.projected_points_with_captain === "number") {
    return team.projected_points_with_captain;
  }
  return team.starting_xi.reduce((sum, p) => sum + p.xpts * p.multiplier, 0);
};

const getActualGwPoints = (team: PitchTeam) => {
  if (!("entry_history" in team)) return undefined;
  const history = team.entry_history;
  if (!history || typeof history !== "object") return undefined;
  const points = history.points;
  return typeof points === "number" && Number.isFinite(points) ? points : undefined;
};

const getDisplayedTeam = (team: PitchTeam): PitchTeam => {
  if (!("horizon_gws" in team)) return team;
  const applied = team.transfer_application?.applied ?? 0;
  if (applied > 0 && team.squad_with_transfers) return team.squad_with_transfers;
  return team;
};

const formatRank = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return value.toLocaleString();
  } catch {
    return String(Math.round(value));
  }
};

export const PitchVisualization = ({
  team,
  requestedGw,
  onRequestedGwChange,
  gwSelectable,
  isLoading = false,
  errorMessage,
  fixturesByTeam,
}: PitchVisualizationProps) => {
  const recommendationTeam = "horizon_gws" in team ? team : undefined;
  const chipInfo = recommendationTeam?.chip_strategy;
  const chipName = chipLabel(chipInfo?.selected);
  const chipPlayGw = chipInfo?.play_event_id;
  const displayedTeam = useMemo(() => getDisplayedTeam(team), [team]);
  const { captainId, viceId } = useMemo(() => getCaptainIds(displayedTeam), [displayedTeam]);

  const gwPoints = useMemo(() => {
    const points = computeTeamPoints(displayedTeam);
    return Number.isFinite(points) ? round1(points) : 0;
  }, [displayedTeam]);
  const actualGwPoints = useMemo(() => {
    const points = getActualGwPoints(displayedTeam);
    return typeof points === "number" ? round1(points) : undefined;
  }, [displayedTeam]);
  const displayedPoints = recommendationTeam ? gwPoints : actualGwPoints ?? gwPoints;
  const displayedRank = useMemo(() => {
    if (!("entry_history" in team)) return "—";
    const overallRank = team.entry_history?.overall_rank;
    return formatRank(overallRank);
  }, [team]);

  const { goalkeeper, defenders, midfielders, forwards } = useMemo(() => {
    const starting = displayedTeam.starting_xi;
    return {
      goalkeeper: starting.filter((p) => p.pos === "GKP"),
      defenders: starting.filter((p) => p.pos === "DEF"),
      midfielders: starting.filter((p) => p.pos === "MID"),
      forwards: starting.filter((p) => p.pos === "FWD"),
    };
  }, [displayedTeam.starting_xi]);

  const bench = useMemo(() => {
    return [...displayedTeam.bench].sort((a, b) => a.bench_order - b.bench_order);
  }, [displayedTeam.bench]);

  const getFixtureForTeam = (teamShort: string): Player["fixture"] | undefined => {
    const fixtures = fixturesByTeam?.[teamShort];
    if (!fixtures || fixtures.length === 0) return undefined;
    const primary = fixtures[0];
    const extraCount = fixtures.length - 1;
    return {
      opponent: primary.opponent_short,
      isHome: primary.is_home,
      difficulty: primary.difficulty,
      extraCount: extraCount > 0 ? extraCount : undefined,
    };
  };

  const getFixtureForPlayer = (player: FplTeamRecommendationPlayer): Player["fixture"] | undefined => {
    const fromLabel = parseNextFixturesLabel(player.next_fixtures);
    if (fromLabel) return fromLabel;
    return getFixtureForTeam(player.team_short);
  };

  return (
    <div className="flex-1 min-w-0 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {recommendationTeam ? "Recommended Squad" : "Current Squad"}
            </h2>
            {recommendationTeam && (
              <p className="text-xs text-muted-foreground">
                Optimized for GW {recommendationTeam.event_id} · Horizon {recommendationTeam.horizon_gws} GWs
                {chipInfo?.is_active && chipName && ` · ${chipName} mode`}
                {chipInfo?.propagates_to_future_gws && typeof chipPlayGw === "number" &&
                  ` · anchored from GW ${chipPlayGw}`}
                {typeof chipInfo?.remaining_budget_m === "number" &&
                  ` · £${round1(chipInfo.remaining_budget_m)}m ITB`}
                {typeof recommendationTeam.transfer_application?.applied === "number" &&
                  recommendationTeam.transfer_application.applied > 0 &&
                  ` · ${recommendationTeam.transfer_application.applied} transfer(s) applied`}
                {typeof recommendationTeam.transfer_impact?.delta_projected_points_with_captain === "number" &&
                  ` · Δ ${round1(recommendationTeam.transfer_impact.delta_projected_points_with_captain)} xPts`}
              </p>
            )}
            {!recommendationTeam && (
              <p className="text-xs text-muted-foreground">
                GW {team.event_id} points now: {typeof actualGwPoints === "number" ? actualGwPoints : "—"} ·
                projected XI: {gwPoints}
              </p>
            )}
          </div>
          {recommendationTeam && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {chipInfo?.is_active && chipName
                ? `${chipName} Draft${typeof chipPlayGw === "number" ? ` · GW${chipPlayGw}+` : ""}`
                : "Recommended"}
            </span>
          )}
        </div>

        {recommendationTeam?.chip_strategy?.reason && (
          <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {recommendationTeam.chip_strategy.reason}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>Failed to load from backend. Showing last loaded data instead.</p>
            <p className="mt-1 text-xs text-destructive/90">{errorMessage}</p>
          </div>
        )}

        <GameweekNav
          currentGW={requestedGw}
          totalGW={38}
          points={displayedPoints}
          rank={displayedRank}
          onPrev={() => gwSelectable && onRequestedGwChange(Math.max(1, requestedGw - 1))}
          onNext={() => gwSelectable && onRequestedGwChange(Math.min(38, requestedGw + 1))}
          navEnabled={gwSelectable}
          onSelectGW={(gw) => gwSelectable && onRequestedGwChange(gw)}
        />

        <div
          className="relative rounded-2xl overflow-hidden px-4 py-8"
          style={{
            background: `linear-gradient(180deg, 
              hsl(var(--pitch)) 0%, 
              hsl(var(--pitch-dark)) 25%,
              hsl(var(--pitch)) 25.5%,
              hsl(var(--pitch-dark)) 50%,
              hsl(var(--pitch)) 50.5%,
              hsl(var(--pitch-dark)) 75%,
              hsl(var(--pitch)) 75.5%,
              hsl(var(--pitch-dark)) 100%)`,
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
              <PlayerCard
                key={player.player_id}
                player={toPitchPlayer(player, captainId, viceId, getFixtureForPlayer(player))}
              />
            ))}
          </div>

          {/* Defenders */}
          <div className={`flex justify-center ${getRowGapClass(defenders.length)} mb-12 relative z-10`}>
            {defenders.map((player) => (
              <PlayerCard
                key={player.player_id}
                player={toPitchPlayer(player, captainId, viceId, getFixtureForPlayer(player))}
              />
            ))}
          </div>

          {/* Midfielders */}
          <div className={`flex justify-center ${getRowGapClass(midfielders.length)} mb-12 relative z-10`}>
            {midfielders.map((player) => (
              <PlayerCard
                key={player.player_id}
                player={toPitchPlayer(player, captainId, viceId, getFixtureForPlayer(player))}
              />
            ))}
          </div>

          {/* Forwards */}
          <div className={`flex justify-center ${getRowGapClass(forwards.length)} relative z-10`}>
            {forwards.map((player) => (
              <PlayerCard
                key={player.player_id}
                player={toPitchPlayer(player, captainId, viceId, getFixtureForPlayer(player))}
              />
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
              <PlayerCard
                key={player.player_id}
                player={toBenchPlayer(player, captainId, viceId, getFixtureForPlayer(player))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
