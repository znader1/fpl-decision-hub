# FPL Decision Hub — Backlog

Use this file for quick capture and prioritization. If you want collaboration/history, create a GitHub Issue for an item and paste the link next to it.

## P0 — Bugs
- [ ] **GW navigation can fail to load** (repro: select an earlier GW; confirm which endpoint errors and why).

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

