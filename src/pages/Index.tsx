import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ParameterSidebar } from "@/components/ParameterSidebar";
import { PitchVisualization } from "@/components/PitchVisualization";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import {
  fetchSquad,
  fetchTeamRecommendation,
  getRecommendationUrlTemplate,
  getSquadUrlTemplate,
  interpolateSquadUrl,
  interpolateTeamRecommendationUrl,
  SAMPLE_SQUAD,
  type FplSquad,
  type FplTeamRecommendation,
} from "@/lib/fplAssistantApi";

type PitchMode = "squad" | "recommendation";

const clampGw = (gw: number) => Math.min(38, Math.max(1, gw));

const getInitialGw = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("gw"));
  if (Number.isFinite(fromQuery) && fromQuery >= 1 && fromQuery <= 38) return clampGw(fromQuery);

  const fromStorage = Number(localStorage.getItem("fpl_selected_gw"));
  if (Number.isFinite(fromStorage) && fromStorage >= 1 && fromStorage <= 38) return clampGw(fromStorage);

  return SAMPLE_SQUAD.event_id;
};

const getInitialEntryId = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("entry_id"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

  const fromStorage = Number(localStorage.getItem("fpl_entry_id"));
  if (Number.isFinite(fromStorage) && fromStorage > 0) return fromStorage;

  return SAMPLE_SQUAD.entry_id;
};

const getInitialHorizon = () => {
  const fromQuery = Number(new URLSearchParams(window.location.search).get("horizon_gws"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

  const fromStorage = Number(localStorage.getItem("fpl_horizon_gws"));
  if (Number.isFinite(fromStorage) && fromStorage > 0) return fromStorage;

  return 3;
};

const getInitialStrategy = () => {
  const fromQuery = new URLSearchParams(window.location.search).get("strategy");
  if (typeof fromQuery === "string" && fromQuery.length > 0) return fromQuery;
  return localStorage.getItem("fpl_transfer_strategy") ?? "";
};

const Index = () => {
  const [entryId, setEntryId] = useState(getInitialEntryId);
  const [currentGW, setCurrentGW] = useState(getInitialGw);
  const [horizonGws, setHorizonGws] = useState(getInitialHorizon);
  const [transferStrategy, setTransferStrategy] = useState(getInitialStrategy);
  const [pitchMode, setPitchMode] = useState<PitchMode>("squad");

  const squadTemplate = getSquadUrlTemplate();
  const recommendationTemplate = getRecommendationUrlTemplate();

  const canFetchSquad = Boolean(squadTemplate);
  const canRecommend = Boolean(recommendationTemplate);
  const canChangeGw = Boolean(squadTemplate?.includes("{event_id}"));

  const squadRequestUrl = useMemo(() => {
    if (!squadTemplate) return undefined;
    return interpolateSquadUrl(squadTemplate, { entryId, eventId: currentGW });
  }, [squadTemplate, entryId, currentGW]);

  const recommendationRequestUrl = useMemo(() => {
    if (!recommendationTemplate) return undefined;
    return interpolateTeamRecommendationUrl(recommendationTemplate, {
      entryId,
      eventId: currentGW,
      horizonGws,
      strategy: transferStrategy,
    });
  }, [recommendationTemplate, entryId, currentGW, horizonGws, transferStrategy]);

  const squadQuery = useQuery<FplSquad>({
    queryKey: ["squad", entryId, currentGW],
    queryFn: ({ signal }) => fetchSquad({ entryId, eventId: currentGW }, signal),
    enabled: canFetchSquad && Number.isFinite(entryId) && entryId > 0,
    initialData: SAMPLE_SQUAD,
    retry: false,
  });

  const recommendationMutation = useMutation<FplTeamRecommendation, unknown, void>({
    mutationFn: async () =>
      fetchTeamRecommendation({ entryId, eventId: currentGW, horizonGws, strategy: transferStrategy }),
    onSuccess: () => setPitchMode("recommendation"),
  });
  const resetRecommendation = recommendationMutation.reset;

  useEffect(() => {
    try {
      localStorage.setItem("fpl_entry_id", String(entryId));
      localStorage.setItem("fpl_selected_gw", String(currentGW));
      localStorage.setItem("fpl_horizon_gws", String(horizonGws));
      localStorage.setItem("fpl_transfer_strategy", transferStrategy);
    } catch {
      // ignore
    }
  }, [entryId, currentGW, horizonGws, transferStrategy]);

  useEffect(() => {
    resetRecommendation();
    setPitchMode("squad");
  }, [horizonGws, transferStrategy, resetRecommendation]);

  const activeTeam = useMemo(() => {
    if (pitchMode === "recommendation" && recommendationMutation.data) return recommendationMutation.data;
    return squadQuery.data;
  }, [pitchMode, recommendationMutation.data, squadQuery.data]);

  const activeRequestUrl = pitchMode === "recommendation" ? recommendationRequestUrl : squadRequestUrl;

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

  const sourceLabel = pitchMode === "recommendation" ? "Recommendation" : "Squad";

  const setGwAndReset = (gw: number) => {
    setCurrentGW(gw);
    setPitchMode("squad");
    recommendationMutation.reset();
  };

  const setEntryAndReset = (value: number) => {
    setEntryId(value);
    setPitchMode("squad");
    recommendationMutation.reset();
  };

  return (
    <div className="flex h-screen bg-background">
      <ParameterSidebar
        entryId={entryId}
        onEntryIdChange={setEntryAndReset}
        horizonGws={horizonGws}
        onHorizonGwsChange={setHorizonGws}
        transferStrategy={transferStrategy}
        onTransferStrategyChange={setTransferStrategy}
        canRecommend={canRecommend}
        isRecommending={recommendationMutation.isPending}
        onRecommend={() => recommendationMutation.mutate()}
        recommendErrorMessage={recommendErrorMessage}
        pitchMode={pitchMode}
        onPitchModeChange={setPitchMode}
        hasRecommendation={Boolean(recommendationMutation.data)}
      />
      <PitchVisualization
        team={activeTeam}
        requestedGw={currentGW}
        onRequestedGwChange={setGwAndReset}
        gwSelectable={canChangeGw}
        isLoading={isLoading}
        errorMessage={activeErrorMessage}
        requestUrl={activeRequestUrl}
        sourceLabel={sourceLabel}
      />
      <RecommendationsPanel
        recommendation={recommendationMutation.data}
        isRecommending={recommendationMutation.isPending}
        horizonGws={horizonGws}
      />
    </div>
  );
};

export default Index;
