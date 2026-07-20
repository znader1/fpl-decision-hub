import { useEffect, useState } from "react";
import { fetchReplayGw, type ReplayGwRecord } from "@/lib/replayApi";

const SEASON = "2025-26";
const ENTRY_ID = Number(import.meta.env.VITE_REPLAY_ENTRY_ID ?? 588004);

export default function Replay() {
  const [gw, setGw] = useState(7);
  const [rec, setRec] = useState<ReplayGwRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setErr(null);
    setRec(null);
    fetchReplayGw(SEASON, gw, ENTRY_ID, ctrl.signal)
      .then((r) => { if (!ctrl.signal.aborted) setRec(r); })
      .catch((e) => { if (!ctrl.signal.aborted) setErr(String(e)); });
    return () => ctrl.abort();
  }, [gw]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Replay — {SEASON}</h1>
        <label className="flex items-center gap-2">
          GW <input type="range" min={1} max={38} value={gw}
            onChange={(e) => setGw(Number(e.target.value))} />
          <span className="tabular-nums w-8">{gw}</span>
        </label>
      </header>

      {err && <p className="text-red-500">{err}</p>}
      {rec?.setup_gw && <p className="text-muted-foreground">GW{gw} is the setup GW — no model projection.</p>}
      {rec && !rec.setup_gw && (
        <div className="grid gap-6 md:grid-cols-2">
          <section data-testid="panel-players">
            <h2 className="font-medium mb-2">Model xPts vs actual</h2>
            <table className="w-full text-sm"><tbody>
              {rec.players.map((p) => (
                <tr key={p.element}>
                  <td>#{p.element}</td>
                  <td className="text-right tabular-nums">{p.model_xpts.toFixed(1)}</td>
                  <td className="text-right tabular-nums font-medium">{p.actual_points}</td>
                </tr>
              ))}
            </tbody></table>
          </section>

          <section data-testid="panel-captain">
            <h2 className="font-medium mb-2">Captain</h2>
            <p>Model: #{rec.model_captain ?? "—"}</p>
            <p>You: #{rec.your?.captain ?? "—"}</p>
            <p>Optimal: #{rec.optimal_captain ?? "—"}</p>
          </section>

          <section data-testid="panel-transfer">
            <h2 className="font-medium mb-2">Suggested transfer</h2>
            {rec.suggested_transfer
              ? <p>Sell #{rec.suggested_transfer.sell} → Buy #{rec.suggested_transfer.buy} (+{rec.suggested_transfer.expected_gain})</p>
              : <p className="text-muted-foreground">No transfer suggested.</p>}
          </section>

          <section data-testid="panel-sp2">
            <h2 className="font-medium mb-2">SP2 differential EV <span className="text-xs text-muted-foreground">(global ownership)</span></h2>
            <table className="w-full text-sm"><tbody>
              {rec.sp2_candidates.map((c) => (
                <tr key={c.element}>
                  <td>#{c.element}</td>
                  <td className="text-right tabular-nums">{c.differential_ev.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{(c.global_ownership * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody></table>
          </section>
        </div>
      )}
    </div>
  );
}
