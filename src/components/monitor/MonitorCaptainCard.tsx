import { playerOf, type CaptainLine, type MonitorReport } from "@/lib/monitorReport";
import { MonitorCardShell } from "./MonitorCardShell";

const LINES: { key: keyof MonitorReport["captain"]; label: string }[] = [
  { key: "app_for_you", label: "App for you" },
  { key: "scout", label: "Scout" },
  { key: "you", label: "You" },
  { key: "best_in_squad", label: "Best in your squad" },
  { key: "best_overall", label: "Best overall" },
];

const lineText = (line: CaptainLine, report: MonitorReport): string => {
  if (!line) return "—";
  const name = playerOf(report, line.id).name;
  const pts = typeof line.points === "number" ? String(line.points) : "—";
  return `${name} · ${pts}${line.stated === false ? " (inferred)" : ""}`;
};

/** Who each side would have captained, and who it should have been. */
export function MonitorCaptainCard({ report }: { report: MonitorReport }) {
  return (
    <MonitorCardShell title="Captain" subtitle="points of the named player, not doubled" testId="captain-card">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {LINES.map(({ key, label }) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd data-testid={`captain-${key}`} className="font-medium">
              {lineText(report.captain[key], report)}
            </dd>
          </div>
        ))}
      </dl>
    </MonitorCardShell>
  );
}
