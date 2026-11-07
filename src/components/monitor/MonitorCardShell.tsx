import type { ReactNode } from "react";

/** The common frame of the verdict cards under the pitches. */
export function MonitorCardShell({
  title,
  subtitle,
  testId,
  children,
}: {
  title: string;
  subtitle?: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId} className="rounded-xl border border-border bg-card p-3 text-xs sm:p-4">
      <header className="mb-2">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
