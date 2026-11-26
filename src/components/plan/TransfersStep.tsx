import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JerseyIcon } from "@/components/JerseyIcon";
import { fmtGain } from "@/lib/format";
import type { TransferOptions } from "@/lib/planFlow";
import { RadioCard, RadioDot } from "./RadioCard";
import { RunPickCard } from "./RunPickCard";

interface TransfersStepProps {
  /** Null until the recommendation has answered. */
  options: TransferOptions | null;
  value: "make" | "roll" | null;
  /** The runner-up the plan makes instead of ZN Pick's move, if any. */
  pick?: { sell: number; buy: number } | null;
  /** `pick` set = make that "Also considered" move instead of the Make card's. */
  onPick: (choice: "make" | "roll", pick?: { sell: number; buy: number }) => void;
  loading?: boolean;
  /** Ask ZN Pick (again) for the deadline GW. */
  onRun?: () => void;
  error?: string;
  /** Horizon the moves are judged over; with a handler the step shows a 1/2/3/5 GW control. */
  horizonGws?: number;
  onHorizonChange?: (horizonGws: number) => void;
}

const HORIZON_CHOICES = [1, 2, 3, 5];

/** Step 1: "Make the move" (the verdict's moves) vs "Roll the transfer", as two radio cards. */
export function TransfersStep({ options, value, pick = null, onPick, loading = false, onRun = () => {}, error, horizonGws, onHorizonChange }: TransfersStepProps) {
  const horizonControl = onHorizonChange ? (
    <div role="group" aria-label="Judge moves over" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="mr-1">Judge moves over</span>
      {HORIZON_CHOICES.map((h) => {
        // Before the first run nothing is highlighted: the click is the choice
        // and starts ZN Pick (user testing, 2026-11).
        const active = Boolean(options) && h === horizonGws;
        return (
          <button
            key={h}
            type="button"
            aria-pressed={active}
            disabled={loading}
            onClick={() => onHorizonChange(h)}
            className={`rounded-full border px-2.5 py-1 font-semibold transition-colors ${
              active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {h} GW
          </button>
        );
      })}
      <span className="ml-1">1 GW judges this week alone, no roll-vs-move.</span>
    </div>
  ) : null;
  if (!options) {
    return (
      <div className="flex flex-col gap-3.5">
        {horizonControl}
        <RunPickCard
          idle={horizonControl ? "Pick how many gameweeks to judge moves over to run ZN Pick." : "Run ZN Pick to see your moves."}
          working="ZN Pick is working out your moves…"
          loading={loading}
          error={error}
          onRun={horizonControl && !error ? undefined : onRun}
        />
      </div>
    );
  }
  const { make, roll, alsoConsidered } = options;
  const makeChecked = value === "make" && !pick;
  return (
    <div className="flex flex-col gap-3.5">
      {horizonControl}
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        <RadioCard checked={makeChecked} disabled={!make} onPick={() => onPick("make")} label="Make the move">
          <div className="flex items-center gap-2.5">
            <RadioDot checked={makeChecked} />
            <span className="flex-1 text-base font-extrabold text-foreground">Make the move</span>
            {make?.zn && <Badge className="bg-primary text-white hover:bg-primary">ZN Pick</Badge>}
          </div>
          {make ? (
            <>
              {make.moves.map((m) => (
                <div key={`${m.sell.id}-${m.buy.id}`} className="flex items-center gap-1.5">
                  <JerseyIcon team={m.sell.team} size="sm" />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <JerseyIcon team={m.buy.team} size="sm" />
                  <span className="ml-1 text-[13px]">
                    <span className="text-muted-foreground line-through">{m.sell.name}</span>{" "}
                    <span className="text-[11px] text-muted-foreground">({m.sell.team})</span> → <b>{m.buy.name}</b>{" "}
                    <span className="text-[11px] text-muted-foreground">({m.buy.team})</span>
                  </span>
                </div>
              ))}
              <div className="flex items-baseline gap-2">
                <span className={`text-[34px] font-black leading-none tracking-tight tabular-nums ${make.gain >= 0 ? "text-accent" : "text-fdr-4"}`}>{fmtGain(make.gain)}</span>
                <span className="text-xs text-muted-foreground">{make.meta}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/80">{make.why}</p>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">No move clears the bar</p>
          )}
        </RadioCard>

        <RadioCard checked={value === "roll"} onPick={() => onPick("roll")} label="Roll the transfer">
          <div className="flex items-center gap-2.5">
            <RadioDot checked={value === "roll"} />
            <span className="flex-1 text-base font-extrabold text-foreground">Roll the transfer</span>
            {roll.zn && <Badge className="bg-primary text-white hover:bg-primary">ZN Pick</Badge>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] font-black leading-none tracking-tight tabular-nums text-foreground">{fmtGain(roll.gain)}</span>
            <span className="text-xs text-muted-foreground">{roll.meta}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/80">{roll.why}</p>
        </RadioCard>
      </div>

      {alsoConsidered.length > 0 && (
        <div role="radiogroup" aria-label="Also considered" className="flex flex-col gap-2">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Also considered · pick one instead</span>
          {alsoConsidered.map((a) => {
            const checked = value === "make" && pick?.sell === a.sellId && pick?.buy === a.buyId;
            return (
              <RadioCard
                key={`${a.sellId}-${a.buyId}`}
                checked={checked}
                onPick={() => onPick("make", { sell: a.sellId, buy: a.buyId })}
                label={`Make ${a.sell} to ${a.buy} instead`}
                className="!flex-row !flex-wrap !items-center !gap-2.5 !rounded-xl !px-3.5 !py-3"
              >
                <RadioDot checked={checked} size={16} />
                <span className="flex-1 text-[13px] text-foreground/90">
                  <span className="text-muted-foreground line-through">{a.sell}</span>{" "}
                  <span className="text-[11px] text-muted-foreground">({a.sellTeam})</span> → <b>{a.buy}</b>{" "}
                  <span className="text-[11px] text-muted-foreground">({a.buyTeam})</span>
                  <span className="text-xs text-muted-foreground">
                    {a.hit ? " · −4 hit" : ""} · net <b className={a.net < 0 ? "text-fdr-4" : "text-foreground"}>{fmtGain(a.net)}</b>
                  </span>
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{a.clearsBar ? `clears the ${fmtGain(a.bar)} bar` : `under the ${fmtGain(a.bar)} pts needed`}</span>
              </RadioCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
