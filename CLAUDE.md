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

`RecommendationsPanel` has a fourth "Chips" tab: `ChipRoadmapPanel.tsx` renders `GET /chips/plan` (season chip recommendations with EV curves, provisional structural windows, expiry/hold/used states); `ChipNudgeCard.tsx` mounts above the pitch when the plan returns a next-GW nudge and applies via the existing `chipStrategy` state. Chip vocabulary is canonical everywhere (`wildcard | free_hit | bench_boost | triple_captain`) — the backend normalizes FPL's names; the frontend NEVER maps chip names. `FplChipStrategy` includes `bench_boost`/`triple_captain`; only wildcard/free_hit are squad-rebuilding (guards in `Index.tsx` keep that semantics — don't widen them).

### Transfer Planner panel (one voice)

The multi-GW plan verdict is the only advice: MAKE THE MOVE + this week's row render first; later GWs fold behind "Show the rest of the plan"; the beam-search cards are ALWAYS collapsed under "Other this-week options — not the recommendation" (they read as advice no matter the label). Plan moves may carry `h2h_conflicts` → amber "faces your X" badge. The ITB badge means remainder AFTER the suggested moves.

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
