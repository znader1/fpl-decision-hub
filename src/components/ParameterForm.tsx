import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FplChipStrategy } from "@/lib/fplAssistantApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHIP_OPTIONS: Array<{ value: FplChipStrategy; label: string }> = [
  { value: "none", label: "No chip" },
  { value: "wildcard", label: "Wildcard" },
  { value: "free_hit", label: "Free Hit" },
];

export interface ParameterFormProps {
  entryId: number;
  onEntryIdChange: (entryId: number) => void;
  horizonGws: number;
  onHorizonGwsChange: (horizonGws: number) => void;
  chipStrategy: FplChipStrategy;
  onChipStrategyChange: (strategy: FplChipStrategy) => void;
  includeTransfers: boolean;
  onIncludeTransfersChange: (includeTransfers: boolean) => void;
  canRecommend: boolean;
  isRecommending: boolean;
  onRecommend: () => void;
  recommendErrorMessage?: string;
  isLiveGw?: boolean;
  maxHorizon?: number;
}

export const ParameterForm = (props: ParameterFormProps) => {
  const {
    entryId, onEntryIdChange, horizonGws, onHorizonGwsChange,
    chipStrategy, onChipStrategyChange, includeTransfers, onIncludeTransfersChange,
    canRecommend, isRecommending, onRecommend, recommendErrorMessage,
    isLiveGw = false, maxHorizon = 6,
  } = props;

  const recommendDisabled =
    !canRecommend || !Number.isFinite(entryId) || entryId <= 0 || isRecommending || isLiveGw;
  const cappedHorizonOptions = Array.from(
    { length: Math.max(1, Math.min(6, maxHorizon)) },
    (_, i) => i + 1
  );
  const chipActive = chipStrategy === "wildcard" || chipStrategy === "free_hit";
  const includeTransfersDisabled = chipActive;

  return (
    <>
      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* Entry ID */}
        <div className="space-y-1.5">
          <Label htmlFor="entry-id" className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Team Entry ID
          </Label>
          <Input
            id="entry-id"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 588004"
            value={entryId ? String(entryId) : ""}
            onChange={(e) => onEntryIdChange(Number(e.target.value))}
            className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 h-9"
          />
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            Find yours on the FPL site under Points — it's in the page URL.
          </p>
        </div>

        <div className="border-t border-sidebar-border" />

        {/* Horizon */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Planning Horizon
          </Label>
          <Select
            value={String(horizonGws)}
            onValueChange={(v) => onHorizonGwsChange(Number(v))}
            disabled={chipStrategy === "free_hit"}
          >
            <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cappedHorizonOptions.map((gw) => (
                <SelectItem key={gw} value={String(gw)}>
                  {gw} GW{gw > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            {chipStrategy === "free_hit"
              ? "Forced to 1 GW — Free Hit only optimises the next gameweek."
              : "How many gameweeks ahead to optimise for. 3 GWs is a good default."}
          </p>
        </div>

        {/* Chip strategy */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Chip Strategy
          </Label>
          <Select value={chipStrategy} onValueChange={(v) => onChipStrategyChange(v as FplChipStrategy)}>
            <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHIP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            {chipStrategy === "wildcard"
              ? "Wildcard: builds an entirely new 15-man squad from scratch."
              : chipStrategy === "free_hit"
              ? "Free Hit: one-week optimal squad — your picks reset next GW."
              : "Select Wildcard or Free Hit to draft a chip squad."}
          </p>
        </div>

        {/* Include transfers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Transfer suggestions
            </p>
            <Switch
              checked={includeTransfers}
              onCheckedChange={onIncludeTransfersChange}
              disabled={includeTransfersDisabled}
            />
          </div>
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            {includeTransfersDisabled
              ? "Disabled — chip mode builds a full squad, transfers don't apply."
              : "Show which players to bring in and the expected point gain per move."}
          </p>
        </div>

      </div>

      {/* Recommend CTA — pinned to bottom */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-bold shadow-md"
          onClick={onRecommend}
          disabled={recommendDisabled}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isRecommending ? "Computing…" : chipActive ? "Build Chip Draft" : "Recommend Squad"}
        </Button>
        {isLiveGw && (
          <p className="text-xs text-muted-foreground">
            GW in progress — switch to a future GW to plan transfers.
          </p>
        )}
        {recommendErrorMessage && (
          <p className="text-xs text-destructive break-words">{recommendErrorMessage}</p>
        )}
      </div>
    </>
  );
};
