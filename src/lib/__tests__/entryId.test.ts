import { describe, expect, it } from "vitest";
import { parseEntryIdInput } from "../entryId";

describe("parseEntryIdInput", () => {
  it("parses plain digits", () => {
    expect(parseEntryIdInput("588004")).toBe(588004);
  });
  it("parses digits with surrounding whitespace", () => {
    expect(parseEntryIdInput("  588004  ")).toBe(588004);
  });
  it("parses a pasted FPL URL", () => {
    expect(
      parseEntryIdInput("https://fantasy.premierleague.com/entry/588004/event/38")
    ).toBe(588004);
  });
  it("parses an entry URL without event suffix", () => {
    expect(parseEntryIdInput("fantasy.premierleague.com/entry/12345/")).toBe(12345);
  });
  it("rejects garbage", () => {
    expect(parseEntryIdInput("my team")).toBeNull();
  });
  it("rejects zero and negatives", () => {
    expect(parseEntryIdInput("0")).toBeNull();
    expect(parseEntryIdInput("-5")).toBeNull();
  });
  it("rejects empty", () => {
    expect(parseEntryIdInput("")).toBeNull();
  });
  it("rejects decimals", () => {
    expect(parseEntryIdInput("58.4")).toBeNull();
  });
});
