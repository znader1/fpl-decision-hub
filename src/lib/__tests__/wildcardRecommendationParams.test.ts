import { describe, expect, it } from "vitest";
import { interpolateTeamRecommendationUrl } from "@/lib/fplAssistantApi";

describe("wildcard params on the recommendations url", () => {
  it("serialises preset, pins and bans as query params", () => {
    const url = interpolateTeamRecommendationUrl("/recommendations?entry_id={entry_id}", {
      entryId: 1, eventId: 8, horizonGws: 5, chipStrategy: "wildcard",
      wildcardPreset: "gems", pinnedIds: [5, 9], excludedIds: [2],
    });
    expect(url).toContain("wildcard_preset=gems");
    expect(url).toContain("pinned_ids=5%2C9");
    expect(url).toContain("excluded_ids=2");
  });
});
