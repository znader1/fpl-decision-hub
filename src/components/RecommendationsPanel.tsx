import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransferPlanner } from "./TransferPlanner";
import { JerseyIcon } from "./JerseyIcon";
import type { FplTeamRecommendation } from "@/lib/fplAssistantApi";

const recommendations = [
  {
    type: "captain",
    title: "Captain Recommendation",
    player: "Haaland",
    team: "MCI",
    reason: "Home game vs. struggling defense",
    impact: "Expected: 12-16 pts",
  },
  {
    type: "bench",
    title: "Bench Order Suggestion",
    player: "Gvardiol",
    team: "MCI",
    reason: "Rotation risk - move to 1st bench",
    impact: "Minimize risk",
  },
];

interface RecommendationsPanelProps {
  recommendation?: FplTeamRecommendation;
  isRecommending?: boolean;
  horizonGws?: number;
}

const findName = (rec: FplTeamRecommendation, playerId: number) => {
  const inStart = rec.starting_xi.find((p) => p.player_id === playerId)?.web_name;
  if (inStart) return inStart;
  return rec.bench.find((p) => p.player_id === playerId)?.web_name;
};

export const RecommendationsPanel = ({
  recommendation,
  isRecommending = false,
  horizonGws,
}: RecommendationsPanelProps) => {
  return (
    <aside className="w-96 bg-card border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
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
                  {Math.round(recommendation.projected_points_with_captain * 100) / 100}
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
            </div>
          )}
        </Card>

        <TransferPlanner />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Tips
          </p>
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="p-3 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                {rec.type === "captain" && <Lightbulb className="h-4 w-4 text-primary" />}
                {rec.type === "bench" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                {rec.type === "transfer" && <TrendingUp className="h-4 w-4 text-primary" />}
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

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground">Weekly Summary</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• 2 high-value transfers available</p>
              <p>• Captain Haaland for optimal points</p>
              <p>• 1 rotation risk identified</p>
            </div>
            <Button className="w-full mt-3" size="sm">
              View Full Analysis
            </Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};
