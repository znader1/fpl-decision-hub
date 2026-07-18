# FPL Decision Hub — Backlog

Use this file for quick capture and prioritization. If you want collaboration/history, create a GitHub Issue for an item and paste the link next to it.

## P0 — Bugs
- [x] **GW navigation can fail to load** — cause: `/squad` silently substitutes the nearest available GW's picks (200 OK, different `event_id`) when the requested GW's picks can't be fetched (deterministic for future GWs; transient for historical GWs on upstream hiccups), and Index.tsx's snap-back effect adopted that returned `event_id` into `squadGW` while `selectedGW` stayed put — desyncing GW nav from the rendered squad with no indication shown. Fixed frontend-side: GW state is never mutated from a response; a substitution now renders the returned squad with an explicit informational banner ("Showing your latest squad (GW X) — your GW Y picks aren't available yet."), and hard failures keep the retryable `QueryErrorCard`. Details + proposed backend patch in `.superpowers/sdd/task-7-report.md`.

## P1 — UX / Cleanup
- [x] **Remove debug UI** (Entry ID / Requested GW / Returned Event ID / Request URL boxes) or gate behind a `VITE_SHOW_DEBUG=true` flag.
- [x] **Remove “notes” from UI** (e.g., backend `transfers.note`) for production.

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

