// Owner-only monitor: the app's best eleven, The Scout's eleven and the owner's
// team on three coloured pitches with real points, the transfer / captain /
// wildcard / buy-list contests, and a season tab. Reads finished reports from
// Supabase `monitor_reports` under RLS; the database is the gate, this page
// only decides what to render. Spec: FPL repo
// docs/superpowers/specs/2026-11-05-monitoring-dashboard-design.md.
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotFound from "./NotFound";
import { MonitorGwBar } from "@/components/monitor/MonitorGwBar";
import { MonitorPitch } from "@/components/monitor/MonitorPitch";
import { BestXiStrip } from "@/components/monitor/BestXiStrip";
import { TransfersCard } from "@/components/monitor/TransfersCard";
import { BuyListsCard } from "@/components/monitor/BuyListsCard";
import { MonitorCaptainCard } from "@/components/monitor/MonitorCaptainCard";
import { MonitorWildcardCard } from "@/components/monitor/MonitorWildcardCard";
import { SeasonTable } from "@/components/monitor/SeasonTable";
import { SeasonSideCards } from "@/components/monitor/SeasonSideCards";
import { useMonitorOwner } from "@/hooks/useMonitorOwner";
import { supabaseMonitorRemote, type MonitorRemote, type SeasonRow } from "@/lib/monitorRemote";
import type { MonitorReport } from "@/lib/monitorReport";
import { bestStrip, pitchModel, resolveSelection, seasonRows, seasonSummary, type Tone } from "@/lib/monitorView";

const TONES: Tone[] = ["app", "scout", "you"];
type Tab = "gameweek" | "season";

const intParam = (v: string | null): number | null => {
  if (v === null) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

function Spinner() {
  return (
    <div data-testid="monitor-loading" className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function GameweekView({ report }: { report: MonitorReport }) {
  const models = TONES.map((t) => pitchModel(report, t));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {models.map((m) => (
          <MonitorPitch key={m.tone} model={m} />
        ))}
      </div>
      <BestXiStrip strip={bestStrip(report)} />
      <div className="grid gap-3 md:grid-cols-2">
        <TransfersCard report={report} />
        <MonitorCaptainCard report={report} />
        <MonitorWildcardCard report={report} />
        <BuyListsCard report={report} />
      </div>
      <details className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">How this was rebuilt</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {report.replay.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li>
            parity with the stored projections: {report.replay.parity.status}
            {report.replay.parity.n > 0 && ` (n ${report.replay.parity.n}, mae ${report.replay.parity.mae ?? "—"})`}
          </li>
          {report.replay.dropped_squad_ids.length > 0 && (
            <li>players dropped from the rebuild: {report.replay.dropped_squad_ids.join(", ")}</li>
          )}
        </ul>
      </details>
    </div>
  );
}

export default function Monitor({ remote = supabaseMonitorRemote }: { remote?: MonitorRemote }) {
  const owner = useMonitorOwner(remote);
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "season" ? "season" : "gameweek";

  const season = useQuery({
    queryKey: ["monitor-season"],
    queryFn: () => remote.listSeason(),
    enabled: owner.owner === true,
    staleTime: 5 * 60 * 1000,
  });
  const rows = useMemo(() => season.data ?? [], [season.data]);
  const sel = useMemo(() => resolveSelection(rows, intParam(params.get("entry")), intParam(params.get("gw"))), [rows, params]);

  const report = useQuery({
    queryKey: ["monitor-report", sel.season, sel.entryId, sel.gw],
    queryFn: () => remote.loadReport(sel.season as string, sel.entryId as number, sel.gw as number),
    enabled: owner.owner === true && sel.season !== null && sel.entryId !== null && sel.gw !== null,
    staleTime: 5 * 60 * 1000,
  });

  const go = useCallback(
    (next: { entry?: number; gw?: number; tab?: Tab }) => {
      const p = new URLSearchParams(params);
      if (next.entry !== undefined) p.set("entry", String(next.entry));
      if (next.gw !== undefined) p.set("gw", String(next.gw));
      if (next.tab !== undefined) p.set("tab", next.tab);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  if (owner.owner === false) return <NotFound />;

  const gwIndex = sel.gw === null ? -1 : sel.gws.indexOf(sel.gw);
  const seasonModels = sel.entryId === null || sel.season === null ? [] : seasonRows(rows, sel.entryId, sel.season);

  let body: JSX.Element;
  if (owner.owner === null) {
    body = owner.error ? (
      <QueryErrorCard title="Couldn't check access" message={String((owner.error as Error)?.message ?? owner.error)} onRetry={owner.refetch} />
    ) : (
      <Spinner />
    );
  } else if (season.isPending) {
    body = <Spinner />;
  } else if (season.error) {
    body = <QueryErrorCard title="Couldn't load the season" message={String((season.error as Error)?.message ?? season.error)} onRetry={() => void season.refetch()} />;
  } else if (rows.length === 0 || sel.entryId === null || sel.gw === null) {
    body = <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No reports yet. Run the backfill job.</p>;
  } else {
    body = (
      <Tabs value={tab} onValueChange={(v) => go({ tab: v === "season" ? "season" : "gameweek" })}>
        <TabsList className="mb-3">
          <TabsTrigger value="gameweek">Gameweek</TabsTrigger>
          <TabsTrigger value="season">Season</TabsTrigger>
        </TabsList>
        <TabsContent value="gameweek" className="space-y-3">
          <MonitorGwBar
            gw={sel.gw}
            entries={sel.entries}
            entryId={sel.entryId}
            onEntry={(entry) => go({ entry })}
            onPrev={() => gwIndex > 0 && go({ gw: sel.gws[gwIndex - 1] })}
            onNext={() => gwIndex >= 0 && gwIndex < sel.gws.length - 1 && go({ gw: sel.gws[gwIndex + 1] })}
            hasPrev={gwIndex > 0}
            hasNext={gwIndex >= 0 && gwIndex < sel.gws.length - 1}
            state={report.data?.state ?? rows.find((r) => r.entry_id === sel.entryId && r.gw === sel.gw)?.state ?? "finished"}
            headline={report.data?.headline ?? rows.find((r) => r.entry_id === sel.entryId && r.gw === sel.gw)?.headline ?? { app: null, scout: null, you: null, best: null, basis: "no_captain" }}
            scoutPartial={!!(report.data?.scout_xi.available && report.data.scout_xi.partial)}
          />
          {report.isPending ? (
            <Spinner />
          ) : report.error ? (
            <QueryErrorCard title="Couldn't load the report" message={String((report.error as Error)?.message ?? report.error)} onRetry={() => void report.refetch()} />
          ) : report.data ? (
            <GameweekView report={report.data} />
          ) : (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No report for GW {sel.gw}</p>
          )}
        </TabsContent>
        <TabsContent value="season">
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <SeasonTable rows={seasonModels} onOpenGw={(gw) => go({ gw, tab: "gameweek" })} />
            <SeasonSideCards summary={seasonSummary(seasonModels)} />
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-20 sm:px-6">
        <h1 className="mb-3 text-xl font-bold">Monitor</h1>
        {body}
      </main>
    </div>
  );
}
