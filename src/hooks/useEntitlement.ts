import { useMemo } from "react";
import { computeEntitlements, type Entitlements } from "@/lib/entitlements";
import { useProfile } from "@/hooks/useProfile";

export function useEntitlement(): Entitlements {
  const { profile } = useProfile();
  return useMemo(
    () => computeEntitlements(profile?.plan ?? "free"),
    [profile?.plan]
  );
}
