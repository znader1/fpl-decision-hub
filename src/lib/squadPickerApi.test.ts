import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSquad, squadPickerEnabled } from "./squadPickerApi";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("squadPickerApi", () => {
  it("squadPickerEnabled reflects VITE_SQUAD_PICKER", () => {
    vi.stubEnv("VITE_SQUAD_PICKER", "1");
    expect(squadPickerEnabled()).toBe(true);
    vi.stubEnv("VITE_SQUAD_PICKER", "");
    expect(squadPickerEnabled()).toBe(false);
  });

  it("buildSquad POSTs params to the base URL and returns JSON", async () => {
    vi.stubEnv("VITE_FPL_API_BASE_URL", "http://localhost:8009");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ ok: true, squad: [], starting_xi: [], bench: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = await buildSquad({ horizon_gws: 5, projection_basis: "ppg" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8009/squad-picker/build",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.ok).toBe(true);
  });

  it("buildSquad throws on non-ok HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({ detail: "boom" }),
    }));
    await expect(buildSquad({})).rejects.toThrow();
  });
});
