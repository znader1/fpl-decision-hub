import type { CSSProperties } from "react";
import { getRowGapClass } from "@/components/PitchVisualization";
import { MonitorPlayerCard } from "./MonitorPlayerCard";
import type { PitchModel, Tone } from "@/lib/monitorView";

/** The column's own turf and accent, read from the tokens in index.css. */
const toneStyle = (tone: Tone): CSSProperties =>
  ({
    "--pitch": `var(--monitor-${tone}-turf)`,
    "--pitch-dark": `var(--monitor-${tone}-turf-dark)`,
    "--tone": `var(--monitor-${tone})`,
  }) as CSSProperties;

/**
 * One coloured pitch (thin copy of DraftPitch's shell): header with the title,
 * subtitle and the report's total, formation rows of compact cards, and the
 * bench strip when the model has one. Unavailable columns show their reason
 * where the players would be.
 */
export function MonitorPitch({ model }: { model: PitchModel }) {
  return (
    <section
      data-testid="monitor-pitch"
      data-tone={model.tone}
      style={toneStyle(model.tone)}
      className="rounded-2xl border border-border bg-card p-2 sm:p-3"
    >
      <div className="mb-2 h-1 rounded-full" style={{ background: "hsl(var(--tone))" }} />
      <header className="mb-2 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight" style={{ color: "hsl(var(--tone))" }}>
            {model.title}
          </h3>
          {model.subtitle && <p className="truncate text-[11px] text-muted-foreground">{model.subtitle}</p>}
        </div>
        <div className="shrink-0 text-right leading-none">
          <b data-testid="pitch-total" className="text-2xl font-extrabold tabular-nums" style={{ color: "hsl(var(--tone))" }}>
            {model.total ?? "—"}
          </b>
          {model.totalAlt && <span className="mt-0.5 block text-[10px] text-muted-foreground">{model.totalAlt}</span>}
          {model.totalNote && <span className="mt-0.5 block text-[10px] text-muted-foreground">{model.totalNote}</span>}
        </div>
      </header>

      <div
        className="relative overflow-hidden rounded-xl p-2 sm:p-3"
        style={{
          background: `linear-gradient(180deg,
            hsl(var(--pitch)) 0%,
            hsl(var(--pitch-dark)) 25%,
            hsl(var(--pitch)) 25.5%,
            hsl(var(--pitch-dark)) 50%,
            hsl(var(--pitch)) 50.5%,
            hsl(var(--pitch-dark)) 75%,
            hsl(var(--pitch)) 75.5%,
            hsl(var(--pitch-dark)) 100%)`,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-20"
          style={{ width: "90px", height: "90px", borderColor: "hsl(0 0% 100%)" }}
        />
        <div className="absolute left-0 right-0 top-1/2 h-[2px] opacity-15" style={{ background: "hsl(0 0% 100%)" }} />

        {model.unavailable ? (
          <p className="relative z-10 py-10 text-center text-sm text-white/85">{model.unavailable}</p>
        ) : (
          model.rows.map((row, i) => (
            <div
              key={i}
              className={`relative z-10 flex justify-center ${getRowGapClass(row.length)} ${
                i < model.rows.length - 1 ? "mb-6 sm:mb-8" : ""
              }`}
            >
              {row.map((c) => (
                <MonitorPlayerCard key={c.id} card={c} />
              ))}
            </div>
          ))
        )}
      </div>

      {model.bench.length > 0 && (
        <div className="mt-2 rounded-xl border border-border bg-background/60 p-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bench</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {model.bench.map((c) => (
              <MonitorPlayerCard key={c.id} card={c} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
