import type { Player } from "@/components/PlayerCard";
import type { SquadPlayer } from "./squadPickerApi";

/** Minimal shape DraftPitch needs — satisfied by both PoolPlayer and SquadPlayer. */
export interface DraftPitchPlayer {
  player_id: number;
  web_name: string;
  pos: SquadPlayer["pos"];
  team_short: string;
  price_m: number;
  xpts_horizon?: number;
  fixtures?: { gw: number; opp: string; home: boolean; diff: number }[];
}

const POS_ORDER: SquadPlayer["pos"][] = ["GKP", "DEF", "MID", "FWD"];

/** XI grouped into formation rows (GKP/DEF/MID/FWD) + the bench, GK first. */
export function splitXiBench(
  squad: DraftPitchPlayer[],
  xiIds: Set<number>
): { rows: DraftPitchPlayer[][]; bench: DraftPitchPlayer[] } {
  const xi = squad.filter((p) => xiIds.has(p.player_id));
  const rows = POS_ORDER.map((pos) => xi.filter((p) => p.pos === pos));
  const bench = squad
    .filter((p) => !xiIds.has(p.player_id))
    .sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
  return { rows, bench };
}

export function toPitchPlayer(
  p: DraftPitchPlayer,
  ids: { captainId: number | null; viceId: number | null }
): Player {
  const next = p.fixtures?.[0];
  return {
    id: p.player_id,
    name: p.web_name,
    team: p.team_short,
    price: p.price_m,
    points: Math.round((p.xpts_horizon ?? 0) * 10) / 10,
    isCaptain: p.player_id === ids.captainId,
    isViceCaptain: p.player_id === ids.viceId,
    ...(next
      ? { fixture: { opponent: next.opp, isHome: next.home, difficulty: next.diff } }
      : {}),
  };
}
