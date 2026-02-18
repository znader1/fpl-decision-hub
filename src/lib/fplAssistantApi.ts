export type FplPosition = "GKP" | "DEF" | "MID" | "FWD";

export interface FplTeamRecommendationPlayer {
  player_id: number;
  web_name: string;
  pos: FplPosition;
  team_short: string;
  team_name: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
  xpts: number;
  next_fixtures?: string;
  fixtures_horizon?: FplFixturesHorizonItem[];
  is_captain_suggested?: boolean;
  is_vice_suggested?: boolean;
  team?: number;
  code?: number;
  photo?: string;
  badge_url?: string;
  photo_url?: string;
}

export interface FplFixturesHorizonItem {
  event_id: number;
  fixtures: string;
  fixture_count?: number;
  diff_avg?: number;
  xpts?: number;
}

export interface FplTeamRecommendationBenchPlayer extends FplTeamRecommendationPlayer {
  bench_order: number;
}

export interface FplTransferPlayer {
  id: number;
  name: string;
  team: string;
  price: number;
}

export interface FplTransferMove {
  sell: FplTransferPlayer;
  buy: FplTransferPlayer;
  score_gain?: number;
}

export interface FplTransfersRecommendation {
  note?: string;
  moves: FplTransferMove[];
  remaining_itb?: number;
}

export interface FplTeamFixture {
  team_short: string;
  opponent_short: string;
  difficulty?: number;
  is_home?: boolean;
}

export interface FplSquad {
  entry_id: number;
  event_id: number;
  formation?: [number, number, number];
  captain_player_id?: number;
  vice_player_id?: number;
  starting_xi: FplTeamRecommendationPlayer[];
  bench: FplTeamRecommendationBenchPlayer[];
}

export interface FplTeamRecommendation extends FplSquad {
  entry_id: number;
  event_id: number;
  horizon_gws: number;
  formation: [number, number, number];
  captain_player_id: number;
  vice_player_id: number;
  projected_points_with_captain: number;
  transfers?: FplTransfersRecommendation;
  starting_xi: FplTeamRecommendationPlayer[];
  bench: FplTeamRecommendationBenchPlayer[];
}

export const SAMPLE_TEAM_RECOMMENDATION: FplTeamRecommendation = {
  entry_id: 588004,
  event_id: 25,
  horizon_gws: 3,
  formation: [4, 5, 1],
  captain_player_id: 449,
  vice_player_id: 237,
  projected_points_with_captain: 57.931999999999995,
  transfers: {
    note: "Sample transfer suggestion (replace with backend output).",
    moves: [
      {
        sell: {
          id: 253,
          name: "Henderson",
          team: "CRY",
          price: 5,
        },
        buy: {
          id: 32,
          name: "Martinez",
          team: "AVL",
          price: 5,
        },
        score_gain: 5.1,
      },
    ],
    remaining_itb: 0.5,
  },
  starting_xi: [
    {
      player_id: 5,
      web_name: "Gabriel",
      pos: "DEF",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: true,
      is_vice_captain: false,
      multiplier: 3,
      xpts: 5.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 226597,
      photo: "226597.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p226597.png",
    },
    {
      player_id: 411,
      web_name: "O'Reilly",
      pos: "DEF",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.7,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 472769,
      photo: "472769.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p472769.png",
    },
    {
      player_id: 8,
      web_name: "J.Timber",
      pos: "DEF",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.2,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 445122,
      photo: "445122.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p445122.png",
    },
    {
      player_id: 72,
      web_name: "Senesi",
      pos: "DEF",
      team_short: "BOU",
      team_name: "Bournemouth",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.8880000000000003,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 4,
      code: 221466,
      photo: "221466.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t91.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p221466.png",
    },
    {
      player_id: 430,
      web_name: "Haaland",
      pos: "FWD",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: true,
      multiplier: 1,
      xpts: 5.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 223094,
      photo: "223094.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p223094.png",
    },
    {
      player_id: 253,
      web_name: "Henderson",
      pos: "GKP",
      team_short: "CRY",
      team_name: "Crystal Palace",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.024,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 8,
      code: 172649,
      photo: "172649.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t31.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p172649.png",
    },
    {
      player_id: 449,
      web_name: "B.Fernandes",
      pos: "MID",
      team_short: "MUN",
      team_name: "Man Utd",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 7.4,
      is_captain_suggested: true,
      is_vice_suggested: false,
      team: 14,
      code: 141746,
      photo: "141746.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t1.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p141746.png",
    },
    {
      player_id: 237,
      web_name: "Enzo",
      pos: "MID",
      team_short: "CHE",
      team_name: "Chelsea",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 5.6160000000000005,
      is_captain_suggested: false,
      is_vice_suggested: true,
      team: 7,
      code: 448047,
      photo: "448047.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t8.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p448047.png",
    },
    {
      player_id: 267,
      web_name: "Sarr",
      pos: "MID",
      team_short: "CRY",
      team_name: "Crystal Palace",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 4.104,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 8,
      code: 232185,
      photo: "232185.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t31.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p232185.png",
    },
    {
      player_id: 21,
      web_name: "Rice",
      pos: "MID",
      team_short: "ARS",
      team_name: "Arsenal",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.7,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 1,
      code: 204480,
      photo: "204480.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p204480.png",
    },
    {
      player_id: 417,
      web_name: "Cherki",
      pos: "MID",
      team_short: "MCI",
      team_name: "Man City",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 1,
      xpts: 3.3,
      is_captain_suggested: false,
      is_vice_suggested: false,
      team: 13,
      code: 466052,
      photo: "466052.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t43.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p466052.png",
    },
  ],
  bench: [
    {
      player_id: 136,
      web_name: "Thiago",
      pos: "FWD",
      team_short: "BRE",
      team_name: "Brentford",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 1,
      team: 5,
      code: 502500,
      photo: "502500.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p502500.png",
    },
    {
      player_id: 691,
      web_name: "Calvert-Lewin",
      pos: "FWD",
      team_short: "LEE",
      team_name: "Leeds",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 2,
      team: 11,
      code: 177815,
      photo: "177815.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t2.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p177815.png",
    },
    {
      player_id: 191,
      web_name: "Estève",
      pos: "DEF",
      team_short: "BUR",
      team_name: "Burnley",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.4,
      bench_order: 3,
      team: 3,
      code: 477717,
      photo: "477717.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t90.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p477717.png",
    },
    {
      player_id: 470,
      web_name: "Dúbravka",
      pos: "GKP",
      team_short: "BUR",
      team_name: "Burnley",
      is_captain: false,
      is_vice_captain: false,
      multiplier: 0,
      xpts: 2.6,
      bench_order: 4,
      team: 3,
      code: 67089,
      photo: "67089.jpg",
      badge_url: "https://resources.premierleague.com/premierleague/badges/50/t90.png",
      photo_url:
        "https://resources.premierleague.com/premierleague/photos/players/110x140/p67089.png",
    },
  ],
};

export const SAMPLE_SQUAD: FplSquad = {
  entry_id: SAMPLE_TEAM_RECOMMENDATION.entry_id,
  event_id: SAMPLE_TEAM_RECOMMENDATION.event_id,
  formation: SAMPLE_TEAM_RECOMMENDATION.formation,
  captain_player_id: SAMPLE_TEAM_RECOMMENDATION.captain_player_id,
  vice_player_id: SAMPLE_TEAM_RECOMMENDATION.vice_player_id,
  starting_xi: SAMPLE_TEAM_RECOMMENDATION.starting_xi,
  bench: SAMPLE_TEAM_RECOMMENDATION.bench,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isFplSquad = (value: unknown): value is FplSquad => {
  if (!isRecord(value)) return false;
  if (typeof value.entry_id !== "number") return false;
  if (typeof value.event_id !== "number") return false;
  if (!Array.isArray(value.starting_xi)) return false;
  if (!Array.isArray(value.bench)) return false;
  return true;
};

export const isFplTeamRecommendation = (value: unknown): value is FplTeamRecommendation => {
  if (!isFplSquad(value)) return false;
  if (!isRecord(value)) return false;
  if (typeof value.horizon_gws !== "number") return false;
  if (
    !Array.isArray(value.formation) ||
    value.formation.length !== 3 ||
    value.formation.some((n) => typeof n !== "number")
  ) {
    return false;
  }
  if (typeof value.captain_player_id !== "number") return false;
  if (typeof value.vice_player_id !== "number") return false;
  if (typeof value.projected_points_with_captain !== "number") return false;
  return true;
};

export interface TeamRecommendationParams {
  entryId: number;
  eventId: number;
  horizonGws: number;
  strategy?: string;
  includeTransfers?: boolean;
}

export interface SquadParams {
  entryId: number;
  eventId: number;
}

export interface FixturesParams {
  eventId: number;
}

type UrlTemplateParamValue = string | number | boolean | undefined | null;
type UrlTemplateParams = Record<string, UrlTemplateParamValue>;

export const interpolateUrlTemplate = (template: string, params: UrlTemplateParams): string => {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) return "";
    return encodeURIComponent(String(value));
  });
};

export const interpolateSquadUrl = (template: string, params: SquadParams): string => {
  return interpolateUrlTemplate(template, { entry_id: params.entryId, event_id: params.eventId });
};

export const interpolateTeamRecommendationUrl = (template: string, params: TeamRecommendationParams): string => {
  return interpolateUrlTemplate(template, {
    entry_id: params.entryId,
    event_id: params.eventId,
    horizon_gws: params.horizonGws,
    strategy: params.strategy,
    include_transfers: params.includeTransfers,
  });
};

export const interpolateFixturesUrl = (template: string, params: FixturesParams): string => {
  return interpolateUrlTemplate(template, { event_id: params.eventId });
};

const getEnvString = (key: string): string | undefined => {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

export const getSquadUrlTemplate = (): string | undefined => getEnvString("VITE_FPL_SQUAD_URL");

export const getFixturesUrlTemplate = (): string | undefined => getEnvString("VITE_FPL_FIXTURES_URL");

export const getRecommendationUrlTemplate = (): string | undefined =>
  getEnvString("VITE_FPL_RECOMMENDATION_URL") ?? getEnvString("VITE_FPL_TEAM_RECOMMENDATION_URL");

// Backwards-compatible name (older code uses this).
export const getTeamRecommendationUrlTemplate = getRecommendationUrlTemplate;

const parseJsonMaybe = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

const formatNetworkHint = (url: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "";
  const isMixedContent = protocol === "https:" && url.startsWith("http://");
  return isMixedContent
    ? "Your page is HTTPS but the API URL is HTTP (mixed-content is blocked). Use HTTPS for the API or run the frontend over HTTP."
    : `If this URL works in a tab but fails in fetch, it's usually CORS. Option A: allow Origin ${origin || "<your-frontend-origin>"} in FastAPI CORSMiddleware. Option B (Vite dev): use relative URLs like /squad and /recommendations with a Vite proxy.`;
};

type FixtureRecord = Record<string, unknown>;

const isFplTeamFixtureRecord = (value: unknown): value is FixtureRecord => {
  if (!isRecord(value)) return false;
  const team = value.team_short ?? value.team;
  const opponent = value.opponent_short ?? value.opponent;
  if (typeof team !== "string" || team.length === 0) return false;
  if (typeof opponent !== "string" || opponent.length === 0) return false;

  const difficulty = value.difficulty ?? value.fdr ?? value.fixture_difficulty;
  if (difficulty !== undefined && typeof difficulty !== "number") return false;

  const isHome = value.is_home ?? value.isHome ?? value.home;
  if (isHome !== undefined && typeof isHome !== "boolean") return false;

  return true;
};

const normalizeTeamFixture = (value: FixtureRecord): FplTeamFixture => {
  const difficultyRaw = value.difficulty ?? value.fdr ?? value.fixture_difficulty;
  const isHomeRaw = value.is_home ?? value.isHome ?? value.home;

  return {
    team_short: String((value.team_short ?? value.team) as string),
    opponent_short: String((value.opponent_short ?? value.opponent) as string),
    difficulty: typeof difficultyRaw === "number" ? difficultyRaw : undefined,
    is_home: typeof isHomeRaw === "boolean" ? isHomeRaw : undefined,
  };
};

export const fetchSquad = async (params: SquadParams, signal?: AbortSignal): Promise<FplSquad> => {
  const template = getSquadUrlTemplate();
  if (!template) return SAMPLE_SQUAD;

  const url = interpolateSquadUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching squad. ${hint} (${message})`);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch squad (${response.status})${suffix}`);
  }

  const raw: unknown = await response.json();
  const data = parseJsonMaybe(raw);
  if (!isFplSquad(data)) {
    throw new Error("Invalid squad response");
  }

  return data;
};

export const fetchFixtures = async (params: FixturesParams, signal?: AbortSignal): Promise<FplTeamFixture[]> => {
  const template = getFixturesUrlTemplate();
  if (!template) return [];

  const url = interpolateFixturesUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching fixtures. ${hint} (${message})`);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch fixtures (${response.status})${suffix}`);
  }

  const raw: unknown = await response.json();
  const data: unknown = parseJsonMaybe(raw);
  const fixturesRaw = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.fixtures)
      ? data.fixtures
      : undefined;

  if (!fixturesRaw) {
    throw new Error("Invalid fixtures response");
  }

  const fixtures: FplTeamFixture[] = fixturesRaw
    .filter(isFplTeamFixtureRecord)
    .map((fixture) => normalizeTeamFixture(fixture));

  return fixtures;
};

export const fetchTeamRecommendation = async (
  params: TeamRecommendationParams,
  signal?: AbortSignal
): Promise<FplTeamRecommendation> => {
  const template = getRecommendationUrlTemplate();
  if (!template) return SAMPLE_TEAM_RECOMMENDATION;

  const url = interpolateTeamRecommendationUrl(template, params);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (typeof err === "object" && err !== null && "name" in err && err.name === "AbortError") throw err;

    const hint = formatNetworkHint(url);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error fetching team recommendation. ${hint} (${message})`);
  }
  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch {
      details = "";
    }
    const trimmed = details.trim();
    const suffix = trimmed ? `: ${trimmed.slice(0, 300)}` : "";
    throw new Error(`Failed to fetch team recommendation (${response.status})${suffix}`);
  }

  const raw: unknown = await response.json();
  const data: unknown = parseJsonMaybe(raw);

  if (!isFplTeamRecommendation(data)) {
    throw new Error("Invalid team recommendation response");
  }

  return data;
};
