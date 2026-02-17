import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JerseyIcon } from "./JerseyIcon";
import { Badge } from "@/components/ui/badge";
import type { FplTransfersRecommendation } from "@/lib/fplAssistantApi";

interface TransferPlannerProps {
  transfers?: FplTransfersRecommendation;
  isLoading?: boolean;
}

const formatMoney = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(1).replace(/\.0$/, "");
  return `£${fixed}m`;
};

export const TransferPlanner = ({ transfers, isLoading = false }: TransferPlannerProps) => {
  const moves = Array.isArray(transfers?.moves) ? transfers?.moves : [];
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Transfer Planner
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Moves: {moves.length}
          </Badge>
          {typeof transfers?.remaining_itb === "number" && (
            <Badge variant="outline" className="text-xs">
              ITB: {formatMoney(transfers.remaining_itb)}
            </Badge>
          )}
        </div>
      </div>

      {transfers?.note && (
        <p className="text-xs text-muted-foreground">{transfers.note}</p>
      )}

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
          <div
            key={`${move.sell.id}-${move.buy.id}-${idx}`}
            className="rounded-lg border border-border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Player Out */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <JerseyIcon team={move.sell.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-destructive truncate">{move.sell.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {move.sell.team} · {formatMoney(move.sell.price)}
                    </p>
                  </div>
                </div>

                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Player In */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <JerseyIcon team={move.buy.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{move.buy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {move.buy.team} · {formatMoney(move.buy.price)}
                    </p>
                  </div>
                </div>
              </div>

              {typeof move.score_gain === "number" && Number.isFinite(move.score_gain) && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  +{Math.round(move.score_gain * 10) / 10} pts
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
