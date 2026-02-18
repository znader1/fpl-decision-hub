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
  noticeMessage?: string;
  errorMessage?: string;
  requestUrl?: string;
  sourceLabel?: string;
  fixturesByTeam?: Record<string, FplTeamFixture[]>;
  fixturesRequestUrl?: string;
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
  points: player.xpts,
  fixture,
  isCaptain: typeof captainId === "number" && player.player_id === captainId,
  isViceCaptain: typeof viceId === "number" && player.player_id === viceId,
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

export const PitchVisualization = ({
  team,
  requestedGw,
  onRequestedGwChange,
  gwSelectable,
  isLoading = false,
  noticeMessage,
  errorMessage,
  requestUrl,
  sourceLabel = "Squad",
  fixturesByTeam,
  fixturesRequestUrl,
}: PitchVisualizationProps) => {
  const pageOrigin = useMemo(() => {
    try {
      return window.location.origin;
    } catch {
      return "";
    }
  }, []);

  const recommendationTeam = "horizon_gws" in team ? team : undefined;
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
              </p>
            )}
          </div>
          {recommendationTeam && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              Recommended
            </span>
          )}
        </div>

        {!errorMessage && noticeMessage && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            <p>{noticeMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>Failed to load from backend. Showing last loaded data instead.</p>
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
          {fixturesRequestUrl && (
            <div className="mt-1 break-all">
              <span className="font-semibold text-foreground">Fixtures:</span> {fixturesRequestUrl}
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
