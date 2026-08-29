import { useMemo, useState } from "react";
import {
  Lightbulb,
  ArrowRightLeft,
  Star,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransferPlanner } from "./TransferPlanner";
import { JerseyIcon } from "./JerseyIcon";
import { ExplanationPanel } from "./ExplanationPanel";
import { AiAdvisorPanel } from "./AiAdvisorPanel";
import type { FplSquad, FplTeamRecommendation, FplTransferPlanHorizon } from "@/lib/fplAssistantApi";

interface RecommendationsPanelProps {
  squad?: FplSquad;
  recommendation?: FplTeamRecommendation;
  isRecommending?: boolean;
  horizonGws?: number;
  appliedTransferCount?: number;
  canApplyNextTransfer?: boolean;
  isApplyingTransfer?: boolean;
  onApplyNextTransfer?: () => void;
  onResetAppliedTransfers?: () => void;
  onApplyTransferAtIndex?: (index: number) => void;
  entryId?: number;
  currentGw?: number;
  chipsRemaining?: string[];
}

type Tab = "summary" | "transfers" | "watchlist";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const findPlayer = (team: FplSquad, id: number) =>
  team.starting_xi.find((p) => p.player_id === id) ??
  team.bench.find((p) => p.player_id === id);

const findName = (rec: FplTeamRecommendation, id: number) =>
  findPlayer(rec, id)?.web_name ?? String(id);

const fmt1 = (v?: number) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return (Math.round(v * 10) / 10).toString();
};

const fmtDelta = (v?: number) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const rounded = Math.round(v * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
};

const getSuggestedCaptain = (rec: FplTeamRecommendation) => {
  const all = [...rec.starting_xi, ...rec.bench];
  return all.find((p) => p.is_captain_suggested) ?? findPlayer(rec, rec.captain_player_id);
};

const chipLabel = (v?: string | null) => {
  if (!v || v === "none") return null;
  if (v === "free_hit") return "Free Hit";
  if (v === "wildcard") return "Wildcard";
  return v;
};

/* ── sub-components ───────────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">{text}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-0.5 ${accent ? "border-primary/30 bg-primary/[0.08]" : "border-border bg-card"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-black leading-none ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Summary tab ──────────────────────────────────────────────────────────── */
function SummaryTab({
  recommendation,
  squad,
  horizonGws,
  isRecommending,
  entryId,
  currentGw,
  chipsRemaining,
}: {
  recommendation?: FplTeamRecommendation;
  squad?: FplSquad;
  horizonGws?: number;
  isRecommending: boolean;
  entryId?: number;
  currentGw?: number;
  chipsRemaining?: string[];
}) {
  if (isRecommending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recommendation) {
    return (
      <EmptyState
        icon={Sparkles}
        text="Run a recommendation to see projected points, captain pick, and formation."
      />
    );
  }

  const captain = getSuggestedCaptain(recommendation);
  const captainName = captain?.web_name ?? findName(recommendation, recommendation.captain_player_id);
  const viceName = findName(recommendation, recommendation.vice_player_id);
  const chip = chipLabel(recommendation.chip_strategy?.selected);
  const delta = fmtDelta(recommendation.transfer_impact?.delta_projected_points_with_captain);
  const withTransfers = fmt1(recommendation.transfer_impact?.with_transfers_projected_points_with_captain);

  return (
    <div className="flex flex-col gap-3">
      {/* Projected xPts hero */}
      <div className="rounded-xl border border-primary/30 bg-primary/[0.08] p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-0.5">Projected xPts</p>
          <p className="text-4xl font-black text-primary leading-none">
            {fmt1(recommendation.projected_points_with_captain)}
          </p>
          {delta && (
            <p className="text-xs text-muted-foreground mt-1">
              With transfers: <span className="text-foreground font-semibold">{withTransfers}</span>
              <span className={`ml-1 font-bold ${delta.startsWith("+") ? "text-accent" : "text-destructive"}`}>
                ({delta})
              </span>
            </p>
          )}
        </div>
        <TrendingUp className="h-8 w-8 text-primary/30" />
      </div>

      {/* Captain + Vice */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
          <div className="relative shrink-0">
            <JerseyIcon team={captain?.team_short ?? ""} size="sm" isCaptain />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Captain</p>
            <p className="text-sm font-bold text-foreground truncate">{captainName}</p>
            <p className="text-[11px] text-primary">{fmt1(captain?.xpts)} xPts</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
          <JerseyIcon team={recommendation.starting_xi.find(p => p.player_id === recommendation.vice_player_id)?.team_short ?? ""} size="sm" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vice</p>
            <p className="text-sm font-bold text-foreground truncate">{viceName}</p>
          </div>
        </div>
      </div>

      {/* Formation + Chip + Horizon */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Formation" value={recommendation.formation.join("-")} />
        <StatCard
          label="Horizon"
          value={`${horizonGws ?? recommendation.horizon_gws}GW`}
        />
        {chip ? (
          <div className="rounded-xl border border-accent/30 bg-accent/[0.08] p-3 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent/70">Chip</p>
            <p className="text-sm font-black text-accent leading-tight">{chip}</p>
          </div>
        ) : (
          <StatCard label="Chip" value="None" />
        )}
      </div>

      {/* Budget ITB */}
      {typeof recommendation.chip_strategy?.remaining_budget_m === "number" && (
        <StatCard
          label="In the Bank"
          value={`£${fmt1(recommendation.chip_strategy.remaining_budget_m)}m`}
        />
      )}

      {/* Chip explanation */}
      {recommendation.chip_strategy?.explanation && (
        <div className="rounded-xl border border-border bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
          {recommendation.chip_strategy.explanation}
        </div>
      )}

      {/* AI Advisor */}
      <AiAdvisorPanel
        entryId={entryId}
        currentGw={currentGw}
        chipsRemaining={chipsRemaining}
      />
    </div>
  );
}

/* ── Transfers tab ────────────────────────────────────────────────────────── */
function TransfersTab({
  recommendation,
  squad,
  isRecommending,
  appliedTransferCount,
  canApplyNextTransfer,
  isApplyingTransfer,
  onApplyNextTransfer,
  onResetAppliedTransfers,
  onApplyTransferAtIndex,
}: {
  recommendation?: FplTeamRecommendation;
  squad?: FplSquad;
  isRecommending: boolean;
  appliedTransferCount: number;
  canApplyNextTransfer: boolean;
  isApplyingTransfer: boolean;
  onApplyNextTransfer?: () => void;
  onResetAppliedTransfers?: () => void;
  onApplyTransferAtIndex?: (index: number) => void;
}) {
  const playerNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of squad?.starting_xi ?? []) map[p.player_id] = p.web_name;
    for (const p of squad?.bench ?? []) map[p.player_id] = p.web_name;
    for (const p of recommendation?.starting_xi ?? []) map[p.player_id] = p.web_name;
    for (const p of recommendation?.bench ?? []) map[p.player_id] = p.web_name;
    return map;
  }, [squad, recommendation]);

  const playerTeamById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of squad?.starting_xi ?? []) map[p.player_id] = p.team_short;
    for (const p of squad?.bench ?? []) map[p.player_id] = p.team_short;
    for (const p of recommendation?.starting_xi ?? []) map[p.player_id] = p.team_short;
    for (const p of recommendation?.bench ?? []) map[p.player_id] = p.team_short;
    return map;
  }, [squad, recommendation]);

  if (isRecommending) {
    return <EmptyState icon={ArrowRightLeft} text="Computing transfer suggestions…" />;
  }

  if (!recommendation) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        text="Run a recommendation to see suggested transfers and their point impact."
      />
    );
  }

  return (
    <div className="space-y-4">
      <TransferPlanner
        transfers={recommendation.transfers}
        isLoading={isRecommending}
        targetGw={recommendation.event_id}
        playerNameById={playerNameById}
        playerTeamById={playerTeamById}
        appliedTransferCount={appliedTransferCount}
        canApplyNextTransfer={canApplyNextTransfer}
        isApplyingTransfer={isApplyingTransfer}
        onApplyNextTransfer={onApplyNextTransfer}
        onResetAppliedTransfers={onResetAppliedTransfers}
        onApplyTransferAtIndex={onApplyTransferAtIndex}
        planSlot={<HorizonTransferPlan plan={recommendation.transfer_plan_horizon} />}
      />
    </div>
  );
}

/* ── Verdict banner (additive) ───────────────────────────────────────────── */
const VERDICT_LABEL: Record<NonNullable<FplTransferPlanHorizon["verdict"]>, string> = {
  roll: "Roll it",
  spend: "Make the move",
  spend_forced_injury: "Injury: act now",
};

const VERDICT_TONE: Record<NonNullable<FplTransferPlanHorizon["verdict"]>, string> = {
  roll: "border-border bg-muted/10 text-muted-foreground",
  spend: "border-emerald-600/30 bg-emerald-600/[0.08] text-emerald-700",
  spend_forced_injury: "border-destructive/30 bg-destructive/[0.08] text-destructive",
};

function VerdictBanner({ plan }: { plan: FplTransferPlanHorizon }) {
  if (!plan.verdict) return null;
  const showFt =
    typeof plan.first_gw_ft_before === "number" && typeof plan.first_gw_ft_after === "number";
  return (
    <div
      data-testid="plan-verdict-banner"
      className={`rounded-lg border p-3 flex flex-col gap-1 ${VERDICT_TONE[plan.verdict]}`}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
          {VERDICT_LABEL[plan.verdict]}
        </Badge>
        {showFt && (
          <span className="ml-auto text-xs text-muted-foreground">
            FT {plan.first_gw_ft_before}→{plan.first_gw_ft_after}
          </span>
        )}
      </div>
      {plan.reasoning && <p className="text-xs leading-relaxed">{plan.reasoning}</p>}
    </div>
  );
}

/* ── Multi-GW roll/bank plan (additive) ───────────────────────────────────── */
export function HorizonTransferPlan({ plan }: { plan?: FplTransferPlanHorizon }) {
  const verdictBanner = plan?.verdict ? <VerdictBanner plan={plan} /> : null;
  if (!plan?.plan?.length) return verdictBanner;
  const allRoll = plan.plan.every((g) => g.action === "roll");
  return (
    <>
      {verdictBanner}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Multi-GW plan (1 FT/GW, roll or bank)</span>
          {typeof plan.total_net_gain === "number" && (
            <span className="ml-auto text-xs">
              Net over {plan.horizon_gws} GWs{" "}
              <b className={plan.total_net_gain >= 0 ? "text-emerald-600" : "text-red-600"}>
                {plan.total_net_gain >= 0 ? "+" : ""}{plan.total_net_gain.toFixed(1)} pts
              </b>
            </span>
          )}
        </div>
        {allRoll && (
          <div className="text-[11px] text-muted-foreground">
            No transfer clears the bar over this horizon — roll and bank the free transfers.
          </div>
        )}
        {plan.plan.map((g) => (
          <div key={g.gw} className="border-t pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold w-12">GW{g.gw}</span>
              <span className={`px-1.5 rounded text-[10px] ${g.action === "roll"
                ? "bg-muted text-muted-foreground"
                : g.hits > 0 ? "bg-orange-600/80 text-white" : "bg-emerald-600/80 text-white"}`}>
                {g.action === "roll" ? "roll" : g.hits > 0 ? `transfer +${g.hits} hit` : "transfer"}
              </span>
              <span className="text-muted-foreground">FT {g.free_transfers_before}→{g.free_transfers_after}</span>
              {g.action === "transfer" && (
                <span className={`ml-auto ${g.net_gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  net {g.net_gain >= 0 ? "+" : ""}{g.net_gain.toFixed(1)}
                  {g.hits > 0 && <span className="text-muted-foreground"> (−{g.hit_cost} hit)</span>}
                </span>
              )}
            </div>
            {g.action === "roll" ? (
              <div className="text-[11px] text-muted-foreground mt-1">{g.note}</div>
            ) : (
              <ul className="text-[11px] mt-1 space-y-0.5">
                {g.moves.map((m, i) => (
                  <li key={i} className="flex gap-1 flex-wrap">
                    <span className="text-red-600">{m.sell.name}</span>
                    <span className="text-muted-foreground">({m.sell.team} £{m.sell.price})</span>
                    <span>→</span>
                    <span className="text-emerald-700 font-medium">{m.buy.name}</span>
                    <span className="text-muted-foreground">({m.buy.team} £{m.buy.price})</span>
                    <span className="ml-auto text-emerald-600">+{m.score_gain.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Watchlist tab ────────────────────────────────────────────────────────── */
function WatchlistTab({
  recommendation,
  squad,
  isRecommending,
}: {
  recommendation?: FplTeamRecommendation;
  squad?: FplSquad;
  isRecommending: boolean;
}) {
  if (isRecommending) {
    return <EmptyState icon={ShieldAlert} text="Analysing your squad…" />;
  }

  if (!recommendation) {
    return (
      <EmptyState
        icon={ShieldAlert}
        text="Run a recommendation to see injury flags, DGW alerts, and captain tips."
      />
    );
  }

  const insights = recommendation.squad_insights?.summary_points ?? [];
  const scoringBullets = recommendation.scoring_guide?.bullets ?? [];
  const scoringHeadline = recommendation.scoring_guide?.headline;

  // Captain tip
  const captain = getSuggestedCaptain(recommendation);
  const currentCaptain = squad?.starting_xi.find((p) => p.is_captain) ??
    (squad ? findPlayer(squad, squad.captain_player_id) : undefined);
  const captainSwitchNeeded = captain && currentCaptain && captain.player_id !== currentCaptain.player_id;

  // First bench player
  const bench1 = [...(recommendation.bench)].sort((a, b) => a.bench_order - b.bench_order)
    .find((p) => p.pos !== "GKP");

  return (
    <div className="flex flex-col gap-4">
      {/* Quick tips */}
      {(captain || bench1) && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</p>

          {captain && (
            <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {captainSwitchNeeded ? `Switch captain → ${captain.web_name}` : `Captain: ${captain.web_name}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {captainSwitchNeeded && currentCaptain ? `from ${currentCaptain.web_name} · ` : ""}
                  {fmt1(captain.xpts)} xPts
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">C</Badge>
            </div>
          )}

          {bench1 && (
            <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">1st sub: {bench1.web_name}</p>
                <p className="text-[11px] text-muted-foreground">{bench1.team_short} · {fmt1(bench1.xpts)} xPts</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Squad insights */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Flags & Alerts</p>
          {insights.map((item, i) => {
            const tone =
              item.severity === "high"
                ? "border-destructive/30 bg-destructive/[0.08] text-destructive"
                : item.severity === "medium"
                ? "border-amber-500/30 bg-amber-500/8 text-amber-400"
                : "border-border bg-muted/10 text-muted-foreground";
            return (
              <div
                key={i}
                className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${tone}`}
              >
                {item.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring guide */}
      {(scoringHeadline || scoringBullets.length > 0) && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">How Scoring Works</p>
          <div className="rounded-xl border border-accent/20 bg-accent/[0.06] p-3 flex flex-col gap-1.5">
            {scoringHeadline && (
              <p className="text-xs font-semibold text-foreground">{scoringHeadline}</p>
            )}
            {scoringBullets.map((b, i) => (
              <p key={i} className="text-[11px] text-muted-foreground">• {b}</p>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && !captain && !bench1 && scoringBullets.length === 0 && (
        <EmptyState icon={Lightbulb} text="No flags or insights for this gameweek." />
      )}
    </div>
  );
}

/* ── Main panel ───────────────────────────────────────────────────────────── */
export const RecommendationsPanel = ({
  squad,
  recommendation,
  isRecommending = false,
  horizonGws,
  appliedTransferCount = 0,
  canApplyNextTransfer = false,
  isApplyingTransfer = false,
  onApplyNextTransfer,
  onResetAppliedTransfers,
  onApplyTransferAtIndex,
  entryId,
  currentGw,
  chipsRemaining,
}: RecommendationsPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "summary", label: "Summary", icon: TrendingUp },
    { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
    { id: "watchlist", label: "Watchlist", icon: ShieldAlert },
  ];

  const moveCount = recommendation?.transfers?.moves?.length ?? 0;

  // With nothing to show, this panel reserved 440px on a 1512px screen to
  // display one sentence of placeholder text — squeezing the pitch for no
  // return. Narrow it until it has real content; the tab bar stays so the
  // panel doesn't vanish and reappear.
  const hasContent = Boolean(recommendation) || Boolean(isRecommending);

  return (
    <aside
      className={`w-full shrink-0 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col transition-[width] duration-200 ${
        hasContent ? "lg:w-[380px] xl:w-[440px]" : "lg:w-[248px] xl:w-[280px]"
      }`}
    >
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-colors relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "transfers" && moveCount > 0 && (
                <span className="absolute top-2 right-[18%] h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                  {moveCount}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "summary" && (
          <SummaryTab
            recommendation={recommendation}
            squad={squad}
            horizonGws={horizonGws}
            isRecommending={isRecommending}
            entryId={entryId}
            currentGw={currentGw}
            chipsRemaining={chipsRemaining}
          />
        )}
        {activeTab === "transfers" && (
          <TransfersTab
            recommendation={recommendation}
            squad={squad}
            isRecommending={isRecommending}
            appliedTransferCount={appliedTransferCount}
            canApplyNextTransfer={canApplyNextTransfer}
            isApplyingTransfer={isApplyingTransfer}
            onApplyNextTransfer={onApplyNextTransfer}
            onResetAppliedTransfers={onResetAppliedTransfers}
            onApplyTransferAtIndex={onApplyTransferAtIndex}
          />
        )}
        {activeTab === "watchlist" && (
          <WatchlistTab
            recommendation={recommendation}
            squad={squad}
            isRecommending={isRecommending}
          />
        )}
        <ExplanationPanel recommendation={recommendation} />
      </div>
    </aside>
  );
};
