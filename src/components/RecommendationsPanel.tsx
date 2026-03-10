import { useMemo } from "react";
import { Lightbulb, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransferPlanner } from "./TransferPlanner";
import { JerseyIcon } from "./JerseyIcon";
import type { FplSquad, FplTeamRecommendation } from "@/lib/fplAssistantApi";

interface RecommendationsPanelProps {
  squad?: FplSquad;
  recommendation?: FplTeamRecommendation;
  isRecommending?: boolean;
  horizonGws?: number;
}

const findPlayer = (team: FplSquad, playerId: number) => {
  const inStart = team.starting_xi.find((p) => p.player_id === playerId);
  if (inStart) return inStart;
  return team.bench.find((p) => p.player_id === playerId);
};

const findName = (rec: FplTeamRecommendation, playerId: number) => findPlayer(rec, playerId)?.web_name;

const getSuggestedCaptain = (rec: FplTeamRecommendation) => {
  const all = [...rec.starting_xi, ...rec.bench];
  return (
    all.find((p) => p.is_captain_suggested) ??
    findPlayer(rec, rec.captain_player_id)
  );
};

const getCurrentCaptain = (team?: FplSquad) => {
  if (!team) return undefined;
  const fromId = typeof team.captain_player_id === "number" ? findPlayer(team, team.captain_player_id) : undefined;
  const fromFlags = team.starting_xi.find((p) => p.is_captain);
  return fromId ?? fromFlags;
};

const getFirstOutfieldBench = (team: FplSquad) => {
  const ordered = [...team.bench].sort((a, b) => a.bench_order - b.bench_order);
  return ordered.find((p) => p.pos !== "GKP");
};

const formatXp = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return (Math.round(value * 10) / 10).toString();
};

const getTransferCapacity = (recommendation: FplTeamRecommendation) => {
  const transfers = recommendation.transfers;
  if (!transfers) return undefined;

  const plannedMoves = Array.isArray(transfers.moves) ? transfers.moves.length : 0;
  const movesUsed =
    typeof transfers.moves_used === "number"
      ? transfers.moves_used
      : typeof transfers.transfer_policy?.moves_used === "number"
        ? transfers.transfer_policy.moves_used
        : plannedMoves;
  const maxMoves =
    typeof transfers.max_moves === "number"
      ? transfers.max_moves
      : typeof transfers.transfer_policy?.max_moves === "number"
        ? transfers.transfer_policy.max_moves
        : undefined;

  return { movesUsed, maxMoves };
};

export const RecommendationsPanel = ({
  squad,
  recommendation,
  isRecommending = false,
  horizonGws,
}: RecommendationsPanelProps) => {
  const transferCapacity = useMemo(
    () => (recommendation ? getTransferCapacity(recommendation) : undefined),
    [recommendation]
  );

  const quickTips = useMemo(() => {
    if (!recommendation) return [];

    const tips: Array<{
      type: "captain" | "bench";
      title: string;
      player: string;
      team: string;
      reason: string;
      impact: string;
    }> = [];

    const suggestedCaptain = getSuggestedCaptain(recommendation);
    if (suggestedCaptain) {
      const currentCaptain = getCurrentCaptain(squad);
      const reason =
        currentCaptain && currentCaptain.player_id !== suggestedCaptain.player_id
          ? `Switch captain from ${currentCaptain.web_name}`
          : "Set as captain";

      tips.push({
        type: "captain",
        title: "Captain Suggestion",
        player: suggestedCaptain.web_name,
        team: suggestedCaptain.team_short,
        reason,
        impact: `xPts: ${formatXp(suggestedCaptain.xpts)}`,
      });
    }

    const recommendedBench1 = getFirstOutfieldBench(recommendation);
    if (recommendedBench1) {
      const currentPlayer = squad ? findPlayer(squad, recommendedBench1.player_id) : undefined;
      const currentBenchOrder =
        currentPlayer && "bench_order" in currentPlayer && typeof currentPlayer.bench_order === "number"
          ? currentPlayer.bench_order
          : undefined;
      const isCurrentlyStarting = Boolean(squad?.starting_xi.some((p) => p.player_id === recommendedBench1.player_id));

      const reason =
        typeof currentBenchOrder === "number" && currentBenchOrder !== 1
          ? `Move from bench #${currentBenchOrder}`
          : isCurrentlyStarting
            ? "Move from starting XI"
            : "Set as 1st outfield bench";

      tips.push({
        type: "bench",
        title: "Bench Order Suggestion",
        player: recommendedBench1.web_name,
        team: recommendedBench1.team_short,
        reason,
        impact: `xPts: ${formatXp(recommendedBench1.xpts)}`,
      });
    }

    return tips;
  }, [recommendation, squad]);

  return (
    <aside className="w-[28rem] shrink-0 bg-card border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Lightbulb className="h-5 w-5 text-accent" />
            Insights
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {recommendation ? `Recommendation for GW ${recommendation.event_id}` : "Compute a recommendation to see insights"}
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Recommendation Summary</h3>
          {isRecommending && <p className="text-sm text-muted-foreground">Computing…</p>}
          {!recommendation && !isRecommending && (
            <p className="text-sm text-muted-foreground">
              Click <span className="font-semibold text-foreground">Recommend Squad</span> to generate an optimized team and insights.
            </p>
          )}
          {recommendation && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Projected points</p>
                <p className="font-semibold text-primary">
                  {formatXp(recommendation.projected_points_with_captain)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Formation</p>
                <p className="font-semibold text-foreground">{recommendation.formation.join("-")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Captain</p>
                <p className="font-semibold text-foreground">
                  {findName(recommendation, recommendation.captain_player_id) ?? recommendation.captain_player_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vice</p>
                <p className="font-semibold text-foreground">
                  {findName(recommendation, recommendation.vice_player_id) ?? recommendation.vice_player_id}
                </p>
              </div>
              {typeof horizonGws === "number" && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Horizon</p>
                  <p className="font-semibold text-foreground">{horizonGws} GWs</p>
                </div>
              )}
              {transferCapacity && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Transfer plan</p>
                  <p className="font-semibold text-foreground">
                    {transferCapacity.movesUsed}
                    {typeof transferCapacity.maxMoves === "number" ? `/${transferCapacity.maxMoves}` : ""}
                    {" "}moves
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        <TransferPlanner transfers={recommendation?.transfers} isLoading={isRecommending} />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Tips
          </p>
          {quickTips.length === 0 && !isRecommending && (
            <Card className="p-3 text-sm text-muted-foreground">
              Compute a recommendation to see captain and bench suggestions.
            </Card>
          )}
          {quickTips.map((rec, idx) => (
            <Card key={`${rec.type}-${idx}`} className="p-3 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                {rec.type === "captain" && <Lightbulb className="h-4 w-4 text-primary" />}
                {rec.type === "bench" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-semibold text-sm text-foreground">{rec.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <JerseyIcon team={rec.team} size="sm" />
                <div>
                  <p className="font-medium text-sm text-foreground">{rec.player}</p>
                  <p className="text-muted-foreground text-xs">{rec.reason}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-medium text-primary">{rec.impact}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Apply
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-accent/10 border-accent/20">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground">Weekly Summary</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Review transfer suggestions</p>
              <p>• Check captain + bench tips</p>
              <p>• Watch rotation/bench risks</p>
            </div>
            <Button className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
              View Full Analysis
            </Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};
