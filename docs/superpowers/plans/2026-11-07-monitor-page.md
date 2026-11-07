# Monitor Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An owner-only page at `/app/monitor` that shows, gameweek by gameweek, the app's best eleven, The Scout's eleven and the owner's team on three coloured pitches with real points, plus transfer, captain, wildcard and buy-list verdicts, and a season tab with running totals.

**Architecture:** The page reads finished reports from the Supabase table `monitor_reports` with the signed-in user's own session (row-level security is the gate; plan 1 built the rows). A pure module turns a report into view models; small components render them; one page composes tabs and URL state. No backend call and no new API route.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, shadcn `tabs`/`card`, TanStack Query, `@supabase/supabase-js`, Vitest + Testing Library (jsdom pragma for components).

**Spec:** `/Users/ziadnader/05_Projects/Tech/FPL-Assistant/FPL/docs/superpowers/specs/2026-11-05-monitoring-dashboard-design.md` (backend repo; sections 4, 5, 7.3, 7.6). Plan 1 (data) is `docs/superpowers/plans/2026-11-05-monitoring-data-backfill.md` in the same repo. Mockups: `/Users/ziadnader/05_Projects/Tech/FPL-Assistant/.superpowers/brainstorm/66359-1793911985/content/pitch-colours.html` (option 2) and `landing-view.html` (layout A: gameweek first). Approved throwaway preview: `/Users/ziadnader/05_Projects/Tech/FPL-Assistant/monitoring/preview.html`.

## Global Constraints

- Branch `feature/monitor-page` in worktree `/Users/ziadnader/05_Projects/Tech/FPL-Assistant-Front/worktrees/monitor-page`; never touch the main checkout; PR against `main`; the owner merges.
- Route `/app/monitor` under `ProtectedRoute`; the nav link appears only when the owner check succeeds; a non-owner who types the URL sees `<NotFound />`. No owner id, entry id or season constant in the client bundle: entries and season come from the rows.
- Colours (spec 4, mockup option 2): App = pink `328 80% 48%` light / `328 75% 58%` dark; Scout = orange `32 95% 44%` / `36 95% 55%`; You = blue `190 80% 36%` / `190 75% 52%`. Pitch turf per column (light `--turf`/`--turf-dark`, dark): app `328 46% 38%`/`328 50% 30%`, dark `328 38% 25%`/`328 42% 18%`; scout `28 62% 40%`/`28 66% 32%`, dark `28 50% 26%`/`28 54% 19%`; you `198 58% 38%`/`198 62% 30%`, dark `198 48% 25%`/`198 52% 18%`.
- Totals come from the report (`headline`, `you.points`, `points_no_captain`/`points_with_captain`), never from summing cards. The chips show `headline.*`; `headline.basis` says whether captains are doubled.
- Every report section may be `{available: false, reason}`; the page shows the reason in that section's place and never crashes. `players` is keyed by the id as a string; a missing id renders `#id`.
- Tests colocated as `*.test.ts(x)`; component tests start with `// @vitest-environment jsdom`. `npm run typecheck`, `npm run lint`, `npm test` green before the PR. Security review on the diff before the PR, findings in the PR body.
- Vercel preview deploys from the PR automatically to the personal team; no CLI deploy.

## Review Focus

1. **Captain did not play.** `players[captain].minutes === 0` and the vice played: the vice's card shows the doubled value and the `C` badge moves nowhere (badge stays on the named captain, the doubling moves). Test in Task 3.
2. **Scout eleven is partial** (`scout_xi.partial: true`): the pitch renders the matched players, the chip shows "—" with a "partial" note, and the total is not compared. Test in Task 3 and Task 5.
3. **A player id missing from `players`** (older row, hand edit): the card shows `#id`, club "—", and the page renders. Test in Task 1 and Task 4.
4. **Chip week** (`transfers.app.reason === "chip week"`): the Transfers card says so and shows no verdict. Test in Task 6.
5. **Before the deadline or live** (`state !== "finished"`): cards show the projection only, chips show "—", the best-possible strip says "gameweek not finished", nobody is faded. Test in Task 3 and Task 5.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/monitorReport.ts` | TypeScript types of the stored report; `parseMonitorReport(json: unknown): MonitorReport \| null` (runtime check of the few shapes the page relies on). |
| `src/lib/monitorRemote.ts` | Supabase reads: owner check, season listing (small JSON-path select), one full report. |
| `src/hooks/useMonitorOwner.ts` | TanStack hook around the owner check: `{ owner: boolean \| null, loading, error, refetch }`. |
| `src/lib/monitorView.ts` | Pure view models: a pitch column from a report, card points/doubling, shared/faded flags, verdict labels, season rows with running totals, projection error. |
| `src/components/monitor/MonitorPlayerCard.tsx` | Compact card: `JerseyIcon size="sm"`, name, `pts · xpts`, `C`/`V`, shared ring, faded. |
| `src/components/monitor/MonitorPitch.tsx` | One coloured pitch: header (title, subtitle, total), formation rows, optional bench strip. |
| `src/components/monitor/MonitorGwBar.tsx` | Prev/next, state pill, four chips. |
| `src/components/monitor/BestXiStrip.tsx` | Slim best-possible strip. |
| `src/components/monitor/TransfersCard.tsx` | Contest 1 (app vs you, three windows, verdict) + chip-week / unavailable states. |
| `src/components/monitor/BuyListsCard.tsx` | Contest 2: app buy list vs Scout radar, average per player per window. |
| `src/components/monitor/MonitorCaptainCard.tsx` | App-for-you, Scout, you, best in squad, best overall. |
| `src/components/monitor/MonitorWildcardCard.tsx` | Kept squad vs app presets (headline preset first) vs Scout squad, five-gameweek window, verdict. |
| `src/components/monitor/SeasonTable.tsx` | One row per gameweek, running totals, link to the gameweek tab. |
| `src/components/monitor/SeasonSideCards.tsx` | Transfers record, captain record, wildcard verdicts, projection error. |
| `src/pages/Monitor.tsx` | Owner gate, tabs, URL state (`?entry=&gw=&tab=`), queries, composition. |
| `src/App.tsx`, `src/components/layout/Navbar.tsx`, `src/integrations/supabase/types.ts`, `src/index.css`, `CLAUDE.md` | Route, link, table types, colour tokens, docs. |
| `src/lib/__tests__/fixtures/monitor_gw{1,7,9,10}.json` | Real reports for entry 107342 (GW1 no app column + bench boost; GW7 chip week; GW9 finished with inferred Scout captain; GW10 live with `you` unavailable). |

Component naming avoids the existing `CaptainCard.tsx` and `WildcardCard.tsx`.

---

### Task 1: Report types, parser, fixtures

**Files:**
- Create: `src/lib/monitorReport.ts`, `src/lib/monitorReport.test.ts`
- Create: `src/lib/__tests__/fixtures/monitor_gw1.json`, `monitor_gw7.json`, `monitor_gw9.json`, `monitor_gw10.json`

**Interfaces:**
- Produces:
  ```ts
  export type MonitorState = "before_deadline" | "live" | "finished";
  export type Unavailable = { available: false; reason: string; url?: string };
  export type Window = { gain?: number; points?: number; played: number; complete: boolean };
  export type Windows = Record<"1" | "3" | "5", Window>;
  export type MonitorPlayer = { name: string | null; club: string | null; pos: "GKP" | "DEF" | "MID" | "FWD" | null;
    points: number | null; minutes: number | null; xpts: number | null; price_m: number | null };
  export type XiBlock = { available: true; ids: number[]; captain_id: number | null; vice_id: number | null;
    points_no_captain: number | null; points_with_captain: number | null; missing_points: number[];
    projected?: number | null; price_m?: number | null; model_version?: string | null;
    partial?: boolean; captain_stated?: boolean; captain_inferred_id?: number | null; needs_review?: boolean;
    unmatched?: string[]; url?: string; published_at?: string } | Unavailable;
  export type YouBlock = { available: true; ids: number[]; xi_ids: number[]; bench_ids: number[]; captain_id: number | null;
    vice_id: number | null; chip: string | null; points: number | null; points_on_bench: number | null; transfer_cost: number | null } | Unavailable;
  export type Move = { sell_id: number; buy_id: number };
  export type TransferSide = { available: true; moves: Move[]; windows: Windows; hits?: number; action?: string; origin?: "replay" | "live" } | Unavailable;
  export type ListSide = { available: true; players: { id: number; price_m: number | null; windows: Windows }[];
    avg: Record<"1" | "3" | "5", number | null>; avg_per_m: Record<"1" | "3" | "5", number | null>; origin?: string; url?: string; needs_review?: boolean; unmatched?: string[] } | Unavailable;
  export type SquadWindow = { available?: true; ids: number[]; points: number; played: number; complete: boolean;
    absent_by_gw: Record<string, number[]>; no_projection_gws: number[]; url?: string } | Unavailable;
  export type CaptainLine = { id: number; points: number | null; stated?: boolean } | null;
  export interface MonitorReport {
    season: string; gw: number; entry_id: number; state: MonitorState;
    app_xi: XiBlock; scout_xi: XiBlock; you: YouBlock; best_xi: { available: true; ids: number[]; points: number } | Unavailable;
    headline: { app: number | null; scout: number | null; you: number | null; best: number | null; basis: "no_captain" | "with_captain" };
    captain: { app_for_you: CaptainLine; scout: CaptainLine; you: CaptainLine; best_in_squad: CaptainLine; best_overall: CaptainLine };
    transfers: { chip_week: boolean; verdict_window: number; verdict: "app" | "you" | "level" | null; app: TransferSide; you: TransferSide };
    buy_lists: { app: ListSide; scout: ListSide };
    wildcard: { window: number; kept: SquadWindow; app: { available: true; presets: Record<string, SquadWindow>; headline_preset: string; origin?: string; notes?: string[] } | Unavailable;
      scout: SquadWindow; actual: { played: number; points: number } | null; verdict: "app" | "kept" | "level" | null };
    replay: { notes: string[]; parity: { status: string; n: number; mae: number | null; corr: number | null }; dropped_squad_ids: number[] };
    players: Record<string, MonitorPlayer>;
  }
  export function parseMonitorReport(json: unknown): MonitorReport | null;
  export function playerOf(report: MonitorReport, id: number): MonitorPlayer; // `#id` name, null fields when missing
  ```

- [ ] **Step 1: Save the four fixtures.** Run in the Supabase MCP (project `tetvymwgpaordnmsnneo`):
  ```sql
  select gw, report::text from monitor_reports where season='2026-27' and entry_id=107342 and gw in (1,7,9,10) order by gw;
  ```
  Write each `report` verbatim to `src/lib/__tests__/fixtures/monitor_gw<gw>.json`. Do not edit the content.

- [ ] **Step 2: Write the failing tests** in `src/lib/monitorReport.test.ts`:
  ```ts
  it("parses the four real reports", () => { for (const f of [gw1, gw7, gw9, gw10]) expect(parseMonitorReport(f)?.gw).toBe(f.gw); });
  it("returns null for a non-object or a row without gw/state/players", () => { expect(parseMonitorReport(null)).toBeNull(); expect(parseMonitorReport({ gw: 3 })).toBeNull(); });
  it("GW1 has no app column and a bench boost", () => { const r = parseMonitorReport(gw1)!; expect(r.app_xi.available).toBe(false); expect(r.you.available && r.you.chip).toBe("bboost"); });
  it("GW9 names the inferred Scout captain without stating it", () => { const s = parseMonitorReport(gw9)!.scout_xi; expect(s.available && s.captain_stated).toBe(false); expect(s.available && s.captain_inferred_id).toBe(411); });
  it("playerOf falls back to #id", () => { expect(playerOf(parseMonitorReport(gw9)!, 999999)).toMatchObject({ name: "#999999", points: null }); });
  ```
  Import fixtures with `import gw9 from "./__tests__/fixtures/monitor_gw9.json"` (resolveJsonModule is on in `tsconfig.app.json`; check, enable if not).

- [ ] **Step 3: Run** `npx vitest run src/lib/monitorReport.test.ts` — FAIL (module not found).

- [ ] **Step 4: Implement** `parseMonitorReport` (checks: object, integer `gw`, `state` in the three values, `players` is an object, `headline` is an object; everything else is passed through typed) and `playerOf`.

- [ ] **Step 5: Run** the test file — PASS. Run `npm run typecheck` — clean.

- [ ] **Step 6: Commit** `feat(monitor): report types, parser and real fixtures`.

---

### Task 2: Supabase reads, owner hook, table types, colour tokens

**Files:**
- Modify: `src/integrations/supabase/types.ts` (add `monitor_owners` and `monitor_reports` under `Tables`, by hand, same style as `gw_plans`; the file header says generated, but regeneration would rewrite unrelated types, so hand-add and keep the diff to these two tables)
- Modify: `src/index.css` (both theme blocks)
- Create: `src/lib/monitorRemote.ts`, `src/lib/monitorRemote.test.ts`, `src/hooks/useMonitorOwner.ts`

**Interfaces:**
- Consumes: `parseMonitorReport` (Task 1), `supabase` client, `useAuth`.
- Produces:
  ```ts
  // monitorRemote.ts
  export interface SeasonRow { season: string; gw: number; entry_id: number; state: MonitorState; built_at: string;
    headline: MonitorReport["headline"]; transfers_verdict: "app" | "you" | "level" | null; wildcard_verdict: "app" | "kept" | "level" | null;
    captain: MonitorReport["captain"]; app_projected: number | null; app_points_no_captain: number | null; chip_week: boolean }
  export interface MonitorRemote {
    isOwner(userId: string): Promise<boolean>;                       // select user_id from monitor_owners eq userId maybeSingle
    listSeason(): Promise<SeasonRow[]>;                               // select gw, entry_id, season, built_at, state:report->>state, headline:report->headline, ... order gw
    loadReport(season: string, entryId: number, gw: number): Promise<MonitorReport | null>; // select report ... maybeSingle, parseMonitorReport
  }
  export const supabaseMonitorRemote: MonitorRemote;
  // useMonitorOwner.ts
  export function useMonitorOwner(remote?: MonitorRemote): { owner: boolean | null; loading: boolean; error: unknown; refetch: () => void }
  ```
  `listSeason` select string: `"season, gw, entry_id, built_at, state:report->>state, headline:report->headline, transfers_verdict:report->transfers->>verdict, wildcard_verdict:report->wildcard->>verdict, captain:report->captain, app_projected:report->app_xi->projected, app_points_no_captain:report->app_xi->points_no_captain, chip_week:report->transfers->chip_week"` with `.returns<RawSeasonRow[]>()`; coerce `->` JSON values in code (numbers may arrive as numbers, verdicts as strings or null).
  `useMonitorOwner`: `useQuery({ queryKey: ["monitor-owner", userId], queryFn: () => remote.isOwner(userId), enabled: !!userId, staleTime: 10 min })`; `owner` is `null` while loading or on error, never `false` on a network error.
- CSS tokens, `:root` and `.dark`: `--monitor-app`, `--monitor-scout`, `--monitor-you`, and `--monitor-app-turf`, `--monitor-app-turf-dark` (same for scout, you) with the values in Global Constraints.

- [ ] **Step 1: Write the failing tests** in `src/lib/monitorRemote.test.ts`, mocking `@/integrations/supabase/client` with a chainable fake (`from().select().eq().maybeSingle()` and `.order().returns()`):
  ```ts
  it("isOwner is true only when a row comes back", ...);          // {data:{user_id:"u1"}} → true; {data:null} → false; {error} → throws
  it("loadReport runs the row through parseMonitorReport", ...);  // data:{report: gw9} → gw 9; data:{report:{bad:true}} → null
  it("listSeason coerces JSON-path columns", ...);                 // state "finished", transfers_verdict "you", app_projected 60 as number
  ```

- [ ] **Step 2: Run** the file — FAIL.

- [ ] **Step 3: Implement** `monitorRemote.ts`, `useMonitorOwner.ts`, the two table types, the twelve CSS tokens.

- [ ] **Step 4: Run** the file — PASS; `npm run typecheck` — clean (the typed client must accept `from("monitor_reports")`).

- [ ] **Step 5: Commit** `feat(monitor): supabase reads, owner hook, table types, colour tokens`.

---

### Task 3: Pure view models

**Files:**
- Create: `src/lib/monitorView.ts`, `src/lib/monitorView.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `playerOf`.
- Produces:
  ```ts
  export type Tone = "app" | "scout" | "you";
  export interface CardModel { id: number; name: string; club: string; pos: MonitorPlayer["pos"]; points: number | null; // doubled when this card carries the armband
    xpts: number | null; isCaptain: boolean; isVice: boolean; doubled: boolean; shared: boolean; faded: boolean }
  export interface PitchModel { tone: Tone; title: string; subtitle: string; total: number | null; totalNote: string | null; // "partial", "projected 60.0", "22 on bench"
    rows: CardModel[][]; bench: CardModel[]; unavailable: string | null }
  export function doubledId(xi: { captain_id: number | null; vice_id: number | null }, report: MonitorReport): number | null; // captain, or vice when captain minutes === 0 and vice minutes > 0, null before the deadline
  export function pitchModel(report: MonitorReport, tone: Tone): PitchModel;
  export function bestStrip(report: MonitorReport): { points: number | null; names: string[]; reason: string | null };
  export function verdictLabel(v: "app" | "you" | "kept" | "level" | null, window: number, complete: boolean): string; // "You, over 3 gameweeks" | "App" | "Level" | "Open (2 of 3 played)"
  export function fmtGain(n: number | null | undefined): string; // "+15", "−13", "0", "—"
  export interface SeasonRowModel { gw: number; state: MonitorState; app: number | null; scout: number | null; you: number | null; best: number | null;
    closer: "app" | "scout" | "level" | null; runApp: number; runScout: number; runYou: number; counted: boolean; // counted when app and scout both present
    transfersVerdict: SeasonRow["transfers_verdict"]; wildcardVerdict: SeasonRow["wildcard_verdict"]; chipWeek: boolean;
    captainHit: boolean | null; // you.captain id === best_in_squad id
    projectionError: number | null } // app_projected − app_points_no_captain
  export function seasonRows(rows: SeasonRow[], entryId: number): SeasonRowModel[];
  export function seasonSummary(rows: SeasonRowModel[]): { transfers: { app: number; you: number; level: number; open: number };
    captain: { hits: number; of: number }; wildcard: { app: number; kept: number; level: number; open: number };
    projection: { meanSigned: number | null; meanAbs: number | null; n: number } }
  ```
  Rules pinned: shared = id in `app_xi.ids` and tone ≠ app; faded = `state !== "before_deadline"` and `minutes === 0`; doubling: app column doubles when `headline.basis === "with_captain"` or always on the app card? **Decision:** a pitch total is the column's `headline` value, so the three totals are always on the same basis; cards double the armband only on a column whose total includes it: you always (FPL points), app and Scout only when `headline.basis === "with_captain"`. GW9 (Scout captain not stated) therefore shows 70 / 69 / 64 with no doubling on app or Scout; GW2–GW8 show with-captain totals and doubled captains. Subtitle: app "best eleven from the app's projections", scout "published <d Mon>, premierleague.com", you "<chip name> played" or "as picked". `totalNote`: app `projected 60.0`; scout `partial` when partial; you `22 on bench`. You rows = `xi_ids` grouped by position in the order GKP/DEF/MID/FWD; bench = `bench_ids` in stored order (FPL sub order).

- [ ] **Step 1: Write the failing tests** (fixtures GW1, GW7, GW9, GW10):
  ```ts
  it("GW9 app pitch: 11 cards, headline total 70, Haaland captain but not doubled (basis no_captain)", () => { const m = pitchModel(gw9, "app"); expect(m.rows.flat()).toHaveLength(11); const h = m.rows.flat().find(c => c.id === 411)!; expect(h.isCaptain).toBe(true); expect(h.doubled).toBe(false); expect(m.total).toBe(70); expect(m.totalNote).toBe("projected 60.0"); });
  it("you pitch doubles the captain: GW9 Haaland card shows 4", () => { const h = pitchModel(gw9, "you").rows.flat().find(c => c.id === 411)!; expect(h.doubled).toBe(true); expect(h.points).toBe(4); });
  it("GW9 scout pitch does not double an inferred captain", () => { const c = pitchModel(gw9, "scout").rows.flat().find(c => c.id === 411)!; expect(c.isCaptain).toBe(true); expect(c.doubled).toBe(false); });
  it("you pitch marks app-shared players and bench in stored order", ...);   // bench ids [109,552,115,423]
  it("GW1 app pitch is unavailable with the reason", () => expect(pitchModel(gw1, "app").unavailable).toBe("no pre-deadline snapshot"));
  it("GW10 (live) fades nobody and shows no points", ...);
  it("vice is doubled when the captain has 0 minutes", () => { const r = structuredClone(gw9); r.players["411"].minutes = 0; expect(doubledId(r.you as any, r)).toBe(154); });
  it("partial scout eleven keeps its total off", () => { const r = structuredClone(gw9); (r.scout_xi as any).partial = true; expect(pitchModel(r, "scout").total).toBeNull(); expect(pitchModel(r, "scout").totalNote).toBe("partial"); });
  it("seasonRows: running totals count only gameweeks with both app and scout; GW1 not counted", ...);
  it("seasonSummary: projection error uses finished gameweeks with an app column", ...);
  it("verdictLabel and fmtGain", () => { expect(fmtGain(-13)).toBe("−13"); expect(verdictLabel(null, 3, false)).toMatch(/Open/); });
  ```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.

- [ ] **Step 5: Commit** `feat(monitor): pure view models for pitches, verdicts and season rows`.

---

### Task 4: Compact player card and coloured pitch

**Files:**
- Create: `src/components/monitor/MonitorPlayerCard.tsx`, `MonitorPlayerCard.test.tsx`, `MonitorPitch.tsx`, `MonitorPitch.test.tsx`

**Interfaces:**
- Consumes: `CardModel`, `PitchModel`, `Tone` (Task 3); `JerseyIcon` (`team`, `size="sm"`, `isCaptain`); `getRowGapClass` from `PitchVisualization`.
- Produces: `<MonitorPlayerCard card={CardModel} />`, `<MonitorPitch model={PitchModel} />`.
- Pinned: card width 58px (phones) / 72px (sm+), text 10px; points bold then `·` then xpts muted (`—` when null); `V` badge as in `PlayerCard`; `shared` = `ring-2 ring-[hsl(var(--monitor-app))]` on the name box; `faded` = `opacity-60`; `data-testid="monitor-card"` with `data-shared`/`data-faded`. Pitch: thin copy of `DraftPitch`'s shell with `--pitch`/`--pitch-dark` overridden inline from `--monitor-<tone>-turf(-dark)`, header with `h3` title coloured `hsl(var(--monitor-<tone>))`, a 26px bold total and the note under it, a 4px top border in the tone; `unavailable` renders the reason in the pitch area instead of rows; bench strip under the pitch when `bench.length > 0`, labelled "Bench".

- [ ] **Step 1: Write failing tests:** card shows `8 · 5.8`, shows `—` for null xpts, sets `data-shared`/`data-faded`; pitch renders 11 cards for GW9 app, renders the unavailable reason for GW1 app, renders a bench of 4 for you.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(monitor): compact card and coloured pitch`.

---

### Task 5: Gameweek bar, score chips, best-possible strip

**Files:**
- Create: `src/components/monitor/MonitorGwBar.tsx`, `MonitorGwBar.test.tsx`, `BestXiStrip.tsx`

**Interfaces:**
- Produces: `<MonitorGwBar gw entries={number[]} entryId onEntry onPrev onNext hasPrev hasNext state headline basis scoutPartial />` and `<BestXiStrip strip={ReturnType<typeof bestStrip>} />`.
- Pinned: state pill text "Before deadline" / "Live" / "Finished"; four chips in order App XI (pink), Scout (orange), You (blue), Best possible (muted), each `label value`, value `—` when null; a muted "captains doubled" / "no captains" note from `basis`; "partial" beside the Scout chip when `scoutPartial`; the entry selector is a `<select>` of the entry ids passed in (labelled by id; the page has no names). The best strip is one line: "Best possible XI in hindsight · 115" followed by the eleven names comma-separated, or the reason.

- [ ] **Step 1: Write failing tests:** chips render the four values; null shows `—`; partial note present; prev disabled when `hasPrev` false.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(monitor): gameweek bar, chips and best-possible strip`.

---

### Task 6: Transfers, buy lists, captain and wildcard cards

**Files:**
- Create: `src/components/monitor/TransfersCard.tsx`, `BuyListsCard.tsx`, `MonitorCaptainCard.tsx`, `MonitorWildcardCard.tsx`, one `monitorCards.test.tsx`

**Interfaces:**
- Consumes: `MonitorReport`, `playerOf`, `fmtGain`, `verdictLabel`.
- Produces: `<TransfersCard report />`, `<BuyListsCard report />`, `<MonitorCaptainCard report />`, `<MonitorWildcardCard report />`.
- Pinned content:
  - Transfers: two rows "App advised" / "You did", each listing moves as `Sell → Buy` (names), hits as `−4` when `hits > 0`, then three columns `1 GW`, `3 GW`, `5 GW` with `fmtGain(gain)` and a `·` suffix "n of w" when not complete; a verdict line `verdictLabel(verdict, verdict_window, complete of the verdict window)`; `chip_week` → "Chip week: no transfer contest"; a side unavailable → its reason in that row; `origin === "replay"` → a muted tag "rebuilt" with a tooltip of `replay.notes[0]`.
  - Buy lists: two columns "App buy list" / "Scout transfer radar", each the players with their price and 1/3/5 points, footer `avg` per window with one decimal; unavailable → reason; `needs_review` → amber "needs review".
  - Captain: five lines labelled App for you / Scout / You / Best in your squad / Best overall, each `name · points`; the Scout line adds "(inferred)" when `stated === false`; a null line shows "—".
  - Wildcard: window line "5 gameweeks from GW n"; rows: "Kept squad" (`points`, `played of window`), app presets with the headline preset first and bold, "Scout squad" (or its reason, e.g. "squad article needs review"), "You scored" from `actual`; verdict via `verdictLabel`; `absent_by_gw` non-empty → "could not field n player(s) in GW x" per gameweek; `no_projection_gws` → "no projection for GW x".

- [ ] **Step 1: Write failing tests** on GW9 (verdict open, moves named "Calafiori → Silva" and "Maguire → Van Hecke", +2 / +15), GW7 (chip week text, no verdict), GW1 (app unavailable reason; wildcard app reason), GW9 captain line "Haaland · 2 (inferred)", GW9 wildcard rows with "Balanced" first.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(monitor): transfers, buy-list, captain and wildcard cards`.

---

### Task 7: Season tab

**Files:**
- Create: `src/components/monitor/SeasonTable.tsx`, `SeasonSideCards.tsx`, `SeasonTable.test.tsx`

**Interfaces:**
- Consumes: `seasonRows`, `seasonSummary` (Task 3).
- Produces: `<SeasonTable rows={SeasonRowModel[]} onOpenGw={(gw) => void} />`, `<SeasonSideCards summary={ReturnType<typeof seasonSummary>} />`.
- Pinned: table columns GW · App XI · Scout · You · Best · Closer · App total · Scout total; `shadcn/ui/table`; a row is a `<button>`-like `<tr>` with `onClick` and `aria-label="Open gameweek n"`; not-counted rows show `—` in the running-total columns; a live row carries the state pill text "Live". Side cards: "Transfers: app n · you n · level n · open n", "Captain: hit n of m", "Wildcard: app n · kept n · level n · open n", "Projection error: mean +x.x, abs y.y over n gameweeks" (from stored `app_xi.projected` vs `points_no_captain`; the backend's `src/monitoring.py` is not reused, see spec 10).

- [ ] **Step 1: Write failing tests:** eight finished rows from a hand-built `SeasonRow[]` (GW1–GW10 reduced to `headline` + verdicts) render; clicking row GW9 calls `onOpenGw(9)`; running totals match 526/512 after GW9.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(monitor): season table and side cards`.

---

### Task 8: Page, route, owner gate, nav link

**Files:**
- Create: `src/pages/Monitor.tsx`, `src/pages/Monitor.test.tsx`
- Modify: `src/App.tsx` (lazy route `/app/monitor` inside `ProtectedRoute` + `Suspense`), `src/components/layout/Navbar.tsx` (`{ label: "Monitor", to: "/app/monitor", secondary: true }` rendered only when `useMonitorOwner().owner === true`), `src/components/layout/Navbar.test.tsx` (mock `@/hooks/useMonitorOwner`; one test each for owner true/false)

**Interfaces:**
- Consumes: everything above; `useMonitorOwner`, `supabaseMonitorRemote`, `Navbar`, `NotFound`, `shadcn/ui/tabs`, `useSearchParams`.
- Pinned behaviour:
  - Owner gate: `owner === null && loading` → the same centred spinner as `ProtectedRoute`; `error` → `QueryErrorCard` with retry; `owner === false` → `<NotFound />`; `owner === true` → the page.
  - Queries: `["monitor-season"]` → `listSeason()`; entries = distinct `entry_id` ascending; season = the rows' `season`; default entry = `?entry` if listed else the first; default gw = `?gw` if that entry has it else the entry's max gw; `["monitor-report", season, entry, gw]` → `loadReport`. URL is the state: `setSearchParams({ entry, gw, tab })`, replace.
  - Layout: `Navbar`; `pt-20 pb-8` container `max-w-6xl`; `Tabs` "Gameweek" (default) / "Season"; gameweek tab = `MonitorGwBar`, three `MonitorPitch` in `grid gap-4 lg:grid-cols-3` (stacked below lg), `BestXiStrip`, then `TransfersCard`, `MonitorCaptainCard`, `MonitorWildcardCard`, `BuyListsCard` in `grid gap-4 md:grid-cols-2`, then a muted `<details>` "How this was rebuilt" with `replay.notes` and the parity status; season tab = `SeasonTable` + `SeasonSideCards` at `lg:grid-cols-[1fr_320px]`; a row click sets `tab=gameweek&gw=n`.
  - Empty listing → "No reports yet. Run the backfill job." A report missing for a selected gw → "No report for GW n".
  - Page is `export default`; `App.tsx` imports it lazily like `Wildcard`.

- [ ] **Step 1: Write failing tests** (`Monitor.test.tsx`, jsdom, `MemoryRouter` at `/app/monitor?entry=107342&gw=9`, mock `@/hooks/useMonitorOwner` and inject a fake remote through a `remote` prop on `Monitor` defaulting to `supabaseMonitorRemote`; mock `@/components/layout/Navbar` to a stub): owner false → "404" text from `NotFound`; owner true → three pitches (`getAllByTestId("monitor-pitch")` length 3), chips 70/69/64/115; `?tab=season` → the table; clicking the GW9 row switches to the gameweek tab with `gw=9` in the URL.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** page, route, nav link, Navbar tests.
- [ ] **Step 4: Run** `npm test`, `npm run typecheck`, `npm run lint` — all green.
- [ ] **Step 5: Commit** `feat(monitor): /app/monitor page, owner gate and nav link`.

---

### Task 9: Docs, security review, pull request, preview check

**Files:**
- Modify: `CLAUDE.md` (Pages list: `/app/monitor`; a short "Monitor page (2026-11)" section: owner-only, reads `monitor_reports` under RLS, colours, where the data comes from; backend repo spec path)
- Modify: `BACKLOG.md` (entry names in the selector: the page shows ids because reports carry none; plan 3 live capture)

- [ ] **Step 1:** Write the docs. Commit `docs(monitor): page notes`.
- [ ] **Step 2:** Run the `security-review` skill on `git diff origin/main...HEAD`. Expected concerns to confirm absent: no service key, no owner/entry constants, no bare `fetch`, report text rendered as text (never `dangerouslySetInnerHTML`), the Scout `url` rendered as a link only when it starts with `https://www.premierleague.com/`.
- [ ] **Step 3:** Fresh-reviewer pass on the whole branch (`superpowers:requesting-code-review`); fix important findings with a failing test first.
- [ ] **Step 4:** Push, open the PR against `main` with the headline table, the verification commands and their output, the security-review findings, and the deferred list. Preview URL from the PR checks; open `/app/monitor` on it with the owner login and confirm GW9 shows 70 / 69 / 64 / 115 and GW1 shows "no pre-deadline snapshot". Report to the owner; the owner merges.
