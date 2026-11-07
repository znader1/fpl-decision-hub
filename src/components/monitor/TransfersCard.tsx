import { playerOf, type MonitorReport, type TransferSide, type Window } from "@/lib/monitorReport";
import { fmtGain, verdictLabel, WINDOW_KEYS } from "@/lib/monitorView";
import { MonitorCardShell } from "./MonitorCardShell";
import { Muted } from "./shared";

/** "+2" when the window is complete, "+2 · 1 of 3" while it is still running. */
const windowText = (w: Window | undefined, key: string): string => {
  if (!w) return "—";
  return w.complete ? fmtGain(w.gain) : `${fmtGain(w.gain)} · ${w.played} of ${key}`;
};

function SideRow({
  label,
  id,
  side,
  report,
}: {
  label: string;
  id: "app" | "you";
  side: TransferSide;
  report: MonitorReport;
}) {
  if (side.available === false) {
    return (
      <tr>
        <th scope="row" className="py-1 pr-2 text-left font-semibold">{label}</th>
        <td colSpan={4} className="py-1 text-muted-foreground">{side.reason}</td>
      </tr>
    );
  }
  const moves = side.moves.map((m) => `${playerOf(report, m.sell_id).name} → ${playerOf(report, m.buy_id).name}`);
  const hits = side.hits ?? 0;
  return (
    <tr>
      <th scope="row" className="py-1 pr-2 text-left align-top font-semibold">
        {label}
        {side.origin === "replay" && (
          <span className="ml-1 rounded bg-muted px-1 py-px text-[9px] font-medium text-muted-foreground" title={report.replay.notes[0] ?? ""}>
            rebuilt
          </span>
        )}
      </th>
      <td className="py-1 pr-2 align-top">
        {moves.length ? moves.map((m) => <div key={m}>{m}</div>) : <Muted>no transfer</Muted>}
        {hits > 0 && <div className="text-[hsl(var(--fdr-4))]">−{hits * 4} hit</div>}
      </td>
      {WINDOW_KEYS.map((k) => (
        <td key={k} data-testid={`transfers-${id}-${k}`} className="py-1 pl-2 text-right align-top tabular-nums">
          {windowText(side.windows?.[k], k)}
        </td>
      ))}
    </tr>
  );
}

/** Contest 1: the app's advised move(s) on the owner's squad against what the owner did. */
export function TransfersCard({ report }: { report: MonitorReport }) {
  const t = report.transfers;
  const verdictPlayed = t.you.available ? t.you.windows?.[String(t.verdict_window) as "1" | "3" | "5"]?.played ?? 0
    : t.app.available ? t.app.windows?.[String(t.verdict_window) as "1" | "3" | "5"]?.played ?? 0 : 0;
  return (
    <MonitorCardShell title="Transfers" subtitle="real points gained by the move over 1, 3 and 5 gameweeks" testId="transfers-card">
      {t.chip_week ? (
        <p className="text-muted-foreground">Chip week: no transfer contest</p>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium" />
                <th className="text-left font-medium">Move</th>
                {WINDOW_KEYS.map((k) => (
                  <th key={k} className="pl-2 text-right font-medium">{k} GW</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SideRow label="App advised" id="app" side={t.app} report={report} />
              <SideRow label="You did" id="you" side={t.you} report={report} />
            </tbody>
          </table>
          <p className="mt-2 border-t border-border pt-2">
            <Muted>Verdict: </Muted>
            <b data-testid="transfers-verdict">{verdictLabel(t.verdict, t.verdict_window, verdictPlayed)}</b>
          </p>
        </>
      )}
    </MonitorCardShell>
  );
}
