import type { ReactNode } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JerseyIcon } from "./JerseyIcon";
import { Badge } from "@/components/ui/badge";
import type { FplPosition, FplTransfersRecommendation } from "@/lib/fplAssistantApi";
import { fmtGain } from "./DecisionCard";

interface TransferPlannerProps {
  transfers?: FplTransfersRecommendation;
  planSlot?: ReactNode;
  isLoading?: boolean;
  targetGw?: number;
  playerNameById?: Record<number, string>;
  playerTeamById?: Record<number, string>;
}

const POSITION_ORDER: FplPosition[] = ["GKP", "DEF", "MID", "FWD"];

const formatMoney = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(1).replace(/\.0$/, "");
  return `£${fixed}m`;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const formatPoints = (value?: number, withSign = false) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const rounded = round1(value);
  if (withSign) return `${rounded >= 0 ? "+" : ""}${rounded}`;
  return String(rounded);
};

const isLikelyTeamCode = (value: string) => /^[A-Z]{2,4}$/.test(value.trim());

const readFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const readPlayerName = (player: unknown, fallbackId?: unknown, playerNameById?: Record<number, string>) => {
  const row = player && typeof player === "object" ? (player as Record<string, unknown>) : undefined;
  const idNum = readFiniteNumber(fallbackId ?? row?.id ?? row?.player_id);
  const lookupName = typeof idNum === "number" ? playerNameById?.[idNum]?.trim() : undefined;
  if (lookupName && lookupName.length > 0) return lookupName;

  if (row) {
    const team = typeof row.team === "string" ? row.team.trim().toUpperCase() : "";
    const teamShort = typeof row.team_short === "string" ? row.team_short.trim().toUpperCase() : "";
    const candidates = [row.name, row.web_name, row.player_name, row.full_name, row.display_name, row.second_name]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    for (const name of candidates) {
      const upper = name.toUpperCase();
      const badToken = name === "." || name === "·" || name === "-" || name === "—";
      const isTeamAlias = upper === team || upper === teamShort;
      if (badToken) continue;
      if (isTeamAlias) continue;
      if (isLikelyTeamCode(name)) continue;
      return name;
    }
  }
  if (typeof idNum === "number") return `Player ${idNum}`;
  return "Unknown player";
};

const readTeamShort = (player: unknown, fallbackId?: unknown, playerTeamById?: Record<number, string>) => {
  const row = player && typeof player === "object" ? (player as Record<string, unknown>) : undefined;
  const idNum = readFiniteNumber(fallbackId ?? row?.id ?? row?.player_id);
  const lookupTeam = typeof idNum === "number" ? playerTeamById?.[idNum]?.trim() : undefined;
  if (lookupTeam && lookupTeam.length > 0) return lookupTeam;

  if (row) {
    const direct = typeof row.team === "string" ? row.team.trim() : "";
    if (direct.length > 0) return direct;
    const shortTeam = typeof row.team_short === "string" ? row.team_short.trim() : "";
    if (shortTeam.length > 0) return shortTeam;
  }
  return "—";
};

const readPrice = (value: unknown) => {
  return readFiniteNumber(value);
};

const formatPlayerMeta = (teamShort: string, price: unknown) => {
  const priceLabel = formatMoney(readPrice(price));
  const hasTeam = teamShort && teamShort !== "—";
  const hasPrice = priceLabel !== "—";
  if (hasTeam && hasPrice) return `${teamShort} · ${priceLabel}`;
  if (hasTeam) return teamShort;
  if (hasPrice) return priceLabel;
  return "—";
};

const toDebugValue = (value: unknown) => {
  if (value === undefined || value === null) return "∅";
  if (typeof value === "string") return value.trim().length > 0 ? value : "''";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

export const TransferPlanner = ({
  transfers,
  planSlot,
  isLoading = false,
  targetGw,
  playerNameById,
  playerTeamById,
}: TransferPlannerProps) => {
  const moves = Array.isArray(transfers?.moves) ? transfers.moves : [];
  // The plan's own moves are the recommendation and are rendered on the
  // DecisionCard with the only Apply control. What is left are alternatives:
  // single-GW beam swaps, scored on a different horizon, shown for reference.
  const alternatives = moves.filter((move) => !move.in_plan);
  const transferPlan = transfers?.transfer_plan;
  const beamHorizon = transferPlan?.horizon_gws;
  const horizonLabel =
    typeof beamHorizon === "number" ? `over ${beamHorizon} GW${beamHorizon === 1 ? "" : "s"}` : "single-week";
  const hotByPosition = transfers?.hot_by_position ?? {};
  const debugTransfers =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug_transfers") === "1";
  const hotRows = POSITION_ORDER
    .map((position) => ({
      position,
      players: Array.isArray(hotByPosition[position]) ? hotByPosition[position] : [],
    }))
    .filter((row) => row.players.length > 0);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Transfer Planner
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {typeof targetGw === "number" && (
            <Badge variant="outline" className="text-xs">
              GW {targetGw}
            </Badge>
          )}
          {typeof transferPlan?.free_transfers === "number" && (
            <Badge variant="outline" className="text-xs">
              FT: {transferPlan.free_transfers}
            </Badge>
          )}
        </div>
      </div>

      {planSlot}

      {isLoading && (
        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          Computing transfer suggestions…
        </div>
      )}
      {!isLoading && moves.length === 0 && (
        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          No transfer suggestions returned.
        </div>
      )}

      {/* Quick swaps read as advice no matter how they're labeled, so they
          always live behind a disclosure and carry no apply control — the plan
          above is the only advice, and the only thing you can apply. */}
      {alternatives.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Alternatives ({alternatives.length}) — best single swaps {horizonLabel}, not the recommendation
          </summary>
          <div className="mt-3 space-y-3">
            {alternatives.map((move, idx) => (
              <div key={`${move.sell.id}-${move.buy.id}-${idx}`} className="rounded-lg border border-border p-3">
                {(() => {
                  const sellRow = move.sell as unknown as Record<string, unknown>;
                  const buyRow = move.buy as unknown as Record<string, unknown>;
                  const sellName = readPlayerName(move.sell, move.sell.id, playerNameById);
                  const buyName = readPlayerName(move.buy, move.buy.id, playerNameById);
                  const sellTeam = readTeamShort(move.sell, move.sell.id, playerTeamById);
                  const buyTeam = readTeamShort(move.buy, move.buy.id, playerTeamById);
                  const sellMeta = formatPlayerMeta(sellTeam, move.sell.price);
                  const buyMeta = formatPlayerMeta(buyTeam, move.buy.price);

                  return (
                    <>
                      <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>Move {idx + 1}</span>
                        {move.position && <Badge variant="outline">{move.position}</Badge>}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex-1 flex items-center gap-2 min-w-[110px]">
                            <JerseyIcon team={sellTeam} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight" title={sellName}>
                                {sellName}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">{sellMeta}</p>
                              {move.sell.next_fixture && (
                                <p className="text-[10px] text-muted-foreground/80 whitespace-nowrap">{move.sell.next_fixture}</p>
                              )}
                            </div>
                          </div>

                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                          <div className="flex-1 flex items-center gap-2 min-w-[110px]">
                            <JerseyIcon team={buyTeam} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight" title={buyName}>
                                {buyName}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">{buyMeta}</p>
                              {move.buy.next_fixture && (
                                <p className="text-[10px] text-muted-foreground/80 whitespace-nowrap">{move.buy.next_fixture}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {typeof move.buy_hot_score === "number" && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Hot {formatPoints(move.buy_hot_score)}
                            </Badge>
                          )}
                          {typeof move.buy_set_piece_score === "number" && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              SP {formatPoints(move.buy_set_piece_score)}
                            </Badge>
                          )}
                          {typeof move.score_gain === "number" && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {fmtGain(move.score_gain)} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                      {debugTransfers && (
                        <p className="mt-2 text-[11px] text-muted-foreground break-all">
                          debug sell[resolved={sellName}, id={toDebugValue(sellRow.id)}, name={toDebugValue(sellRow.name)}, web_name={toDebugValue(sellRow.web_name)}, player_name={toDebugValue(sellRow.player_name)}] buy[resolved={buyName}, id={toDebugValue(buyRow.id)}, name={toDebugValue(buyRow.name)}, web_name={toDebugValue(buyRow.web_name)}, player_name={toDebugValue(buyRow.player_name)}]
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </details>
      )}

      {hotRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hot Targets</p>
          {hotRows.map(({ position, players }) => (
            <div key={position} className="rounded-xl border border-border bg-card/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{position}</p>
              <div className="space-y-2">
                {players.slice(0, 3).map((player) => {
                  const hasXpts = typeof player.xpts === "number";
                  const hasHorizon = typeof player.xpts_horizon === "number";
                  return (
                    <div key={player.id} className="flex items-center gap-2">
                      <JerseyIcon team={player.team} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{player.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {player.team} · {formatMoney(player.price)}
                          {player.next_fixture ? ` · ${player.next_fixture}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {hasXpts ? (
                          <>
                            <p className="text-sm font-bold text-primary leading-none">
                              {formatPoints(player.xpts)} xPts
                            </p>
                            {hasHorizon && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatPoints(player.xpts_horizon)} horizon
                              </p>
                            )}
                          </>
                        ) : typeof player.transfer_score === "number" ? (
                          <Badge variant="outline" className="text-xs">
                            score {formatPoints(player.transfer_score)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
