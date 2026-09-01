import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import {
  CHIP_LABELS,
  type ChipName,
  type ChipPlanRecommendation,
  type ChipPlanResponse,
} from "@/lib/fplAssistantApi";

type Props = {
  plan: ChipPlanResponse | null | undefined;
  isLoading: boolean;
};

const EvCurve = ({ points }: { points: ChipPlanRecommendation["ev_curve"] }) => {
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => p.ev), 1);
  return (
    <div className="flex items-end gap-1 h-10 mt-2" aria-label="EV by gameweek">
      {points.map((p) => (
        <div key={p.gw} className="flex flex-col items-center gap-0.5">
          <div
            className="w-4 rounded-t bg-primary/70"
            style={{ height: `${Math.max(4, (p.ev / max) * 32)}px` }}
            title={`GW${p.gw}: +${p.ev} xPts`}
          />
          <span className="text-[9px] text-muted-foreground">{p.gw}</span>
        </div>
      ))}
    </div>
  );
};

const RecommendationRow = ({ rec }: { rec: ChipPlanRecommendation }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="font-semibold text-sm">{CHIP_LABELS[rec.chip]}</span>
          {rec.provisional && (
            <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground px-2 py-0.5">
              provisional
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold">GW{rec.event_id}</span>
          {rec.ev_gain !== null && (
            <span className="text-sm font-semibold text-primary">+{rec.ev_gain} xPts</span>
          )}
        </div>
      </button>
      {open && (
        <div className="mt-2 pl-5">
          <ul className="space-y-1">
            {rec.reasons.map((reason) => (
              <li key={reason} className="text-xs text-muted-foreground">
                {reason}
              </li>
            ))}
          </ul>
          <EvCurve points={rec.ev_curve} />
        </div>
      )}
    </div>
  );
};

export const ChipRoadmapPanel = ({ plan, isLoading }: Props) => {
  if (isLoading && !plan) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Analyzing chip windows…
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No chip plan yet — set your entry ID and gameweek.
      </div>
    );
  }

  const recommendedChips = new Set(plan.recommendations.map((r) => r.chip));
  const holds = plan.chips_remaining.filter(
    (c) => c.available && !recommendedChips.has(c.name)
  );
  const used = plan.chips_remaining.filter((c) => !c.available);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Chip roadmap</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          model horizon: {plan.horizon_model_gws} GWs
        </span>
      </div>

      {plan.recommendations.length > 0 ? (
        <div className="space-y-2">
          {plan.recommendations.map((rec) => (
            <RecommendationRow key={`${rec.chip}-${rec.event_id}`} rec={rec} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No chip clears the bar in the next {plan.horizon_model_gws} gameweeks — holding
          everything is the recommended play.
        </p>
      )}

      {holds.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Holding
          </h4>
          <ul className="space-y-1">
            {holds.map((c) => (
              <li key={c.name} className="text-xs text-muted-foreground flex justify-between">
                <span>{CHIP_LABELS[c.name]}</span>
                <span>expires GW{c.expires_gw}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {used.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Used this half
          </h4>
          <ul className="space-y-1">
            {used.map((c) => (
              <li key={c.name} className="text-xs text-muted-foreground/70 flex justify-between">
                <span>{CHIP_LABELS[c.name]}</span>
                <span>used</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
