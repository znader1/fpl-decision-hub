import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  FplTransferPlanHorizon,
  FplTransferVerdictDetail,
  FplTransferVerdictMove,
} from "@/lib/fplAssistantApi";

type Verdict = NonNullable<FplTransferPlanHorizon["verdict"]>;

const LABEL: Record<Verdict, string> = {
  roll: "Roll it",
  spend: "Make the move",
  spend_forced_injury: "Injury: act now",
};

// 300/400-weight shades on dark per the 2026-09-12 audit (U5); 600/700 on light.
const TONE: Record<Verdict, string> = {
  roll: "border-border bg-muted/10 text-muted-foreground",
  spend: "border-emerald-600/30 bg-emerald-600/[0.08] text-emerald-700 dark:text-emerald-300",
  spend_forced_injury: "border-destructive/30 bg-destructive/[0.08] text-destructive",
};

/** `+0.9` / `−1.3`; one decimal, typographic minus. */
export const fmtGain = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}`;

/** `GW5–7`, `GW5`, or `the horizon` when unknown. */
export const gwRange = (h: { start_gw: number | null; end_gw: number | null }) => {
  if (h.start_gw == null) return "the horizon";
  if (h.end_gw == null || h.end_gw === h.start_gw) return `GW${h.start_gw}`;
  return `GW${h.start_gw}–${h.end_gw}`;
};

const movesText = (moves: FplTransferVerdictMove[]) =>
  moves.map((m) => `${m.sell.name} → ${m.buy.name}`).join(" + ");

function MoveLine({ m }: { m: FplTransferVerdictMove }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1">
      <span className="text-red-600 dark:text-red-400">{m.sell.name}</span>
      <span className="text-muted-foreground">({m.sell.team} £{m.sell.price})</span>
      {m.forced_injury && (
        <Badge variant="outline" className="border-destructive/50 text-[10px] text-destructive">flagged</Badge>
      )}
      <span>→</span>
      <span className="font-semibold text-emerald-700 dark:text-emerald-300">{m.buy.name}</span>
      <span className="text-muted-foreground">({m.buy.team} £{m.buy.price})</span>
    </span>
  );
}

/** Pre-verdict_detail backends: the prose banner, unchanged. */
function LegacyVerdictBanner({ plan }: { plan: FplTransferPlanHorizon }) {
  if (!plan.verdict) return null;
  const showFt =
    typeof plan.first_gw_ft_before === "number" && typeof plan.first_gw_ft_after === "number";
  const n = plan.horizon_gws ?? plan.gws?.length ?? 1;
  return (
    <div data-testid="plan-verdict-banner" className={`rounded-lg border p-3 flex flex-col gap-1 ${TONE[plan.verdict]}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{LABEL[plan.verdict]}</Badge>
        {showFt && <span className="ml-auto text-xs text-muted-foreground">FT {plan.first_gw_ft_before}→{plan.first_gw_ft_after}</span>}
      </div>
      {plan.reasoning && <p className="text-xs leading-relaxed">{plan.reasoning}</p>}
      <p className="text-[11px] opacity-70 leading-relaxed">
        {plan.allow_hits
          ? `Planned across ${n} GWs and allowed to take hits, so it can name more moves than the free-transfer suggestions above.`
          : `Planned across ${n} GWs using free transfers only.`}
      </p>
    </div>
  );
}

interface DecisionCardProps {
  plan: FplTransferPlanHorizon;
  appliedTransferCount?: number;
  isApplying?: boolean;
  /** Plan moves lead `transfers.moves`, so applying k plan moves = index k-1. */
  onApplyTransferAtIndex?: (index: number) => void;
}

export function DecisionCard({ plan, appliedTransferCount = 0, isApplying = false, onApplyTransferAtIndex }: DecisionCardProps) {
  const d: FplTransferVerdictDetail | undefined = plan.verdict_detail;
  if (!d) return <LegacyVerdictBanner plan={plan} />;
  const range = gwRange(d.horizon);
  const k = d.moves.length;
  const applied = k > 0 && appliedTransferCount >= k;

  return (
    <div data-testid="plan-verdict-banner" className={`rounded-lg border p-3 flex flex-col gap-1.5 ${TONE[d.action]}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{LABEL[d.action]}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">FT {d.ft_before}→{d.ft_after}</span>
      </div>

      {d.action === "roll" ? (
        <>
          <p className="text-sm text-foreground">
            {d.roll_alternative
              ? `Moving now (${movesText(d.roll_alternative.moves) || "no move"}) would net ${fmtGain(d.roll_alternative.net)} over ${range}; rolling nets ${fmtGain(d.plan_net)}.`
              : `Bank the free transfer. No move clears ${fmtGain(d.threshold)} over ${range}.`}
          </p>
          {d.next_move && (
            <p className="text-[11px] text-muted-foreground">
              Next planned move: {movesText(d.next_move.moves)} in GW{d.next_move.gw} (
              {fmtGain(d.next_move.horizon_gain)} over {gwRange({ start_gw: d.next_move.gw, end_gw: d.horizon.end_gw })})
            </p>
          )}
        </>
      ) : (
        <>
          <ul className="text-sm space-y-0.5">
            {d.moves.map((m, i) => <li key={i}><MoveLine m={m} /></li>)}
          </ul>
          <p className="text-sm text-foreground" data-testid="decision-gains">
            <b>{fmtGain(d.this_gw_gain)}</b> this GW · <b>{fmtGain(d.horizon_gain)}</b> over {range}
            {d.hit_cost > 0 && <> · <b className="text-red-600 dark:text-red-400">−{d.hit_cost} hit</b></>}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              Plan {range} nets {fmtGain(d.plan_net)}
              {d.roll_alternative ? ` · rolling instead nets ${fmtGain(d.roll_alternative.net)}` : ""}
            </span>
            {onApplyTransferAtIndex && k > 0 && (
              <Button
                type="button"
                size="sm"
                variant={applied ? "secondary" : "default"}
                className="ml-auto h-8 text-xs"
                disabled={isApplying || applied}
                onClick={() => onApplyTransferAtIndex(k - 1)}
              >
                {applied ? "Applied" : k > 1 ? `Apply ${k} moves` : "Apply"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
