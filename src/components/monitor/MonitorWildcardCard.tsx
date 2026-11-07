import type { MonitorReport, SquadWindow, SquadWindowAvailable } from "@/lib/monitorReport";
import { verdictLabel } from "@/lib/monitorView";
import { MonitorCardShell } from "./MonitorCardShell";
import { Muted } from "./shared";

const PRESET_LABEL: Record<string, string> = { balanced: "Balanced", aggressive: "Aggressive", gems: "Gems" };
const presetLabel = (k: string) => PRESET_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

const notes = (s: SquadWindowAvailable): string[] => {
  const out: string[] = [];
  for (const [gw, ids] of Object.entries(s.absent_by_gw ?? {})) {
    if (ids.length) out.push(`could not field ${ids.length} player${ids.length === 1 ? "" : "s"} in GW ${gw}`);
  }
  for (const gw of s.no_projection_gws ?? []) out.push(`no projection for GW ${gw}`);
  return out;
};

function SquadRow({ label, squad, bold, window }: { label: string; squad: SquadWindow; bold?: boolean; window: number }) {
  if (squad.available === false) {
    return (
      <div data-testid="wildcard-row" className="flex justify-between gap-2 py-0.5">
        <span className={bold ? "font-semibold" : undefined}>{label}</span>
        <Muted>{squad.reason}</Muted>
      </div>
    );
  }
  const extra = notes(squad);
  return (
    <div data-testid="wildcard-row" className="py-0.5">
      <div className="flex justify-between gap-2">
        <span className={bold ? "font-semibold" : undefined}>{label}</span>
        <span className="tabular-nums">
          <b>{squad.points}</b>
          <Muted>
            {" "}
            · {squad.played} of {window}
          </Muted>
        </span>
      </div>
      {extra.map((n) => (
        <p key={n} className="text-[10px] text-muted-foreground">
          {n}
        </p>
      ))}
    </div>
  );
}

/** The squad the owner kept against the app's drafts and the Scout's squad, over the wildcard window. */
export function MonitorWildcardCard({ report }: { report: MonitorReport }) {
  const w = report.wildcard;
  const headline = w.app.available ? w.app.headline_preset : null;
  const presets = w.app.available
    ? Object.entries(w.app.presets).sort(([a], [b]) => (a === headline ? -1 : b === headline ? 1 : a.localeCompare(b)))
    : [];
  const played = w.kept.available !== false ? w.kept.played : (w.actual?.played ?? 0);
  return (
    <MonitorCardShell title="Wildcard draft" subtitle={`${w.window} gameweeks from GW ${report.gw}`} testId="wildcard-card">
      <div className="divide-y divide-border">
        <SquadRow label="Kept squad" squad={w.kept} window={w.window} />
        {w.app.available === false ? (
          <div data-testid="wildcard-row" className="flex justify-between gap-2 py-0.5">
            <span>App draft</span>
            <Muted>{w.app.reason}</Muted>
          </div>
        ) : (
          presets.map(([key, squad]) => (
            <SquadRow key={key} label={`App · ${presetLabel(key)}`} squad={squad} bold={key === headline} window={w.window} />
          ))
        )}
        <SquadRow label="Scout squad" squad={w.scout} window={w.window} />
        {w.actual && (
          <div className="flex justify-between gap-2 py-0.5">
            <span>You scored</span>
            <span className="tabular-nums">
              <b>{w.actual.points}</b>
              <Muted>
                {" "}
                · {w.actual.played} of {w.window}
              </Muted>
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 border-t border-border pt-2">
        <Muted>Verdict: </Muted>
        <b data-testid="wildcard-verdict">{verdictLabel(w.verdict, w.window, played)}</b>
      </p>
    </MonitorCardShell>
  );
}
