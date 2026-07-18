import { useCallback, useEffect, useState } from "react";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("entry_id, plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Profile load failure must never block the app — fall back to defaults.
          setProfile({ entryId: null, plan: "free" });
        } else {
          setProfile({
            entryId: typeof data?.entry_id === "number" ? data.entry_id : null,
            plan: isPlanTier(data?.plan) ? data.plan : "free",
          });
        }
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveEntryId = useCallback(
    async (entryId: number) => {
      setProfile((prev) =>
        prev ? { ...prev, entryId } : { entryId, plan: "free" }
      );
      if (!user) return;
      // Never write `plan` from the client.
      await supabase
        .from("profiles")
        .upsert({ id: user.id, entry_id: entryId, updated_at: new Date().toISOString() });
    },
    [user]
  );

  return { profile, profileLoading, saveEntryId };
}
