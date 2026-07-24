// Dev-only squad-picker team-strength nudge grid. Lets the user hand-tune
// per-team attack/defense multipliers that feed the `team_nudges` build
// param (backend: src/squad_draft_xg.py `_nudges_to_discount`). Seeds from
// the knowledge file (GET /squad-picker/knowledge) and can persist edits
// back to it (POST /squad-picker/knowledge) via "Save to knowledge file".
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getKnowledge, saveKnowledge, type KnowledgeGrid, type TeamNudge } from "@/lib/squadPickerApi";

export type { TeamNudge };

interface TeamStrengthGridProps {
  onChange: (nudges: TeamNudge[]) => void;
}

interface Row {
  team_short: string;
  attack: number;
  defense: number;
  note?: string;
}

type SaveState = "idle" | "saving" | "saved" | "failed";

const DEFAULT = 1.0;

export const TeamStrengthGrid = ({ onChange }: TeamStrengthGridProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [newTeam, setNewTeam] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Seed from the knowledge file on mount.
  useEffect(() => {
    let cancelled = false;
    getKnowledge()
      .then((grid) => {
        if (cancelled) return;
        setAsOf(grid.as_of ?? null);
        const seeded = Object.entries(grid.teams ?? {})
          .filter(([key]) => !key.startsWith("_")) // "_..." keys are template placeholders
          .map(([team_short, v]) => ({
            team_short,
            attack: v?.attack ?? DEFAULT,
            defense: v?.defense ?? DEFAULT,
            note: v?.note,
          }));
        setRows(seeded);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Report only rows the user moved off 1.0/1.0 -- an untouched grid sends [].
  useEffect(() => {
    if (!loaded) return;
    const nudges: TeamNudge[] = rows
      .filter((r) => r.attack !== DEFAULT || r.defense !== DEFAULT)
      .map((r) => ({ team_short: r.team_short, attack: r.attack, defense: r.defense }));
    onChange(nudges);
  }, [rows, loaded, onChange]);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setSaveState("idle");
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    setSaveState("idle");
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addTeam = () => {
    const short = newTeam.trim().toUpperCase();
    if (!short || rows.some((r) => r.team_short === short)) {
      setNewTeam("");
      return;
    }
    setSaveState("idle");
    setRows((prev) => [...prev, { team_short: short, attack: DEFAULT, defense: DEFAULT }]);
    setNewTeam("");
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const teams: KnowledgeGrid["teams"] = {};
      for (const r of rows) {
        teams[r.team_short] = {
          attack: r.attack,
          defense: r.defense,
          ...(r.note ? { note: r.note } : {}),
        };
      }
      const saved = await saveKnowledge({
        as_of: asOf ?? new Date().toISOString().slice(0, 10),
        teams,
      });
      setAsOf(saved.as_of ?? asOf ?? null);
      setSaveState("saved");
    } catch {
      setSaveState("failed");
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Team-strength nudges
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </button>
      <p className="text-xs text-muted-foreground">
        Nudges apply to the xg / blend projection basis (not ppg).
      </p>

      {open && (
        <div className="space-y-3">
          {error && <p className="text-xs text-destructive">Knowledge fetch failed: {error}</p>}

          {rows.length > 0 && (
            <div className="grid grid-cols-[4.5rem_1fr_1fr_2rem] gap-2 items-center text-xs text-muted-foreground">
              <span>Team</span>
              <span>Attack</span>
              <span>Defense</span>
              <span />
            </div>
          )}
          {rows.map((r, i) => (
            <div key={r.team_short} className="grid grid-cols-[4.5rem_1fr_1fr_2rem] gap-2 items-center">
              <span className="text-sm font-medium">{r.team_short}</span>
              <Input
                type="number"
                step={0.01}
                min={0}
                value={r.attack}
                onChange={(e) => updateRow(i, { attack: Number(e.target.value) })}
              />
              <Input
                type="number"
                step={0.01}
                min={0}
                value={r.defense}
                onChange={(e) => updateRow(i, { defense: Number(e.target.value) })}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => removeRow(i)}
                aria-label={`Remove ${r.team_short}`}
              >
                ×
              </Button>
            </div>
          ))}

          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1 max-w-[10rem]">
              <Label className="text-xs">Add team (short name)</Label>
              <Input
                value={newTeam}
                placeholder="e.g. ARS"
                onChange={(e) => setNewTeam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTeam();
                }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={addTeam}>
              Add
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Button size="sm" onClick={handleSave} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Saving…" : "Save to knowledge file"}
            </Button>
            {saveState === "saved" && <span className="text-xs text-green-600">Saved</span>}
            {saveState === "failed" && <span className="text-xs text-destructive">Save failed</span>}
            {asOf && <span className="text-xs text-muted-foreground ml-auto">as_of: {asOf}</span>}
          </div>
        </div>
      )}
    </Card>
  );
};
