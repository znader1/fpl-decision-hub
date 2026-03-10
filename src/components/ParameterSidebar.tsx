import { Sliders, Sparkles } from "lucide-react";
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
    <aside className="w-80 shrink-0 bg-card border-r border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
            <Sliders className="h-5 w-5 text-primary" />
            Parameters
          </h2>
        </div>

        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Team</h3>

          <div className="space-y-2">
            <Label htmlFor="entry-id" className="text-xs text-muted-foreground">
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
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Horizon (GWs)</Label>
            <Select value={String(horizonGws)} onValueChange={(v) => onHorizonGwsChange(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((gw) => (
                  <SelectItem key={gw} value={String(gw)}>
                    {gw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy" className="text-xs text-muted-foreground">
              Transfer strategy (optional)
            </Label>
            <Input
              id="strategy"
              placeholder="e.g. balanced"
              value={transferStrategy}
              onChange={(e) => onTransferStrategyChange(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Only sent if your recommendation URL template contains <span className="font-mono">{`{strategy}`}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="include-transfers" className="text-xs text-muted-foreground">
                Include transfer suggestions
              </Label>
              <Switch
                id="include-transfers"
                checked={includeTransfers}
                onCheckedChange={onIncludeTransfersChange}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Only sent if your recommendation URL template contains{" "}
              <span className="font-mono">{`{include_transfers}`}</span>.
            </p>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onRecommend}
            disabled={recommendDisabled}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isRecommending ? "Computing..." : "Recommend Squad"}
          </Button>
          {recommendErrorMessage && (
            <p className="text-xs text-destructive break-words">{recommendErrorMessage}</p>
          )}

          {hasRecommendation && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={pitchMode === "squad" ? "default" : "outline"}
                size="sm"
                onClick={() => onPitchModeChange("squad")}
              >
                Squad
              </Button>
              <Button
                variant={pitchMode === "recommendation" ? "default" : "outline"}
                size="sm"
                onClick={() => onPitchModeChange("recommendation")}
              >
                Recommended
              </Button>
            </div>
          )}
        </Card>

        {/* Existing filter UI can be reconnected to backend later. */}
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Filters (placeholder)</span>
              <span className="text-sm text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
};
