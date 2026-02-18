import { JerseyIcon } from "./JerseyIcon";

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
  price?: number;
  points: number;
  number?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  fixture?: PlayerFixture;
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

export const PlayerCard = ({ player }: PlayerCardProps) => {
  const fixture = player.fixture;
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
  );
};
