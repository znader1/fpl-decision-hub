import { describe, expect, it } from "vitest";
import { bankMFromEntryHistory } from "@/lib/entryBank";

describe("bankMFromEntryHistory", () => {
  it("converts FPL's tenths to £m", () => {
    expect(bankMFromEntryHistory({ bank: 4 })).toBe(0.4);
    expect(bankMFromEntryHistory({ bank: 23 })).toBe(2.3);
    expect(bankMFromEntryHistory({ bank: 0 })).toBe(0);
  });
  it("returns null when absent", () => {
    expect(bankMFromEntryHistory(undefined)).toBeNull();
    expect(bankMFromEntryHistory({})).toBeNull();
    expect(bankMFromEntryHistory({ bank: null })).toBeNull();
  });
});
