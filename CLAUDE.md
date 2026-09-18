# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server on :8080
npm run build      # production build (also type-checks)
npm run lint       # ESLint
```

No test suite currently exists.

## Environment

Copy `.env.example` to `.env`. Required vars:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_FPL_API_BASE_URL=http://localhost:8000   # points to FastAPI backend
```

The Vite dev server proxies `/squad`, `/recommendations`, `/fixtures` to `VITE_FPL_API_BASE_URL` (see `vite.config.ts`), so relative URL templates work in dev without CORS issues. In production, `VITE_FPL_API_BASE_URL` must be set to the Fly.io backend URL.

## Architecture

**Stack:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, TanStack Query, Supabase auth, React Router.

**Backend:** Separate repo (`FPL/`) running FastAPI on Fly.io. This frontend is purely a consumer — no data processing happens here.

### Request flow

```
Index.tsx (state + TanStack Query)
  → src/lib/fplAssistantApi.ts  (typed fetch wrappers + URL resolution)
  → FastAPI backend (/squad, /recommendations, /explain, /league/*)
```

`fplAssistantApi.ts` is the single API layer. All types (`FplSquad`, `FplTeamRecommendation`, `LeagueStrategyResponse`, etc.) live there. URL templates are read from env vars and interpolated at call time — never hardcode backend URLs in components.

### Auth

Supabase handles auth. `AuthContext` (`src/contexts/AuthContext.tsx`) exposes `session`, `user`, `loading`, `signOut` via `useAuth()`. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) redirects unauthenticated users to `/login`. Both `/app` and `/app/league` are wrapped with `ProtectedRoute` in `App.tsx`.

### Pages

- `/` — Landing
- `/auth` — Login/signup (Supabase)
- `/app` — Main squad + recommendations (desktop-first layout, not yet mobile-optimised)
- `/app/league` — Mini-league strategy (mobile-friendly)

### Key components

- `src/pages/Index.tsx` — owns all state (entryId, GW, chip strategy, applied transfers). Orchestrates TanStack Query for squad, fixtures, next event, and recommendations.
- `src/lib/fplAssistantApi.ts` — all API types and fetch functions. Add new endpoints here.
- `src/components/RecommendationsPanel.tsx` — tabbed panel (summary / transfers / watchlist) + `ExplanationPanel` (Phase 1 LLM rationale, lazy-loads on expand).
- `src/components/ExplanationPanel.tsx` — calls `POST /explain` on first open, caches in component state.
- `src/pages/League.tsx` — calls `GET /league/list` then `POST /league/strategy` with chase/defend/differential mode.
- `src/components/ParameterSidebar.tsx` — collapsible icon sidebar + expanded panel for entry ID, GW, chip, transfer controls.

### GW selection and flash prevention

`selectedGW` and `squadGW` are typed `number | null`. `getInitialGw()` returns `null` on first load — **do not default to `SAMPLE_SQUAD.event_id`**, that causes a flash of old squad data. All squad/fixtures queries are disabled while `selectedGW === null`. A `useEffect` sets the live GW (`nextEventId - 1`) once `nextEventQuery` resolves — this is the "open on live scores" behaviour. The entire pitch is gated behind `gwResolved = selectedGW !== null`.

### Tab names

The recommendation tab on `PitchVisualization.tsx` is labelled **"ZN Pick"** (not "AI Pick").

### Chips tab (2026-09)

`RecommendationsPanel` has a fourth "Chips" tab: `ChipRoadmapPanel.tsx` renders `GET /chips/plan` (season chip recommendations with EV curves, provisional structural windows, expiry/hold/used states); `ChipNudgeCard.tsx` mounts above the pitch when the plan returns a next-GW nudge and applies via the existing `chipStrategy` state. Since 2026-09-17 the panel opens with a **Fixture context** strip built from `plan.calendar` (one cell per model-zone GW: deadline, `break`/`DGW`/`BGW`/`cup`/`N in UCL` tags with hover detail; notable later weeks behind a `<details>`), TC/BB rows show the chip's extra-points `distribution` (`NN% beats bar` pill, P(return)/P(haul)/P(blank), modal + 80% band), EV-curve bars are shaded by `p_beats_bar`, `Risk:` reasons render amber, and provisional rows with `likelihood < 1` badge `~70% likely` (expected cup-clash blank) instead of `provisional`. A held Free Hit row whose backend sent `stress` shows the reading (`GW5 · stress 3.3/4.0`) in place of "no window", so the collapsed row says how close the squad came to the gate instead of nothing; the expanded `guidance` names the players behind it. `plan.signals.european_calendar === false` shows a "European calendar not configured" hint — the backend's `data/models/european_calendar.json` team map is empty until filled in. Since 2026-09-17 each outlook/recommendation row also carries an optional `guidance` string (plain-language "why hold"/"why play" with a season prior); when present it renders first, above everything else, and the outlook row's engine `reasons` move behind a `<details>` labelled `model detail` — an older backend without `guidance` still gets today's layout. All these fields are optional so an older backend still renders. Chip vocabulary is canonical everywhere (`wildcard | free_hit | bench_boost | triple_captain`) — the backend normalizes FPL's names; the frontend NEVER maps chip names. `FplChipStrategy` includes `bench_boost`/`triple_captain`; only wildcard/free_hit are squad-rebuilding (guards in `Index.tsx` keep that semantics — don't widen them).

### Transfer Planner panel (one voice, 2026-09-16 density cut)

The **DecisionCard** (`src/components/DecisionCard.tsx`) is the only advice: it renders `transfer_plan_horizon.verdict_detail` — the action, `+x this GW · +y over GWa–b`, the plan-vs-roll nets, ITB after, and the only Apply/Undo controls (Apply = `onApplyTransferAtIndex(k-1)`, since the plan's moves lead `transfers.moves` server-side with `in_plan: true`). Every GW range renders inside a `whitespace-nowrap` span so it never wraps mid-string at phone width. Below the nets/Apply row, a `runner-ups` block (present when `verdict_detail.runner_ups` is non-empty) shows the best swap for every other squad player — "Also considered" on spend, "Best available — all below the bar" on roll — numbered from 2 on spend / 1 on roll, first 3 rows visible then a `show N more` `<details>`; rows below the positional bar carry a muted "below bar" tag.
The legacy `reasoning` banner renders only when `verdict_detail` is absent (older backend).
The staircase (`HorizonTransferPlan`) now collapses entirely behind one closed `<details>` — summary `Plan GWa–b · N moves · net +x` (` · N hits` when hits > 0) — so the tab isn't dense with every GW visible; all rows (including later GWs) render inside it, no nested "show the rest" any more. Plan moves may carry `h2h_conflicts` → amber "faces your X" badge. A "Prioritise removing injured players" switch in `ParameterForm.tsx` (default on, persisted `fpl_prioritize_injured`) sends `prioritize_injured` to `/recommendations`; when a move's seller carries availability risk, `sell_availability` renders as an amber fitness chip (`{chance}% fit` or the status word) after the seller in `MoveLine`/`RunnerUpRow`.
**`TransferPlanner.tsx` is now a shell** (title + `planSlot` + loading/empty states only) — the beam engine's own Alternatives list is gone from the UI entirely (it still feeds Apply indexing server-side, just isn't displayed). Hot Targets moved off this tab onto Watchlist: `src/components/HotTargets.tsx` (extracted, same rendering) renders under a "Hot targets" heading in `WatchlistTab`, fed by `recommendation.transfers?.hot_by_position`.

### Vercel preview CORS (recurring)

Every new branch's preview origin must be appended to `FPL_API_CORS_ORIGINS` on BOTH Fly apps (read current value via `fly ssh console -a <app> -C "printenv FPL_API_CORS_ORIGINS"` first — `fly secrets set` replaces the whole list). Permanent fix (backlogged): `allow_origin_regex` in backend `api/main.py`.

### League page

`League.tsx` uses `pt-20 pb-8` (not `py-8`) to clear the fixed navbar height of `h-14`.

### PlayerCard fixture chip

The fixture chip (`fixtureShort`) renders on its **own line** between the player name and points — not inline with the team abbreviation. See `PlayerCard.tsx`.

### Deployment

Vercel auto-deploys on push to `main`. `vercel.json` rewrites all paths to `index.html` for SPA routing. Set `VITE_FPL_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.

For feature branch testing, create a Vercel preview environment variable pointing `VITE_FPL_API_BASE_URL` at `fpl-assistant-api-dev.fly.dev`.

### Backend endpoints consumed

| Endpoint | Used by |
|---|---|
| `GET /squad` | Index.tsx squad fetch |
| `GET /recommendations` | Index.tsx recommendation mutation |
| `GET /events/next` | Index.tsx next event |
| `POST /explain` | ExplanationPanel |
| `GET /league/list` | League.tsx |
| `POST /league/strategy` | League.tsx |
| `GET /chips/plan` | Index.tsx chip plan query (Chips tab + nudge card) |
| `POST /chat`, `POST /chat/{captain,transfer,chip}` | AiAdvisorPanel |
