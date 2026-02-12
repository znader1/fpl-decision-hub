import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransferPlanner } from "./TransferPlanner";
import { JerseyIcon } from "./JerseyIcon";

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

export const RecommendationsPanel = () => {
  return (
    <aside className="w-96 bg-card border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI-powered insights for GW 25</p>
        </div>

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
