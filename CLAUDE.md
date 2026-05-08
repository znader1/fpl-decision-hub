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

### Deployment

Vercel auto-deploys on push to `main`. `vercel.json` rewrites all paths to `index.html` for SPA routing. Set `VITE_FPL_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.

### Backend endpoints consumed

| Endpoint | Used by |
|---|---|
| `GET /squad` | Index.tsx squad fetch |
| `GET /recommendations` | Index.tsx recommendation mutation |
| `GET /events/next` | Index.tsx next event |
| `POST /explain` | ExplanationPanel |
| `GET /league/list` | League.tsx |
| `POST /league/strategy` | League.tsx |
