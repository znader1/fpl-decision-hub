import type { bestStrip } from "@/lib/monitorView";

/** One line: the best eleven in hindsight and its total, or why there is none. */
export function BestXiStrip({ strip }: { strip: ReturnType<typeof bestStrip> }) {
  return (
    <div data-testid="best-strip" className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border border-border bg-card px-3 py-2 text-xs">
      <span className="font-semibold text-foreground">
        Best possible XI in hindsight
        {strip.points !== null && (
          <>
            {" · "}
            <b className="tabular-nums">{strip.points}</b>
          </>
        )}
      </span>
      <span className="text-muted-foreground">{strip.reason ?? strip.names.join(", ")}</span>
    </div>
  );
}
