import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonitorHeadline, MonitorState } from "@/lib/monitorReport";
import type { Tone } from "@/lib/monitorView";

interface MonitorGwBarProps {
  gw: number;
  entries: number[];
  entryId: number;
  onEntry: (entryId: number) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  state: MonitorState;
  headline: MonitorHeadline;
  scoutPartial: boolean;
}

const STATE_LABEL: Record<MonitorState, string> = {
  before_deadline: "Before deadline",
  live: "Live",
  finished: "Finished",
};

function Chip({ tone, label, value, note }: { tone: Tone | "best"; label: string; value: number | null; note?: string }) {
  const colour = tone === "best" ? "hsl(var(--muted-foreground))" : `hsl(var(--monitor-${tone}))`;
  return (
    <span
      data-testid={`chip-${tone}`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold text-foreground sm:text-xs"
      style={{ borderColor: `color-mix(in srgb, ${colour} 45%, transparent)`, background: `color-mix(in srgb, ${colour} 12%, transparent)` }}
    >
      {label}
      <b className="tabular-nums" style={{ color: colour }}>
        {value ?? "—"}
      </b>
      {note && <i className="not-italic text-[10px] text-muted-foreground">{note}</i>}
    </span>
  );
}

/** Gameweek bar: previous/next, entry selector, state pill and the four score chips. */
export function MonitorGwBar(p: MonitorGwBarProps) {
  const basisNote = p.headline.basis === "with_captain" ? "captains doubled" : "no captains";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={p.onPrev} disabled={!p.hasPrev} aria-label="Previous gameweek">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-bold">GW {p.gw}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={p.onNext} disabled={!p.hasNext} aria-label="Next gameweek">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground",
        )}
      >
        <i
          className={cn("inline-block h-1.5 w-1.5 rounded-full", p.state === "live" ? "bg-emerald-500" : p.state === "finished" ? "bg-muted-foreground" : "bg-warning")}
        />
        {STATE_LABEL[p.state]}
      </span>
      {p.entries.length > 1 && (
        <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Entry</span>
          <select
            aria-label="Entry"
            className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground"
            value={p.entryId}
            onChange={(e) => p.onEntry(Number(e.target.value))}
          >
            {p.entries.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Chip tone="app" label="App XI" value={p.headline.app} />
        <Chip tone="scout" label="Scout" value={p.headline.scout} note={p.scoutPartial ? "partial" : undefined} />
        <Chip tone="you" label="You" value={p.headline.you} />
        <Chip tone="best" label="Best possible" value={p.headline.best} />
        <span className="text-[10px] text-muted-foreground">{basisNote}</span>
      </div>
    </div>
  );
}
