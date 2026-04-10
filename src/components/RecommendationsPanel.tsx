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
  appliedTransferCount?: number;
  canApplyNextTransfer?: boolean;
  isApplyingTransfer?: boolean;
  onApplyNextTransfer?: () => void;
  onResetAppliedTransfers?: () => void;
  onApplyTransferAtIndex?: (index: number) => void;
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

const formatMs = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value)} ms`;
};

const chipLabel = (value?: string | null) => {
  if (!value || value === "none") return "None";
  if (value === "free_hit") return "Free Hit";
  if (value === "wildcard") return "Wildcard";
  return value;
};

const getTransferCapacity = (recommendation: FplTeamRecommendation) => {
  const transfers = recommendation.transfers;
  if (!transfers) return undefined;

  const transferPlan = transfers.transfer_plan;
  const plannedMoves = Array.isArray(transfers.moves) ? transfers.moves.length : 0;
  const movesUsed =
    typeof transferPlan?.transfer_count_built === "number"
      ? transferPlan.transfer_count_built
      : typeof transfers.moves_used === "number"
        ? transfers.moves_used
        : typeof transfers.transfer_policy?.moves_used === "number"
          ? transfers.transfer_policy.moves_used
          : plannedMoves;
  const maxMoves =
    typeof transferPlan?.transfer_count_target === "number"
      ? transferPlan.transfer_count_target
      : typeof transfers.max_moves === "number"
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
  appliedTransferCount = 0,
  canApplyNextTransfer = false,
  isApplyingTransfer = false,
  onApplyNextTransfer,
  onResetAppliedTransfers,
  onApplyTransferAtIndex,
}: RecommendationsPanelProps) => {
  const transferPlayerLookups = useMemo(() => {
    const nameById: Record<number, string> = {};
    const teamById: Record<number, string> = {};

    const addPlayer = (playerId: unknown, playerName: unknown, teamShort: unknown) => {
      if (typeof playerId !== "number" || !Number.isFinite(playerId)) return;
      if (typeof playerName === "string" && playerName.trim().length > 0) {
        nameById[playerId] = playerName.trim();
      }
      if (typeof teamShort === "string" && teamShort.trim().length > 0) {
        teamById[playerId] = teamShort.trim();
      }
    };

    for (const p of squad?.starting_xi ?? []) addPlayer(p.player_id, p.web_name, p.team_short);
    for (const p of squad?.bench ?? []) addPlayer(p.player_id, p.web_name, p.team_short);
    for (const p of recommendation?.starting_xi ?? []) addPlayer(p.player_id, p.web_name, p.team_short);
    for (const p of recommendation?.bench ?? []) addPlayer(p.player_id, p.web_name, p.team_short);

    const hotByPosition = recommendation?.transfers?.hot_by_position ?? {};
    for (const list of Object.values(hotByPosition)) {
      if (!Array.isArray(list)) continue;
      for (const p of list) {
        addPlayer(p.id, p.name, p.team);
      }
    }

    return { nameById, teamById };
  }, [recommendation, squad]);

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

  const squadInsights = recommendation?.squad_insights?.summary_points ?? [];
  const scoringBullets = recommendation?.scoring_guide?.bullets ?? [];

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
              <div>
                <p className="text-xs text-muted-foreground">Target GW</p>
                <p className="font-semibold text-foreground">GW {recommendation.event_id}</p>
              </div>
              {typeof horizonGws === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">Horizon</p>
                  <p className="font-semibold text-foreground">{horizonGws} GWs</p>
                </div>
              )}
              {recommendation.chip_strategy && (
                <div>
                  <p className="text-xs text-muted-foreground">Chip mode</p>
                  <p className="font-semibold text-foreground">{chipLabel(recommendation.chip_strategy.selected)}</p>
                </div>
              )}
              {typeof recommendation.chip_strategy?.play_event_id === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">Chip plays from</p>
                  <p className="font-semibold text-foreground">GW {recommendation.chip_strategy.play_event_id}</p>
                </div>
              )}
              {typeof recommendation.chip_strategy?.objective_horizon_gws === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">Chip horizon</p>
                  <p className="font-semibold text-foreground">{recommendation.chip_strategy.objective_horizon_gws} GWs</p>
                </div>
              )}
              {typeof recommendation.chip_strategy?.remaining_budget_m === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">Chip ITB</p>
                  <p className="font-semibold text-foreground">£{formatXp(recommendation.chip_strategy.remaining_budget_m)}m</p>
                </div>
              )}
              {recommendation.squad_source && (
                <div>
                  <p className="text-xs text-muted-foreground">Squad source</p>
                  <p className="font-semibold text-foreground">
                    {recommendation.squad_source === "chip_draft" ? "Chip draft" : "Entry picks"}
                  </p>
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
              {typeof recommendation.transfer_impact?.with_transfers_projected_points_with_captain === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">With transfers</p>
                  <p className="font-semibold text-foreground">
                    {formatXp(recommendation.transfer_impact.with_transfers_projected_points_with_captain)}
                  </p>
                </div>
              )}
              {typeof recommendation.transfer_impact?.delta_projected_points_with_captain === "number" && (
                <div>
                  <p className="text-xs text-muted-foreground">Transfer impact</p>
                  <p className="font-semibold text-foreground">
                    {recommendation.transfer_impact.delta_projected_points_with_captain >= 0 ? "+" : ""}
                    {formatXp(recommendation.transfer_impact.delta_projected_points_with_captain)}
                  </p>
                </div>
              )}
              {typeof recommendation.timings_ms?.total_ms === "number" && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Compute time</p>
                  <p className="font-semibold text-foreground">{formatMs(recommendation.timings_ms.total_ms)}</p>
                </div>
              )}
            </div>
          )}
          {recommendation?.chip_strategy?.explanation && (
            <p className="text-xs text-muted-foreground">{recommendation.chip_strategy.explanation}</p>
          )}
        </Card>

        <TransferPlanner
          transfers={recommendation?.transfers}
          isLoading={isRecommending}
          targetGw={recommendation?.event_id}
          playerNameById={transferPlayerLookups.nameById}
          playerTeamById={transferPlayerLookups.teamById}
          appliedTransferCount={appliedTransferCount}
          canApplyNextTransfer={canApplyNextTransfer}
          isApplyingTransfer={isApplyingTransfer}
          onApplyNextTransfer={onApplyNextTransfer}
          onResetAppliedTransfers={onResetAppliedTransfers}
          onApplyTransferAtIndex={onApplyTransferAtIndex}
        />

        <Card className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Squad Watchlist</h3>
            <p className="text-xs text-muted-foreground">
              Key warnings and opportunities from the selected gameweek window.
            </p>
          </div>
          {squadInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Compute a recommendation to see injury, blank, double, and bench-boost setup flags.
            </p>
          ) : (
            <div className="space-y-2">
              {squadInsights.map((item, index) => (
                <div key={`${item.category ?? "insight"}-${index}`} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {item.severity ?? "info"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

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
            <h3 className="font-semibold text-sm text-foreground">How Scoring Works</h3>
            <p className="text-xs text-muted-foreground">
              {recommendation?.scoring_guide?.headline ?? "Hover a player to see the scoring breakdown behind the draft."}
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {scoringBullets.length === 0 ? (
                <p>Compute a recommendation to see the scoring guide for this chip mode.</p>
              ) : (
                scoringBullets.map((bullet, index) => (
                  <p key={`score-${index}`}>• {bullet}</p>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
};
