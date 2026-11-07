import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseMonitorRemote, type MonitorRemote } from "@/lib/monitorRemote";

export interface MonitorOwnerState {
  /** true = owner, false = not an owner, null = not known yet (loading, signed out, or error). */
  owner: boolean | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Whether the signed-in user may open /app/monitor. The database is the real
 * gate (RLS on the monitor tables); this only decides what to render. A
 * network error leaves `owner` null so the owner is never shown a 404 for a
 * flaky request.
 */
export function useMonitorOwner(remote: MonitorRemote = supabaseMonitorRemote): MonitorOwnerState {
  const { user } = useAuth();
  const userId = user?.id;
  const query = useQuery({
    queryKey: ["monitor-owner", userId],
    queryFn: () => remote.isOwner(userId as string),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
  return {
    owner: query.data ?? null,
    loading: !!userId && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
