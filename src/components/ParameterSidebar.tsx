import { useState } from "react";
import {
  Sliders,
  Zap,
  ChevronLeft,
  ChevronRight,
  User,
  CalendarDays,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

interface ParameterSidebarProps {
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
  pitchMode: "squad" | "recommendation";
  onPitchModeChange: (mode: "squad" | "recommendation") => void;
  hasRecommendation: boolean;
}

export const ParameterSidebar = ({
  entryId,
  onEntryIdChange,
  horizonGws,
  onHorizonGwsChange,
  chipStrategy,
  onChipStrategyChange,
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
  const [collapsed, setCollapsed] = useState(false);

  const recommendDisabled = !canRecommend || !Number.isFinite(entryId) || entryId <= 0 || isRecommending;
  const chipActive = chipStrategy === "wildcard" || chipStrategy === "free_hit";
  const includeTransfersDisabled = chipActive;
  const effectiveHorizonLabel = chipStrategy === "free_hit" ? "1 GW (Free Hit)" : `${horizonGws} GWs`;
  const chipLabel = chipActive
    ? chipStrategy === "wildcard" ? "Wildcard" : "Free Hit"
    : "No chip";

  /* ── Collapsed icon rail ─────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <aside className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-3">
        {/* Expand toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand panel</TooltipContent>
        </Tooltip>

        <div className="flex flex-col items-center gap-3 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50">
                <User className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Entry ID: {entryId || "not set"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50">
                <CalendarDays className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Horizon: {effectiveHorizonLabel}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50">
                <Sparkles className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Chip: {chipLabel}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Transfers: {includeTransfers ? "on" : "off"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recommend button — icon only */}
        <div className="mt-auto mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-9 w-9 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                onClick={onRecommend}
                disabled={recommendDisabled}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isRecommending ? "Computing…" : chipActive ? "Build Chip Draft" : "Recommend Squad"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    );
  }

  /* ── Expanded sidebar ────────────────────────────────────────────────────── */
  return (
    <aside className="w-72 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-sidebar-primary" />
          <span className="font-bold text-sm text-sidebar-foreground tracking-tight">Parameters</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

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
              {[1, 2, 3, 4, 5, 6].map((gw) => (
                <SelectItem key={gw} value={String(gw)}>
                  {gw} GW{gw > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {chipStrategy === "free_hit" && (
            <p className="text-[11px] text-sidebar-foreground/40">Forced to 1 GW by Free Hit</p>
          )}
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
          {chipActive && (
            <p className="text-[11px] text-sidebar-foreground/40">
              Squad built from market optimisation, not current picks.
            </p>
          )}
        </div>

        {/* Include transfers */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Transfer suggestions
            </p>
            {includeTransfersDisabled && (
              <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">Disabled while chip is active</p>
            )}
          </div>
          <Switch
            checked={includeTransfers}
            onCheckedChange={onIncludeTransfersChange}
            disabled={includeTransfersDisabled}
          />
        </div>

        {/* View toggle (only when recommendation exists) */}
        {hasRecommendation && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              View
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant={pitchMode === "squad" ? "default" : "outline"}
                size="sm"
                className={
                  pitchMode === "squad"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground text-xs"
                    : "border-sidebar-border text-sidebar-foreground text-xs"
                }
                onClick={() => onPitchModeChange("squad")}
              >
                Current
              </Button>
              <Button
                variant={pitchMode === "recommendation" ? "default" : "outline"}
                size="sm"
                className={
                  pitchMode === "recommendation"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground text-xs"
                    : "border-sidebar-border text-sidebar-foreground text-xs"
                }
                onClick={() => onPitchModeChange("recommendation")}
              >
                AI Pick
              </Button>
            </div>
          </div>
        )}
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
        {recommendErrorMessage && (
          <p className="text-xs text-destructive break-words">{recommendErrorMessage}</p>
        )}
      </div>
    </aside>
  );
};
