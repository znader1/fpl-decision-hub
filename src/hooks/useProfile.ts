import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "free" | "pro" | "elite";

export interface Profile {
  entryId: number | null;
  plan: PlanTier;
}

const isPlanTier = (value: unknown): value is PlanTier =>
  value === "free" || value === "pro" || value === "elite";

/**
 * Loads the signed-in user's profile (FPL entry ID + plan tier) and exposes
 * a saver for the entry ID. Plan is read-only on the client.
 */
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // Bumped on every saveEntryId call so an in-flight initial load can't
  // clobber a write that landed while the GET was pending.
  const writeVersion = useRef(0);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    const versionAtFetch = writeVersion.current;
    supabase
      .from("profiles")
      .select("entry_id, plan")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (writeVersion.current === versionAtFetch) {
          if (error) {
            // Profile load failure must never block the app — fall back to defaults.
            setProfile({ entryId: null, plan: "free" });
          } else {
            setProfile({
              entryId: typeof data?.entry_id === "number" ? data.entry_id : null,
              plan: isPlanTier(data?.plan) ? data.plan : "free",
            });
          }
        }
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const saveEntryId = useCallback(
    async (entryId: number): Promise<boolean> => {
      writeVersion.current += 1;
      const previous = profile;
      setProfile(
        previous ? { ...previous, entryId } : { entryId, plan: "free" }
      );
      // Signed-out: localStorage remains the primary store; profile is
      // cross-device sync only, so the local-only update counts as success.
      if (!userId) return true;
      // Never write `plan` from the client.
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, entry_id: entryId, updated_at: new Date().toISOString() });
      if (error) {
        // Revert the optimistic update so the UI reflects reality.
        setProfile(previous);
        return false;
      }
      return true;
    },
    [userId, profile]
  );

  return { profile, profileLoading, saveEntryId };
}
