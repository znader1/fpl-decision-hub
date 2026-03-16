import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JerseyIcon } from "./JerseyIcon";
import { Badge } from "@/components/ui/badge";
import type { FplPosition, FplTransfersRecommendation } from "@/lib/fplAssistantApi";

interface TransferPlannerProps {
  transfers?: FplTransfersRecommendation;
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
  isLoading = false,
  targetGw,
  playerNameById,
  playerTeamById,
}: TransferPlannerProps) => {
  const moves = Array.isArray(transfers?.moves) ? transfers.moves : [];
  const transferPlan = transfers?.transfer_plan;
  const transfersRecord = transfers as Record<string, unknown> | undefined;
  const remainingItb = readPrice(transfers?.remaining_itb ?? transfersRecord?.itb_m);
  const movesUsed =
    typeof transferPlan?.transfer_count_built === "number"
      ? transferPlan.transfer_count_built
      : typeof transfers?.moves_used === "number"
        ? transfers.moves_used
        : typeof transfers?.transfer_policy?.moves_used === "number"
          ? transfers.transfer_policy.moves_used
          : moves.length;
  const maxMoves =
    typeof transferPlan?.transfer_count_target === "number"
      ? transferPlan.transfer_count_target
      : typeof transfers?.max_moves === "number"
        ? transfers.max_moves
        : typeof transfers?.transfer_policy?.max_moves === "number"
          ? transfers.transfer_policy.max_moves
          : undefined;
  const totalScoreGain = moves.reduce((sum, move) => sum + (move.score_gain ?? 0), 0);
  const hasMoveGain = moves.some((move) => typeof move.score_gain === "number");
  const sortedMoveCounts = Object.entries(transfers?.moves_by_position ?? {})
    .filter(([, count]) => typeof count === "number" && Number.isFinite(count))
    .sort(([a], [b]) => POSITION_ORDER.indexOf(a as FplPosition) - POSITION_ORDER.indexOf(b as FplPosition));
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
          <Badge variant="secondary" className="text-xs">
            Moves: {movesUsed}
            {typeof maxMoves === "number" ? `/${maxMoves}` : ""}
          </Badge>
          {hasMoveGain && (
            <Badge variant="secondary" className="text-xs">
              Gain: {formatPoints(totalScoreGain, true)} pts
            </Badge>
          )}
          {typeof transferPlan?.free_transfers === "number" && (
            <Badge variant="outline" className="text-xs">
              FT: {transferPlan.free_transfers}
            </Badge>
          )}
          {typeof transferPlan?.hit_cap === "number" && (
            <Badge variant="outline" className="text-xs">
              Hit cap: {transferPlan.hit_cap}
            </Badge>
          )}
          {typeof remainingItb === "number" && Number.isFinite(remainingItb) && (
            <Badge variant="outline" className="text-xs">
              ITB: {formatMoney(remainingItb)}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Suggested Transfers
        </p>
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
        {moves.map((move, idx) => (
          <div key={`${move.sell.id}-${move.buy.id}-${idx}`} className="rounded-lg border border-border p-3">
            {(() => {
              const sellRow = move.sell as Record<string, unknown>;
              const buyRow = move.buy as Record<string, unknown>;
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
                    <p
                      className="text-sm font-medium text-foreground leading-tight"
                      title={sellName}
                    >
                      {sellName}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{sellMeta}</p>
                  </div>
                </div>

                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                <div className="flex-1 flex items-center gap-2 min-w-[110px]">
                  <JerseyIcon team={buyTeam} size="sm" />
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium text-foreground leading-tight"
                      title={buyName}
                    >
                      {buyName}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{buyMeta}</p>
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
                    {formatPoints(move.score_gain, true)} pts
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

      {sortedMoveCounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moves by Position</p>
          <div className="flex flex-wrap gap-2">
            {sortedMoveCounts.map(([position, count]) => (
              <Badge key={position} variant="secondary" className="text-xs">
                {position}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hotRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hot Targets</p>
          {hotRows.map(({ position, players }) => (
            <div key={position} className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground mb-2">{position}</p>
              <div className="space-y-1.5">
                {players.slice(0, 2).map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <JerseyIcon team={player.team} size="sm" />
                      <p className="text-xs text-foreground truncate">
                        {player.name} ({player.team})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatMoney(player.price)}</span>
                      {typeof player.transfer_score === "number" && (
                        <Badge variant="outline" className="text-xs">
                          {formatPoints(player.transfer_score)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
