import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const recommendations = [
  {
    type: "transfer",
    title: "Consider Transferring Out",
    player: "Sterling",
    reason: "Difficult fixtures ahead (AVG: 4.2)",
    alternative: "Saka - Easy fixtures, in form",
    impact: "+15 pts expected",
  },
  {
    type: "captain",
    title: "Captain Recommendation",
    player: "Haaland",
    reason: "Home game vs. struggling defense",
    impact: "Expected: 12-16 pts",
  },
  {
    type: "bench",
    title: "Bench Order Suggestion",
    player: "Walker",
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
            Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI-powered insights for GW 25</p>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {rec.type === "transfer" && <TrendingUp className="h-4 w-4 text-primary" />}
                  {rec.type === "captain" && <Lightbulb className="h-4 w-4 text-primary" />}
                  {rec.type === "bench" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  <h3 className="font-semibold text-sm text-foreground">{rec.title}</h3>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{rec.player}</p>
                <p className="text-muted-foreground text-xs">{rec.reason}</p>
                {rec.alternative && (
                  <p className="text-primary text-xs font-medium">→ {rec.alternative}</p>
                )}
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
              <p>• 3 high-value transfers available</p>
              <p>• Captain Haaland for optimal points</p>
              <p>• 2 rotation risks identified</p>
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
