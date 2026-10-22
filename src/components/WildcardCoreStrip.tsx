import type { FplTeamRecommendationPlayer } from "@/lib/fplAssistantApi";

interface Props {
  coreIds: number[];
  /** Any squad that carries the core players (names come from here). */
  players: FplTeamRecommendationPlayer[];
}

/** Players every preset starts: the high-conviction read across the three squads. */
export function WildcardCoreStrip({ coreIds, players }: Props) {
  const byId = new Map(players.map((p) => [p.player_id, p]));
  const core = coreIds.map((id) => byId.get(id)).filter((p): p is FplTeamRecommendationPlayer => Boolean(p));
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Core · in all three squads ({coreIds.length})
      </p>
      {core.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">No player starts in all three. The presets disagree; pick the structure you believe in.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {core.map((p) => (
            <span key={p.player_id} className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
              {p.web_name} <span className="text-[11px] text-muted-foreground">{p.team_short} · {p.pos}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
