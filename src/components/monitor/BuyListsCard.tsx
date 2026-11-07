import { playerOf, type ListSide, type MonitorReport } from "@/lib/monitorReport";
import { WINDOW_KEYS } from "@/lib/monitorView";
import { MonitorCardShell } from "./MonitorCardShell";
import { Muted } from "./shared";

const fmt1 = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : "—");
const fmt2 = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(2) : "—");

const isScoutUrl = (u: string | undefined) => typeof u === "string" && u.startsWith("https://www.premierleague.com/");

function ListColumn({ id, title, side, report }: { id: "app" | "scout"; title: string; side: ListSide; report: MonitorReport }) {
  return (
    <div className="min-w-0 flex-1">
      <h5 className="mb-1 flex items-center gap-1.5 font-semibold" style={{ color: `hsl(var(--monitor-${id}))` }}>
        {title}
        {side.available && side.needs_review && (
          <span className="rounded bg-warning/15 px-1 py-px text-[9px] font-medium text-warning">needs review</span>
        )}
        {side.available && isScoutUrl(side.url) && (
          <a href={side.url} target="_blank" rel="noreferrer" className="text-[10px] font-normal text-muted-foreground underline">
            article
          </a>
        )}
      </h5>
      {side.available === false ? (
        <p className="text-muted-foreground">{side.reason}</p>
      ) : (
        <table className="w-full">
          <tbody>
            {side.players.map((p) => (
              <tr key={p.id}>
                <td className="py-0.5 pr-1">
                  {playerOf(report, p.id).name}
                  {typeof p.price_m === "number" && <Muted> £{p.price_m.toFixed(1)}m</Muted>}
                  {id === "scout" && (
                    <Muted>
                      {" "}
                      · app <span data-testid={`buy-xpts-scout-${p.id}`}>{fmt1(playerOf(report, p.id).xpts)}</span>
                    </Muted>
                  )}
                </td>
                {WINDOW_KEYS.map((k) => (
                  <td key={k} className="py-0.5 pl-1 text-right tabular-nums">
                    {p.windows?.[k]?.points ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="pt-1 text-muted-foreground">avg per player</td>
              <td colSpan={3} data-testid={`buy-avg-${id}`} className="pt-1 text-right tabular-nums">
                {WINDOW_KEYS.map((k) => fmt1(side.avg?.[k])).join(" · ")}
              </td>
            </tr>
            <tr>
              <td className="text-muted-foreground">per £m</td>
              <td colSpan={3} data-testid={`buy-avgm-${id}`} className="text-right tabular-nums text-muted-foreground">
                {WINDOW_KEYS.map((k) => fmt2(side.avg_per_m?.[k])).join(" · ")}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Contest 2: who to buy in general. The app's buy list against the Scout's transfer radar. */
export function BuyListsCard({ report }: { report: MonitorReport }) {
  return (
    <MonitorCardShell title="Who to buy" subtitle="points over 1, 3 and 5 gameweeks; average per player, and per £m because the two lists do not cost the same" testId="buy-lists-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <ListColumn id="app" title="App buy list" side={report.buy_lists.app} report={report} />
        <ListColumn id="scout" title="Scout transfer radar" side={report.buy_lists.scout} report={report} />
      </div>
    </MonitorCardShell>
  );
}
