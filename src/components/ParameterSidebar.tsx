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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FplChipStrategy } from "@/lib/fplAssistantApi";
import { ParameterForm } from "@/components/ParameterForm";

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
  isLiveGw?: boolean;
  maxHorizon?: number;
}

export const ParameterSidebar = (props: ParameterSidebarProps) => {
  const {
    entryId,
    horizonGws,
    chipStrategy,
    includeTransfers,
    canRecommend,
    isRecommending,
    onRecommend,
    isLiveGw = false,
  } = props;
  const [collapsed, setCollapsed] = useState(false);

  // A live GW no longer blocks the action — the handler plans the next GW instead.
  const recommendDisabled = !canRecommend || !Number.isFinite(entryId) || entryId <= 0 || isRecommending;
  const chipActive = chipStrategy === "wildcard" || chipStrategy === "free_hit";
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
    <aside className="w-56 xl:w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
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

      <ParameterForm {...props} />
    </aside>
  );
};
