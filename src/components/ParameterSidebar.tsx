import { Sliders, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STRATEGY_OPTIONS = [
  { value: "", label: "None" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" },
  { value: "conservative", label: "Conservative" },
  { value: "wildcard", label: "Wildcard" },
  { value: "free_hit", label: "Free Hit" },
  { value: "bench_boost", label: "Bench Boost" },
  { value: "triple_captain", label: "Triple Captain" },
];

interface ParameterSidebarProps {
  entryId: number;
  onEntryIdChange: (entryId: number) => void;
  horizonGws: number;
  onHorizonGwsChange: (horizonGws: number) => void;
  transferStrategy: string;
  onTransferStrategyChange: (strategy: string) => void;
  includeTransfers: boolean;
  onIncludeTransfersChange: (includeTransfers: boolean) => void;
  canRecommend: boolean;
  isRecommending: boolean;
  onRecommend: () => void;
  recommendErrorMessage?: string;
  pitchMode: "squad" | "recommendation";
  onPitchModeChange: (mode: "squad" | "recommendation") => void;
  hasRecommendation: boolean;
}

export const ParameterSidebar = ({
  entryId,
  onEntryIdChange,
  horizonGws,
  onHorizonGwsChange,
  transferStrategy,
  onTransferStrategyChange,
  includeTransfers,
  onIncludeTransfersChange,
  canRecommend,
  isRecommending,
  onRecommend,
  recommendErrorMessage,
  pitchMode,
  onPitchModeChange,
  hasRecommendation,
}: ParameterSidebarProps) => {
  const recommendDisabled = !canRecommend || !Number.isFinite(entryId) || entryId <= 0 || isRecommending;

  return (
    <aside className="w-80 shrink-0 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-sidebar-foreground flex items-center gap-2 mb-1 tracking-tight">
            <Sliders className="h-5 w-5 text-sidebar-primary" />
            Parameters
          </h2>
          <p className="text-xs text-sidebar-foreground/60 ml-7">Configure your squad analysis</p>
        </div>

        <Card className="p-4 space-y-4 bg-sidebar-accent border-sidebar-border">
          <h3 className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider">Team</h3>

          <div className="space-y-1.5">
            <Label htmlFor="entry-id" className="text-xs text-sidebar-foreground/70">
              Entry ID
            </Label>
            <Input
              id="entry-id"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="e.g. 588004"
              value={entryId ? String(entryId) : ""}
              onChange={(e) => onEntryIdChange(Number(e.target.value))}
              className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4 bg-sidebar-accent border-sidebar-border">
          <h3 className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider">Recommendation</h3>

          <div className="space-y-1.5">
            <Label className="text-xs text-sidebar-foreground/70">Horizon (GWs)</Label>
            <Select value={String(horizonGws)} onValueChange={(v) => onHorizonGwsChange(Number(v))}>
              <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((gw) => (
                  <SelectItem key={gw} value={String(gw)}>
                    {gw} GW{gw > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-sidebar-foreground/70">
              Transfer Strategy
            </Label>
            <Select value={transferStrategy} onValueChange={onTransferStrategyChange}>
              <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Select strategy…" />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || "none"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="include-transfers" className="text-xs text-sidebar-foreground/70">
                Include transfer suggestions
              </Label>
              <Switch
                id="include-transfers"
                checked={includeTransfers}
                onCheckedChange={onIncludeTransfersChange}
              />
            </div>
          </div>

          <Button
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-md"
            onClick={onRecommend}
            disabled={recommendDisabled}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRecommending ? "Computing…" : "Recommend Squad"}
          </Button>
          {recommendErrorMessage && (
            <p className="text-xs text-destructive break-words">{recommendErrorMessage}</p>
          )}

          {hasRecommendation && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={pitchMode === "squad" ? "default" : "outline"}
                size="sm"
                className={pitchMode === "squad" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "border-sidebar-border text-sidebar-foreground"}
                onClick={() => onPitchModeChange("squad")}
              >
                Squad
              </Button>
              <Button
                variant={pitchMode === "recommendation" ? "default" : "outline"}
                size="sm"
                className={pitchMode === "recommendation" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "border-sidebar-border text-sidebar-foreground"}
                onClick={() => onPitchModeChange("recommendation")}
              >
                Recommended
              </Button>
            </div>
          )}
        </Card>
      </div>
    </aside>
  );
};
