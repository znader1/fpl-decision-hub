import type { SeasonSummary } from "@/lib/monitorView";

const signed1 = (v: number) => {
  const s = Math.abs(v).toFixed(1);
  return v < 0 ? `−${s}` : v > 0 ? `+${s}` : s;
};

function Card({ title, testId, text, note }: { title: string; testId: string; text: string; note: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-3 text-xs">
      <h4 className="mb-1 text-sm font-bold">{title}</h4>
      <p data-testid={testId} className="font-medium">
        {text}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </section>
  );
}

/** Season records: transfer verdicts, captain hits, wildcard verdicts, projection error. */
export function SeasonSideCards({ summary }: { summary: SeasonSummary }) {
  const t = summary.transfers;
  const w = summary.wildcard;
  const c = summary.captain;
  const p = summary.projection;
  return (
    <div className="grid gap-3">
      <Card
        title="Transfers"
        testId="season-transfers"
        text={`app ${t.app} · you ${t.you} · level ${t.level} · open ${t.open}`}
        note="who gained more over 3 gameweeks: the app's advised move or yours"
      />
      <Card
        title="Captain"
        testId="season-captain"
        text={c.of ? `hit ${c.hits} of ${c.of}` : "no captain data yet"}
        note="gameweeks where your captain was the best pick in your squad"
      />
      <Card
        title="Wildcard"
        testId="season-wildcard"
        text={`app ${w.app} · kept ${w.kept} · level ${w.level} · open ${w.open}`}
        note="the app's draft against the squad you kept, over 5 gameweeks"
      />
      <Card
        title="Projection error"
        testId="season-projection"
        text={
          p.n && p.meanSigned !== null && p.meanAbs !== null
            ? `mean ${signed1(p.meanSigned)}, abs ${p.meanAbs.toFixed(1)} over ${p.n} gameweek${p.n === 1 ? "" : "s"}`
            : "no finished gameweek with an app column yet"
        }
        note="app projection of its eleven minus the eleven's real points (no captain)"
      />
    </div>
  );
}
