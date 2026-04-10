import { JerseyIcon } from "./JerseyIcon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { FplPlayerAlert, FplPlayerScoreBreakdown } from "@/lib/fplAssistantApi";

export interface PlayerFixture {
  label?: string;
  opponent?: string;
  isHome?: boolean;
  difficulty?: number;
  extraCount?: number;
}

export interface Player {
  id: number;
  name: string;
  team: string;
  teamName?: string;
  price?: number;
  points: number;
  number?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  fixture?: PlayerFixture;
  alerts?: FplPlayerAlert[];
  scoreBreakdown?: FplPlayerScoreBreakdown;
}

interface PlayerCardProps {
  player: Player;
}

const formatPoints = (points: number) => {
  if (!Number.isFinite(points)) return "—";
  if (Number.isInteger(points)) return points.toString();
  return points.toFixed(2).replace(/\.?0+$/, "");
};

const getDifficultyClass = (difficulty?: number) => {
  switch (difficulty) {
    case 1:
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case 2:
      return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case 3:
      return "bg-amber-500/15 text-amber-900 dark:text-amber-200";
    case 4:
      return "bg-rose-500/15 text-rose-900 dark:text-rose-200";
    case 5:
      return "bg-rose-500/25 text-rose-900 dark:text-rose-200";
    default:
      return "bg-muted/60 text-muted-foreground";
  }
};

const formatMetric = (value?: number | null, digits = 1) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toFixed(digits).replace(/\.?0+$/, "");
};

const getAlertTone = (severity?: string) => {
  switch (severity) {
    case "high":
      return "bg-rose-500/15 text-rose-700";
    case "medium":
      return "bg-amber-500/15 text-amber-700";
    case "info":
      return "bg-sky-500/15 text-sky-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getObjectiveLabel = (objectiveScoreCol?: string | null) => {
  if (objectiveScoreCol === "wildcard_score") return "Wildcard draft score";
  if (objectiveScoreCol) return objectiveScoreCol.replaceAll("_", " ");
  return "Lineup score";
};

export const PlayerCard = ({ player }: PlayerCardProps) => {
  const fixture = player.fixture;
  const alerts = Array.isArray(player.alerts) ? player.alerts.filter((item) => item.text) : [];
  const breakdown = player.scoreBreakdown;
  const wildcard = breakdown?.wildcard;
  const objectiveScore = wildcard?.score ?? breakdown?.objective_score ?? breakdown?.horizon_xpts;
  const weightedFutureXpts = wildcard?.weighted_xpts ?? breakdown?.horizon_xpts;
  const dgwBonus = wildcard?.future_dgw_bonus ?? 0;
  const captaincyBonus = wildcard?.captaincy_bonus ?? 0;
  const fixtureDifficulty =
    fixture && typeof fixture.difficulty === "number" && Number.isFinite(fixture.difficulty)
      ? fixture.difficulty
      : undefined;
  const fixtureMeta =
    fixture && typeof fixture.extraCount === "number" && fixture.extraCount > 0
      ? `+${fixture.extraCount}`
      : "";

  const fixtureShort = fixture
    ? fixture.label ??
      `${fixture.isHome === false ? "A-" : fixture.isHome === true ? "H-" : ""}${fixture.opponent ?? ""}${
        fixtureDifficulty ? `(D${fixtureDifficulty})` : ""
      }`
    : undefined;

  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className="relative transition-transform group-hover:scale-110">
            <JerseyIcon
              team={player.team}
              number={player.number}
              size="md"
              isCaptain={player.isCaptain}
            />
            {player.isViceCaptain && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted-foreground flex items-center justify-center text-[8px] font-bold text-background border border-background">
                V
              </div>
            )}
            {alerts.length > 0 && (
              <div className="absolute -bottom-1 -right-1 min-w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center border border-background px-1">
                {alerts.length}
              </div>
            )}
          </div>
          <div className="bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 text-center shadow-sm border border-border min-w-[80px]">
            <p className="text-xs font-bold text-foreground truncate">{player.name}</p>
            <div className="flex justify-center gap-2 text-[10px]">
              {fixtureShort ? (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium max-w-[92px] truncate ${getDifficultyClass(
                    fixtureDifficulty,
                  )}`}
                  title={fixtureDifficulty ? `FDR ${fixtureDifficulty}` : undefined}
                >
                  {fixtureShort}
                  {fixtureMeta ? ` ${fixtureMeta}` : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">{player.team}</span>
              )}
              <span className="font-semibold text-primary">{formatPoints(player.points)}</span>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 space-y-3" align="center" sideOffset={10}>
        <div>
          <p className="text-sm font-semibold text-foreground">{player.name}</p>
          <p className="text-xs text-muted-foreground">{player.teamName ?? player.team}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-muted-foreground">Selected GW xPts</p>
            <p className="font-semibold text-foreground">{formatMetric(breakdown?.current_gw_xpts)}</p>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-muted-foreground">Horizon xPts</p>
            <p className="font-semibold text-foreground">{formatMetric(breakdown?.horizon_xpts)}</p>
          </div>
          <div className="col-span-2 rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-muted-foreground">{getObjectiveLabel(breakdown?.objective_score_col)}</p>
            <p className="font-semibold text-foreground">
              {formatMetric(objectiveScore, 2)}
            </p>
          </div>
        </div>

        {breakdown?.objective_explanation && (
          <p className="text-xs text-muted-foreground">{breakdown.objective_explanation}</p>
        )}

        {(breakdown?.objective_score_col === "wildcard_score" || breakdown?.wildcard) && (
          <div className="space-y-1 rounded-md border border-border bg-card px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wildcard Score</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>Score: <span className="font-semibold text-foreground">{formatMetric(objectiveScore, 2)}</span></p>
              <p>Weighted xPts: <span className="font-semibold text-foreground">{formatMetric(weightedFutureXpts, 2)}</span></p>
              <p>DGW bonus: <span className="font-semibold text-foreground">{formatMetric(dgwBonus, 2)}</span></p>
              <p>Captaincy: <span className="font-semibold text-foreground">{formatMetric(captaincyBonus, 2)}</span></p>
            </div>
            <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
              <p>Base score comes from future projected xPts across the wildcard window.</p>
              <p>DGW bonus only appears when a later gameweek has more than one fixture.</p>
              <p>Captaincy bonus mainly rewards premium MID/FWD options, so many defenders or cheaper mids stay at 0.</p>
            </div>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flags</p>
            <div className="space-y-1">
              {alerts.slice(0, 3).map((alert, index) => (
                <div
                  key={`${alert.category ?? "flag"}-${index}`}
                  className={`rounded-md px-2 py-1.5 text-xs ${getAlertTone(alert.severity)}`}
                >
                  {alert.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(breakdown?.fixtures_horizon) && breakdown.fixtures_horizon.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Window</p>
            <div className="space-y-1">
              {breakdown.fixtures_horizon.slice(0, 3).map((item) => (
                <div key={`gw-${item.event_id}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-2 text-xs">
                  <span className="text-muted-foreground">GW {item.event_id}</span>
                  <span className="font-medium text-foreground">{item.fixtures || "—"}</span>
                  <span className="text-primary font-semibold">
                    {formatMetric(item.xpts, 1)}
                    {typeof item.fixture_count === "number" && item.fixture_count > 1 ? ` · x${item.fixture_count}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {breakdown?.note && (
          <p className="text-[11px] text-muted-foreground">{breakdown.note}</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};
