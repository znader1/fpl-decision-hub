/** FPL's `entry_history.bank` is in tenths of £m (4 → £0.4m). */
export function bankMFromEntryHistory(eh: { bank?: number | null } | undefined | null): number | null {
  const raw = eh?.bank;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return Math.round(raw) / 10;
}
