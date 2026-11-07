import { JerseyIcon } from "@/components/JerseyIcon";
import { cn } from "@/lib/utils";
import type { CardModel } from "@/lib/monitorView";

const fmtXpts = (v: number | null) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : "—");
const fmtPoints = (v: number | null) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "—");

/**
 * Compact card for three pitches across: a small jersey, the name, then
 * `points · projection`. Real points first (doubled on the armband where the
 * column's total doubles), the app's pre-deadline projection in grey. A pink
 * ring marks a player who is also in the app's eleven; 0 minutes fades him.
 */
export function MonitorPlayerCard({ card }: { card: CardModel }) {
  return (
    <div
      data-testid="monitor-card"
      data-shared={card.shared ? "true" : undefined}
      data-faded={card.faded ? "true" : undefined}
      data-doubled={card.doubled ? "true" : undefined}
      className={cn("flex w-[58px] flex-col items-center gap-0.5 sm:w-[72px]", card.faded && "opacity-60")}
      title={`${card.name} · ${card.club}`}
    >
      <div className="relative">
        <JerseyIcon team={card.club} size="sm" isCaptain={card.isCaptain} />
        {card.isVice && (
          <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-muted-foreground text-[8px] font-bold text-background">
            V
          </div>
        )}
      </div>
      <div
        className={cn(
          "w-full overflow-hidden rounded-md border border-border bg-card/95 px-0.5 py-0.5 text-center shadow-sm backdrop-blur-sm",
          card.shared && "ring-2 ring-[hsl(var(--monitor-app))]",
        )}
      >
        <p className="truncate text-[10px] font-bold leading-tight text-foreground">{card.name}</p>
        <p className="text-[8px] leading-tight text-muted-foreground">{card.club}</p>
        <p className="flex justify-center gap-0.5 whitespace-nowrap text-[10px] leading-tight tabular-nums">
          <span className="font-semibold text-foreground" title="Points">
            {fmtPoints(card.points)}
          </span>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground/80" title="App projection">
            {fmtXpts(card.xpts)}
          </span>
        </p>
      </div>
    </div>
  );
}
