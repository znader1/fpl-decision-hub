import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JerseyIcon } from "./JerseyIcon";
import { Badge } from "@/components/ui/badge";
import type { FplPosition, FplTransfersRecommendation } from "@/lib/fplAssistantApi";

interface TransferPlannerProps {
  transfers?: FplTransfersRecommendation;
  isLoading?: boolean;
}

const POSITION_ORDER: FplPosition[] = ["GKP", "DEF", "MID", "FWD"];

const formatMoney = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(1).replace(/\.0$/, "");
  return `£${fixed}m`;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const formatPoints = (value?: number, withSign = false) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const rounded = round1(value);
  if (withSign) return `${rounded >= 0 ? "+" : ""}${rounded}`;
  return String(rounded);
};

export const TransferPlanner = ({ transfers, isLoading = false }: TransferPlannerProps) => {
  const moves = Array.isArray(transfers?.moves) ? transfers.moves : [];
  const transferPlan = transfers?.transfer_plan;
  const movesUsed =
    typeof transferPlan?.transfer_count_built === "number"
      ? transferPlan.transfer_count_built
      : typeof transfers?.moves_used === "number"
        ? transfers.moves_used
        : typeof transfers?.transfer_policy?.moves_used === "number"
          ? transfers.transfer_policy.moves_used
          : moves.length;
  const maxMoves =
    typeof transferPlan?.transfer_count_target === "number"
      ? transferPlan.transfer_count_target
      : typeof transfers?.max_moves === "number"
        ? transfers.max_moves
        : typeof transfers?.transfer_policy?.max_moves === "number"
          ? transfers.transfer_policy.max_moves
          : undefined;
  const totalScoreGain = moves.reduce((sum, move) => sum + (move.score_gain ?? 0), 0);
  const hasMoveGain = moves.some((move) => typeof move.score_gain === "number");
  const sortedMoveCounts = Object.entries(transfers?.moves_by_position ?? {})
    .filter(([, count]) => typeof count === "number" && Number.isFinite(count))
    .sort(([a], [b]) => POSITION_ORDER.indexOf(a as FplPosition) - POSITION_ORDER.indexOf(b as FplPosition));
  const hotByPosition = transfers?.hot_by_position ?? {};
  const hotRows = POSITION_ORDER
    .map((position) => ({
      position,
      players: Array.isArray(hotByPosition[position]) ? hotByPosition[position] : [],
    }))
    .filter((row) => row.players.length > 0);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Transfer Planner
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Moves: {movesUsed}
            {typeof maxMoves === "number" ? `/${maxMoves}` : ""}
          </Badge>
          {hasMoveGain && (
            <Badge variant="secondary" className="text-xs">
              Gain: {formatPoints(totalScoreGain, true)} pts
            </Badge>
          )}
          {typeof transferPlan?.free_transfers === "number" && (
            <Badge variant="outline" className="text-xs">
              FT: {transferPlan.free_transfers}
            </Badge>
          )}
          {typeof transferPlan?.hit_cap === "number" && (
            <Badge variant="outline" className="text-xs">
              Hit cap: {transferPlan.hit_cap}
            </Badge>
          )}
          {typeof transfers?.remaining_itb === "number" && (
            <Badge variant="outline" className="text-xs">
              ITB: {formatMoney(transfers.remaining_itb)}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Suggested Transfers
        </p>
        {isLoading && (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            Computing transfer suggestions…
          </div>
        )}
        {!isLoading && moves.length === 0 && (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            No transfer suggestions returned.
          </div>
        )}
        {moves.map((move, idx) => (
          <div key={`${move.sell.id}-${move.buy.id}-${idx}`} className="rounded-lg border border-border p-3">
            <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>Move {idx + 1}</span>
              {move.position && <Badge variant="outline">{move.position}</Badge>}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <JerseyIcon team={move.sell.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-destructive leading-tight break-words">{move.sell.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {move.sell.team} · {formatMoney(move.sell.price)}
                    </p>
                  </div>
                </div>

                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <JerseyIcon team={move.buy.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary leading-tight break-words">{move.buy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {move.buy.team} · {formatMoney(move.buy.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {typeof move.buy_hot_score === "number" && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    Hot {formatPoints(move.buy_hot_score)}
                  </Badge>
                )}
                {typeof move.buy_set_piece_score === "number" && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    SP {formatPoints(move.buy_set_piece_score)}
                  </Badge>
                )}
                {typeof move.score_gain === "number" && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {formatPoints(move.score_gain, true)} pts
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedMoveCounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moves by Position</p>
          <div className="flex flex-wrap gap-2">
            {sortedMoveCounts.map(([position, count]) => (
              <Badge key={position} variant="secondary" className="text-xs">
                {position}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hotRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hot Targets</p>
          {hotRows.map(({ position, players }) => (
            <div key={position} className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground mb-2">{position}</p>
              <div className="space-y-1.5">
                {players.slice(0, 2).map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <JerseyIcon team={player.team} size="sm" />
                      <p className="text-xs text-foreground truncate">
                        {player.name} ({player.team})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatMoney(player.price)}</span>
                      {typeof player.transfer_score === "number" && (
                        <Badge variant="outline" className="text-xs">
                          {formatPoints(player.transfer_score)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
