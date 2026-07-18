export const ENTRY_ID_STORAGE_KEY = "fpl_entry_id";

/**
 * Parse raw user input into an FPL entry ID.
 * Accepts plain digits ("588004") or a pasted FPL URL
 * ("https://fantasy.premierleague.com/entry/588004/event/38").
 * Returns null when no valid positive integer ID can be extracted.
 */
export const parseEntryIdInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/entry\/(\d+)/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;
  if (!/^\d+$/.test(candidate)) return null;

  const id = Number(candidate);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
