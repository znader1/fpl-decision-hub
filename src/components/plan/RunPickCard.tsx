import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RunPickCardProps {
  /** Copy when nothing has been asked yet. */
  idle: string;
  /** Copy while ZN Pick is working. */
  working: string;
  loading: boolean;
  error: string | undefined;
  /** Omitted when the step has its own run controls (Transfers' horizon
   *  buttons); the card then shows only a "Try again" after an error. */
  onRun?: () => void;
}

/** A step without ZN Pick's answer: never a dead end. Steps don't run on
 *  entry (user testing, 2026-11); this card, or the step's own controls, is
 *  how the user asks, and asks again after a failed run (Fly cold start). */
export function RunPickCard({ idle, working, loading, error, onRun }: RunPickCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {working}
        </span>
      ) : (
        <>
          {error ? (
            <span role="alert" className="max-w-md break-words text-destructive">
              {error}
            </span>
          ) : (
            <span>{idle}</span>
          )}
          {onRun && (
            <Button type="button" size="sm" onClick={onRun}>
              <Zap className="h-3.5 w-3.5" />
              {error ? "Try again" : "Run ZN Pick"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
