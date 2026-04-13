import { useMemo, useState } from "react";
import { PlayerCard, type Player } from "./PlayerCard";
import { GameweekNav } from "./GameweekNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type {
  FplSquad,
  FplTeamFixture,
  FplTeamRecommendation,
  FplTeamRecommendationBenchPlayer,
  FplTeamRecommendationPlayer,
} from "@/lib/fplAssistantApi";

type PitchTeam = FplSquad | FplTeamRecommendation;

interface PitchVisualizationProps {
  entryId?: number;
  onEntryIdSubmit?: (id: number) => void;
  team: PitchTeam;
  requestedGw: number;
  onRequestedGwChange: (gw: number) => void;
  gwSelectable: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  fixturesByTeam?: Record<string, FplTeamFixture[]>;
  pitchMode?: "squad" | "recommendation";
  onPitchModeChange?: (mode: "squad" | "recommendation") => void;
  hasRecommendation?: boolean;
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
  entryId,
  onEntryIdSubmit,
  team,
  requestedGw,
  onRequestedGwChange,
  gwSelectable,
  isLoading = false,
  errorMessage,
  fixturesByTeam,
  pitchMode = "squad",
  onPitchModeChange,
  hasRecommendation = false,
}: PitchVisualizationProps) => {
  const [draftId, setDraftId] = useState("");
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
    <div className="flex-1 min-w-0 p-5 overflow-y-auto">
      <div className="max-w-5xl mx-auto">

        {/* Squad / AI Pick tab bar */}
        {onPitchModeChange && (
          <div className="flex items-center gap-1 mb-4 bg-card border border-border rounded-xl p-1 w-fit">
            <button
              onClick={() => onPitchModeChange("squad")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                pitchMode === "squad"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Squad
            </button>
            <button
              onClick={() => hasRecommendation && onPitchModeChange("recommendation")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                pitchMode === "recommendation"
                  ? "bg-primary text-white shadow-sm"
                  : hasRecommendation
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              AI Pick
              {!hasRecommendation && (
                <span className="ml-1.5 text-[10px] font-normal opacity-60">run first</span>
              )}
            </button>
            {chipInfo?.is_active && chipName && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-semibold">
                {chipName}
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>Failed to load from backend. Showing last loaded data.</p>
            <p className="mt-1 text-xs opacity-80">{errorMessage}</p>
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
          isRecommendation={Boolean(recommendationTeam)}
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
          {/* Entry ID prompt overlay — shown when no valid ID is set */}
          {onEntryIdSubmit && (!entryId || entryId <= 0) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
              <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm mx-4 text-center shadow-xl">
                <Search className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">Enter your FPL team ID</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Find it on the FPL website under Points → click your team name in the URL.
                </p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const id = Number(draftId);
                    if (id > 0) onEntryIdSubmit(id);
                  }}
                >
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="e.g. 588004"
                    value={draftId}
                    onChange={(e) => setDraftId(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/90 shrink-0">
                    Load
                  </Button>
                </form>
              </div>
            </div>
          )}

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
