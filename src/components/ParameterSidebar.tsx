import { useState } from "react";
import { Sliders, TrendingUp, Calendar, DollarSign, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ParameterSidebar = () => {
  const [loading, setLoading] = useState(false);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-players");
      if (error) throw error;
      console.log("Players data:", data);
      toast({ title: "Success", description: `Fetched ${Array.isArray(data) ? data.length : 0} players from backend` });
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
            <Sliders className="h-5 w-5 text-primary" />
            Parameters
          </h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Budget Range
              </label>
              <span className="text-sm text-muted-foreground">£4.5 - £13.0</span>
            </div>
            <Slider defaultValue={[45, 130]} max={150} min={40} step={5} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Form Rating
              </label>
              <span className="text-sm text-muted-foreground">5+</span>
            </div>
            <Slider defaultValue={[5]} max={10} min={0} step={1} />
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Fixture Difficulty
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              Easy (1-2)
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Medium (3)
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Hard (4-5)
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              All
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Positions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">GK</Button>
            <Button variant="outline" size="sm">DEF</Button>
            <Button variant="outline" size="sm">MID</Button>
            <Button variant="outline" size="sm">FWD</Button>
          </div>
        </div>

        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Apply Filters
        </Button>

        <Button
          onClick={fetchPlayers}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {loading ? "Fetching..." : "Fetch Players from API"}
        </Button>
      </div>
    </aside>
  );
};
