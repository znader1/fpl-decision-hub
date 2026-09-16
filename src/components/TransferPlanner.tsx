import type { ReactNode } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { FplTransfersRecommendation } from "@/lib/fplAssistantApi";

interface TransferPlannerProps {
  transfers?: FplTransfersRecommendation;
  planSlot?: ReactNode;
  isLoading?: boolean;
}

/** The Transfer Planner card is now a shell around the plan slot — the
 * decision card + collapsed staircase are the only advice on this tab.
 * The beam alternatives list and Hot Targets moved off entirely: the beam
 * still feeds Apply indexing server-side but is no longer displayed, and
 * Hot Targets now lives on the Watchlist tab (`HotTargets.tsx`). */
export const TransferPlanner = ({ transfers, planSlot, isLoading = false }: TransferPlannerProps) => {
  const hasMoves = (transfers?.moves ?? []).length > 0;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-primary" />
        Transfer Planner
      </h3>

      {planSlot}

      {isLoading && (
        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          Computing transfer suggestions…
        </div>
      )}
      {!isLoading && !planSlot && !hasMoves && (
        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          No transfer suggestions returned.
        </div>
      )}
    </Card>
  );
};
