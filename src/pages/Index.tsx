import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ParameterSidebar } from "@/components/ParameterSidebar";
import { MobileParameterDrawer } from "@/components/MobileParameterDrawer";
import { PitchVisualization } from "@/components/PitchVisualization";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { Navbar } from "@/components/layout/Navbar";
import { parseEntryIdInput } from "@/lib/entryId";
import { useProfile } from "@/hooks/useProfile";
import { useIsDesktop } from "@/hooks/use-desktop";
import {
  fetchFixtures,
  fetchNextEvent,
  fetchSquad,
  fetchTeamRecommendation,
  getNextEventUrlTemplate,
  getRecommendationUrlTemplate,
  getFixturesUrlTemplate,
  getSquadUrlTemplate,
  SAMPLE_SQUAD,
  type FplNextEventSummary,
  type FplChipStrategy,
  type FplSquad,
  type FplTeamFixture,
  type FplTeamRecommendation,
  type TeamRecommendationParams,
} from "@/lib/fplAssistantApi";

type PitchMode = "squad" | "recommendation";

const clampGw = (gw: number) => Math.min(38, Math.max(1, gw));
const hasExplicitGwQuery = () => {
  const query = new URLSearchParams(window.location.search);
  return query.has("gw") || query.has("squad_gw");
};

const getInitialGw = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("gw"));
  if (Number.isFinite(fromQuery) && fromQuery >= 1 && fromQuery <= 38) return clampGw(fromQuery);

  const fromStorage = Number(localStorage.getItem("fpl_selected_gw"));
  if (Number.isFinite(fromStorage) && fromStorage >= 1 && fromStorage <= 38) return clampGw(fromStorage);

  // No stored GW — return null so we wait for the next-event API before rendering
  return null;
};

const getInitialSquadGw = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("squad_gw"));
  if (Number.isFinite(fromQuery) && fromQuery >= 1 && fromQuery <= 38) return clampGw(fromQuery);

  const fromStorage = Number(localStorage.getItem("fpl_squad_gw"));
  if (Number.isFinite(fromStorage) && fromStorage >= 1 && fromStorage <= 38) return clampGw(fromStorage);

  return getInitialGw();
};

const getInitialEntryId = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("entry_id"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

  const fromStorage = Number(localStorage.getItem("fpl_entry_id"));
  if (Number.isFinite(fromStorage) && fromStorage > 0) return fromStorage;

  // No stored ID — 0 triggers the onboarding overlay in PitchVisualization.
  return 0;
};

const getInitialHorizon = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("horizon_gws"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

  const fromStorage = Number(localStorage.getItem("fpl_horizon_gws"));
  if (Number.isFinite(fromStorage) && fromStorage > 0) return fromStorage;

  return 3;
};

const getInitialChipStrategy = (): FplChipStrategy => {
  const query = new URLSearchParams(window.location.search);
  const fromQuery = query.get("chip_strategy") ?? query.get("strategy");
  if (fromQuery === "wildcard" || fromQuery === "free_hit" || fromQuery === "none") return fromQuery;

  const fromStorage = localStorage.getItem("fpl_chip_strategy") ?? localStorage.getItem("fpl_transfer_strategy");
  if (fromStorage === "wildcard" || fromStorage === "free_hit" || fromStorage === "none") return fromStorage;
  return "none";
};

const getInitialChipPlayEventId = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("chip_play_event_id"));
  if (Number.isFinite(fromQuery) && fromQuery >= 1 && fromQuery <= 38) return clampGw(fromQuery);

  const fromStorage = Number(localStorage.getItem("fpl_chip_play_event_id"));
  if (Number.isFinite(fromStorage) && fromStorage >= 1 && fromStorage <= 38) return clampGw(fromStorage);

  return undefined;
};

const getInitialIncludeTransfers = () => {
  const fromQuery = new URLSearchParams(window.location.search).get("include_transfers");
  if (fromQuery === "true") return true;
  if (fromQuery === "false") return false;

  const fromStorage = localStorage.getItem("fpl_include_transfers");
  if (fromStorage === "true") return true;
  if (fromStorage === "false") return false;

  return true;
};

const getInitialApplyTransferCount = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("apply_transfer_count"));
  if (Number.isFinite(fromQuery) && fromQuery >= 0) return Math.max(0, Math.floor(fromQuery));

  const fromStorage = Number(localStorage.getItem("fpl_apply_transfer_count"));
  if (Number.isFinite(fromStorage) && fromStorage >= 0) return Math.max(0, Math.floor(fromStorage));

  return 0;
};

const Index = () => {
  const [entryId, setEntryId] = useState(getInitialEntryId);
  const [selectedGW, setSelectedGW] = useState<number | null>(getInitialGw);
  const [squadGW, setSquadGW] = useState<number | null>(getInitialSquadGw);
  const [horizonGws, setHorizonGws] = useState(getInitialHorizon);
  const [chipStrategy, setChipStrategy] = useState<FplChipStrategy>(getInitialChipStrategy);
  const [chipPlayEventId, setChipPlayEventId] = useState<number | undefined>(getInitialChipPlayEventId);
  const [includeTransfers, setIncludeTransfers] = useState(getInitialIncludeTransfers);
  const [appliedTransferCount, setAppliedTransferCount] = useState(getInitialApplyTransferCount);
  const [pitchMode, setPitchMode] = useState<PitchMode>("squad");
  const [didApplyNextGwDefault, setDidApplyNextGwDefault] = useState(hasExplicitGwQuery);

  const { profile, saveEntryId } = useProfile();
  const isDesktop = useIsDesktop();

  // Cross-device hydration: profile beats "nothing", localStorage beats profile.
  useEffect(() => {
    if (entryId > 0) return;
    if (profile?.entryId && profile.entryId > 0) {
      setEntryId(profile.entryId);
    }
  }, [entryId, profile?.entryId]);

  const nextEventTemplate = getNextEventUrlTemplate();
  const squadTemplate = getSquadUrlTemplate();
  const fixturesTemplate = getFixturesUrlTemplate();
  const recommendationTemplate = getRecommendationUrlTemplate();

  const canFetchNextEvent = Boolean(nextEventTemplate);
  const canFetchSquad = Boolean(squadTemplate);
  const canFetchFixtures = Boolean(fixturesTemplate);
  const canRecommend = Boolean(recommendationTemplate);
  const canChangeGw = true;
  const effectiveHorizonGws = chipStrategy === "free_hit" ? 1 : horizonGws;

  const nextEventQuery = useQuery<FplNextEventSummary>({
    queryKey: ["next-event"],
    queryFn: ({ signal }) => fetchNextEvent(signal),
    enabled: canFetchNextEvent && (canFetchSquad || canRecommend || canFetchFixtures),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const squadQuery = useQuery<FplSquad>({
    queryKey: ["squad", entryId, squadGW],
    queryFn: ({ signal }) => fetchSquad({ entryId, eventId: squadGW! }, signal),
    enabled: canFetchSquad && Number.isFinite(entryId) && entryId > 0 && squadGW !== null,
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const fixturesQuery = useQuery<FplTeamFixture[]>({
    queryKey: ["fixtures", selectedGW],
    queryFn: ({ signal }) => fetchFixtures({ eventId: selectedGW! }, signal),
    enabled: canFetchFixtures && selectedGW !== null && selectedGW >= 1 && selectedGW <= 38,
    retry: false,
  });

  const fixturesByTeam = useMemo(() => {
    const mapping: Record<string, FplTeamFixture[]> = {};
    for (const fixture of fixturesQuery.data ?? []) {
      const teamShort = fixture.team_short;
      if (!mapping[teamShort]) mapping[teamShort] = [];
      mapping[teamShort].push(fixture);
    }
    return mapping;
  }, [fixturesQuery.data]);

  const buildRecommendationParams = (
    eventId: number,
    overrides?: { chipPlayEventId?: number }
  ): TeamRecommendationParams => {
    const wildcardPlayEventId =
      chipStrategy === "wildcard"
        ? overrides?.chipPlayEventId ??
          chipPlayEventId ??
          recommendationMutation.data?.chip_strategy?.play_event_id ??
          eventId
        : undefined;

    return {
      entryId,
      eventId,
      horizonGws: effectiveHorizonGws,
      chipStrategy,
      chipHorizonGws: chipStrategy === "wildcard" ? horizonGws : undefined,
      chipPlayEventId: wildcardPlayEventId,
      strategy: chipStrategy,
      includeTransfers,
      applyTransferCount: 0,
    };
  };

  const recommendationMutation = useMutation<FplTeamRecommendation, unknown, TeamRecommendationParams>({
    mutationFn: async (params) => fetchTeamRecommendation(params),
    onSuccess: (data) => {
      if (data.chip_strategy?.selected === "wildcard" && typeof data.chip_strategy.play_event_id === "number") {
        setChipPlayEventId(data.chip_strategy.play_event_id);
      }
      setPitchMode("recommendation");
    },
  });

  useEffect(() => {
    if (didApplyNextGwDefault) return;
    if (!nextEventQuery.isFetched) return;

    const nextGw = nextEventQuery.data?.event_id;
    if (Number.isFinite(nextGw) && nextGw !== null && nextGw >= 1 && nextGw <= 38) {
      // Open on the live GW (current in-progress) so the user sees real scores first.
      // They can navigate forward to plan transfers for the next GW.
      const liveGw = clampGw(nextGw - 1);
      setSelectedGW(liveGw);
      setSquadGW(liveGw);
    } else {
      // Off-season or API unavailable — fall back to SAMPLE_SQUAD
      setSelectedGW(SAMPLE_SQUAD.event_id);
      setSquadGW(SAMPLE_SQUAD.event_id);
    }

    setAppliedTransferCount(0);
    setPitchMode("squad");
    recommendationMutation.reset();
    setDidApplyNextGwDefault(true);
  }, [didApplyNextGwDefault, nextEventQuery.data?.event_id, nextEventQuery.isFetched, recommendationMutation]);

  useEffect(() => {
    if (squadQuery.isPlaceholderData) return;
    if (squadQuery.isFetching || squadQuery.isError) return;

    const returnedGw = squadQuery.data?.event_id;
    if (!Number.isFinite(returnedGw) || returnedGw < 1 || returnedGw > 38) return;
    if (returnedGw !== squadGW) {
      setSquadGW(clampGw(returnedGw));
    }
  }, [
    squadQuery.data?.event_id,
    squadQuery.isError,
    squadQuery.isFetching,
    squadQuery.isPlaceholderData,
    squadGW,
  ]);

  useEffect(() => {
    if (chipStrategy !== "wildcard" && chipPlayEventId !== undefined) {
      setChipPlayEventId(undefined);
    }
  }, [chipPlayEventId, chipStrategy]);

  useEffect(() => {
    try {
      localStorage.setItem("fpl_entry_id", String(entryId));
      if (selectedGW !== null) localStorage.setItem("fpl_selected_gw", String(selectedGW));
      if (squadGW !== null) localStorage.setItem("fpl_squad_gw", String(squadGW));
      localStorage.setItem("fpl_horizon_gws", String(horizonGws));
      localStorage.setItem("fpl_chip_strategy", chipStrategy);
      localStorage.setItem("fpl_transfer_strategy", chipStrategy);
      if (typeof chipPlayEventId === "number") {
        localStorage.setItem("fpl_chip_play_event_id", String(chipPlayEventId));
      } else {
        localStorage.removeItem("fpl_chip_play_event_id");
      }
      localStorage.setItem("fpl_include_transfers", String(includeTransfers));
      localStorage.setItem("fpl_apply_transfer_count", String(appliedTransferCount));
    } catch {
      // ignore
    }
  }, [entryId, selectedGW, squadGW, horizonGws, chipStrategy, chipPlayEventId, includeTransfers, appliedTransferCount]);

  useEffect(() => {
    if (!recommendationMutation.data) return;
    if (recommendationMutation.isPending) return;

    const nextChipPlayEventId =
      chipStrategy === "wildcard"
        ? recommendationMutation.data.chip_strategy?.play_event_id ?? chipPlayEventId ?? selectedGW
        : undefined;

    if (chipStrategy === "wildcard" && nextChipPlayEventId !== chipPlayEventId) {
      setChipPlayEventId(nextChipPlayEventId);
    }

    setAppliedTransferCount(0);
    recommendationMutation.mutate(
      buildRecommendationParams(selectedGW, {
        chipPlayEventId: nextChipPlayEventId,
      })
    );
    setPitchMode("recommendation");
  }, [horizonGws, chipStrategy, includeTransfers]);

  const nextEventId = nextEventQuery.data?.event_id;
  // Current GW = nextEventId - 1 (in-progress). isLiveGw true only for that GW.
  const currentLiveGw = typeof nextEventId === "number" ? nextEventId - 1 : undefined;
  const isLiveGw = typeof currentLiveGw === "number" && selectedGW !== null && selectedGW === currentLiveGw;

  // Don't render the app until we know which GW to show — avoids the fallback flash.
  const gwResolved = selectedGW !== null;

  const totalSuggestedMoves = recommendationMutation.data?.transfers?.moves?.length ?? 0;
  const canApplyNextTransfer = appliedTransferCount < totalSuggestedMoves;

  const applyNextTransfer = () => {
    if (!recommendationMutation.data) return;
    setAppliedTransferCount((prev) => Math.min(prev + 1, totalSuggestedMoves));
  };

  const applyTransferAtIndex = (index: number) => {
    if (!recommendationMutation.data) return;
    const normalized = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    setAppliedTransferCount(Math.min(normalized + 1, totalSuggestedMoves));
  };

  const resetAppliedTransfers = () => {
    setAppliedTransferCount(0);
  };

  const activeRecommendation = useMemo(() => {
    const rec = recommendationMutation.data;
    if (!rec) return undefined;

    const steps = Array.isArray(rec.squad_with_transfers_steps) ? rec.squad_with_transfers_steps : [];
    if (steps.length === 0) return rec;

    const maxStep = Math.max(0, steps.length - 1);
    const targetCount = Math.min(Math.max(0, appliedTransferCount), maxStep);
    const fallbackStep = steps[targetCount];
    const selectedStep = steps.find((step) => step.applied_count === targetCount) ?? fallbackStep;
    if (!selectedStep) return rec;

    return {
      ...rec,
      transfer_application: selectedStep.transfer_application ?? rec.transfer_application,
      transfer_impact: selectedStep.transfer_impact ?? rec.transfer_impact,
      squad_with_transfers: selectedStep,
    };
  }, [appliedTransferCount, recommendationMutation.data]);

  const activeTeam = useMemo(() => {
    if (pitchMode === "recommendation" && activeRecommendation) return activeRecommendation;
    return squadQuery.data;
  }, [pitchMode, activeRecommendation, squadQuery.data]);

  const activeError =
    pitchMode === "recommendation"
      ? recommendationMutation.error
      : squadQuery.error;

  const activeErrorMessage = useMemo(() => {
    if (!activeError) return undefined;
    if (activeError instanceof Error) return activeError.message;
    return String(activeError);
  }, [activeError]);

  const recommendErrorMessage = useMemo(() => {
    const err = recommendationMutation.error;
    if (!err) return undefined;
    if (err instanceof Error) return err.message;
    return String(err);
  }, [recommendationMutation.error]);

  const isLoading =
    pitchMode === "recommendation"
      ? recommendationMutation.isPending
      : squadQuery.isFetching;

  const setGwAndReset = (gw: number) => {
    setSelectedGW(gw);
    setSquadGW(gw);
    setAppliedTransferCount(0);
    const shouldRefreshRecommendation =
      Boolean(recommendationMutation.data) &&
      (pitchMode === "recommendation" || chipStrategy !== "none");

    if (shouldRefreshRecommendation) {
      const nextChipPlayEventId =
        chipStrategy === "wildcard"
          ? chipPlayEventId ?? recommendationMutation.data?.chip_strategy?.play_event_id ?? gw
          : undefined;
      setPitchMode("recommendation");
      recommendationMutation.mutate(
        buildRecommendationParams(gw, { chipPlayEventId: nextChipPlayEventId })
      );
      return;
    }

    setPitchMode("squad");
    recommendationMutation.reset();
  };

  const setEntryAndReset = (value: number) => {
    setEntryId(value);
    setSquadGW(selectedGW);
    setChipPlayEventId(undefined);
    setAppliedTransferCount(0);
    setPitchMode("squad");
    recommendationMutation.reset();
    if (value > 0) void saveEntryId(value);
  };

  // Resolved GW for rendering — fall back to SAMPLE_SQUAD.event_id only as last resort
  const resolvedGW = selectedGW ?? SAMPLE_SQUAD.event_id;

  const parameterProps = {
    entryId,
    onEntryIdChange: setEntryAndReset,
    horizonGws,
    onHorizonGwsChange: setHorizonGws,
    chipStrategy,
    onChipStrategyChange: setChipStrategy,
    includeTransfers,
    onIncludeTransfersChange: setIncludeTransfers,
    canRecommend,
    isRecommending: recommendationMutation.isPending,
    isLiveGw,
    maxHorizon: Math.max(1, 38 - resolvedGW + 1),
    onRecommend: () => {
      const nextChipPlayEventId = chipStrategy === "wildcard" ? resolvedGW : undefined;
      if (chipStrategy === "wildcard") {
        setChipPlayEventId(nextChipPlayEventId);
      }
      setAppliedTransferCount(0);
      recommendationMutation.mutate(
        buildRecommendationParams(resolvedGW, { chipPlayEventId: nextChipPlayEventId })
      );
    },
    recommendErrorMessage,
  };

  const handleEntryIdSubmit = async (raw: string): Promise<string | null> => {
    const id = parseEntryIdInput(raw);
    if (id === null) {
      return "That doesn't look like a team ID. Paste the number or your full FPL team URL.";
    }
    try {
      await fetchSquad({ entryId: id, eventId: resolvedGW });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Only a definitive not-found blocks onboarding; transient/backend
      // errors must not lock the user out — accept and let error states surface.
      if (/\b404\b|not found/i.test(message)) {
        return "Couldn't find a team with that ID. Double-check it on the FPL site.";
      }
    }
    setEntryAndReset(id);
    return null;
  };

  return (
    <div className="dark flex flex-col h-screen bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0 pt-14 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      {!gwResolved ? (
        // Wait for next-event API before showing anything — prevents fallback-squad flash
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <>
      {isDesktop ? (
        <div className="hidden lg:flex shrink-0">
          <ParameterSidebar {...parameterProps} />
        </div>
      ) : (
        <MobileParameterDrawer {...parameterProps} />
      )}
      <PitchVisualization
        entryId={entryId}
        onEntryIdSubmit={handleEntryIdSubmit}
        team={activeTeam ?? SAMPLE_SQUAD}
        requestedGw={resolvedGW}
        onRequestedGwChange={setGwAndReset}
        gwSelectable={canChangeGw}
        isLoading={isLoading}
        errorMessage={activeErrorMessage}
        fixturesByTeam={fixturesByTeam}
        pitchMode={pitchMode}
        onPitchModeChange={setPitchMode}
        hasRecommendation={Boolean(recommendationMutation.data)}
        isLiveGw={isLiveGw}
      />
      <RecommendationsPanel
        squad={squadQuery.data}
        recommendation={activeRecommendation}
        isRecommending={recommendationMutation.isPending}
        horizonGws={horizonGws}
        appliedTransferCount={appliedTransferCount}
        canApplyNextTransfer={canApplyNextTransfer}
        isApplyingTransfer={recommendationMutation.isPending}
        onApplyNextTransfer={applyNextTransfer}
        onResetAppliedTransfers={resetAppliedTransfers}
        onApplyTransferAtIndex={applyTransferAtIndex}
        entryId={entryId}
        currentGw={selectedGW ?? undefined}
      />
        </>
      )}
      </div>
    </div>
  );
};

export default Index;
