# FPL Decision Hub — Backlog

Use this file for quick capture and prioritization. If you want collaboration/history, create a GitHub Issue for an item and paste the link next to it.

## P0 — Bugs
- [x] **GW navigation can fail to load** — cause: `/squad` can silently substitute a different GW's picks (200 OK) when the backend can't fetch the requested historical `event_id` from upstream FPL, and Index.tsx's snap-back effect blindly adopted that returned `event_id` into `squadGW` while `selectedGW` stayed put, desyncing the two and rendering a mismatched squad with no error shown. Fixed frontend-side: mismatches now render an explicit `QueryErrorCard` (with retry) instead of silently swapping state; backend fallback-without-error behavior documented in `.superpowers/sdd/task-7-report.md` for a future backend-side fix.

## P1 — UX / Cleanup
- [ ] **Remove debug UI** (Entry ID / Requested GW / Returned Event ID / Request URL boxes) or gate behind a `VITE_SHOW_DEBUG=true` flag.
- [ ] **Remove “notes” from UI** (e.g., backend `transfers.note`) for production.

## P2 — UI Polish
- [ ] **Pitch background colors**: make it more FPL-like (palette + lines + subtle texture).

## P1/P2 — Features (Backend-driven)
- [ ] **Multiple transfer suggestions** (group by position; show `score_gain`; show remaining ITB).
- [ ] **Constraint warning**: ensure no more than 3 players from the same team (ideally enforced in backend; also show a UI warning if violated).
- [ ] **Captain recommendations**: show captain/vice ordering/rationale from backend.
- [ ] **Bench order**: render bench priority from backend (and show suggested order vs current, if applicable).

## API Contract (Checklist)
- [ ] Confirm `include_transfers` query param name and behavior.
- [ ] Add a “current GW” source (backend endpoint or bootstrap cache) so the default GW doesn’t depend on sample data / localStorage.

