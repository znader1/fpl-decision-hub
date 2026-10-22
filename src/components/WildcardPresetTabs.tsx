import type { WildcardPreset } from "@/lib/fplAssistantApi";
import type { WildcardDraftPreset } from "@/lib/wildcardDrafts";

interface Props {
  presets: WildcardDraftPreset[];
  selected: WildcardPreset;
  onSelect: (name: WildcardPreset) => void;
}

const fmt1 = (n: number | null | undefined) => (Math.round((n ?? 0) * 10) / 10).toFixed(1);

/** One tab per preset: name, horizon XI xPts, cost. The pitch below is the
 *  page's hero; this strip is the only chrome above it. */
export function WildcardPresetTabs({ presets, selected, onSelect }: Props) {
  return (
    <div role="tablist" className="grid grid-cols-3 gap-2">
      {presets.map((p) => {
        const active = p.name === selected;
        return (
          <button
            key={p.name}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(p.name)}
            className={`rounded-xl border px-3 py-2 text-left transition-colors ${
              active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <span className="block text-sm font-semibold">{p.label}</span>
            {p.ok ? (
              <span className="block text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{fmt1(p.xi_xpts_horizon)}</span> xPts · £{fmt1(p.squad_cost_m)}m
              </span>
            ) : (
              <span className="block text-xs text-muted-foreground">could not build</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
