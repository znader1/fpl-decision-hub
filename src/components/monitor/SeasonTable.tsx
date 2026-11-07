import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SeasonRowModel } from "@/lib/monitorView";
import { cn } from "@/lib/utils";

const CLOSER_LABEL = { app: "App", scout: "Scout", level: "Level" } as const;
const STATE_LABEL = { before_deadline: "Before deadline", live: "Live", finished: "" } as const;

const n = (v: number | null) => (v === null ? "—" : String(v));

/** One row per gameweek with the running app and Scout totals; a click opens the gameweek. */
export function SeasonTable({ rows, onOpenGw }: { rows: SeasonRowModel[]; onOpenGw: (gw: number) => void }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No gameweeks yet</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>GW</TableHead>
            <TableHead className="text-right" style={{ color: "hsl(var(--monitor-app))" }}>App XI</TableHead>
            <TableHead className="text-right" style={{ color: "hsl(var(--monitor-scout))" }}>Scout</TableHead>
            <TableHead className="text-right" style={{ color: "hsl(var(--monitor-you))" }}>You</TableHead>
            <TableHead className="text-right">Best</TableHead>
            <TableHead>Closer</TableHead>
            <TableHead className="text-right">App total</TableHead>
            <TableHead className="text-right">Scout total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.gw}
              role="row"
              aria-label={`Open gameweek ${r.gw}`}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onOpenGw(r.gw)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenGw(r.gw);
                }
              }}
            >
              <TableCell className="font-semibold">
                {r.gw}
                {r.state !== "finished" && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                    {STATE_LABEL[r.state]}
                  </span>
                )}
                {r.chipWeek && <span className="ml-1.5 text-[10px] text-muted-foreground">chip</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">{n(r.app)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(r.scout)}</TableCell>
              <TableCell className="text-right tabular-nums">{n(r.you)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{n(r.best)}</TableCell>
              <TableCell
                className={cn("font-medium")}
                style={r.closer && r.closer !== "level" ? { color: `hsl(var(--monitor-${r.closer}))` } : undefined}
              >
                {r.closer ? CLOSER_LABEL[r.closer] : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.counted ? r.runApp : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{r.counted ? r.runScout : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
