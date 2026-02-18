import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ParameterSidebar } from "@/components/ParameterSidebar";
import { PitchVisualization } from "@/components/PitchVisualization";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import {
  fetchFixtures,
  fetchSquad,
  fetchTeamRecommendation,
  getRecommendationUrlTemplate,
  getFixturesUrlTemplate,
  getSquadUrlTemplate,
  interpolateFixturesUrl,
  interpolateSquadUrl,
  interpolateTeamRecommendationUrl,
  SAMPLE_SQUAD,
  type FplSquad,
  type FplTeamFixture,
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

const getInitialIncludeTransfers = () => {
  const fromQuery = new URLSearchParams(window.location.search).get("include_transfers");
  if (fromQuery === "true") return true;
  if (fromQuery === "false") return false;

  const fromStorage = localStorage.getItem("fpl_include_transfers");
  if (fromStorage === "true") return true;
  if (fromStorage === "false") return false;

  return true;
};

const Index = () => {
  const [entryId, setEntryId] = useState(getInitialEntryId);
  const [selectedGW, setSelectedGW] = useState(getInitialGw);
  const [squadGW, setSquadGW] = useState(getInitialSquadGw);
  const [horizonGws, setHorizonGws] = useState(getInitialHorizon);
  const [transferStrategy, setTransferStrategy] = useState(getInitialStrategy);
  const [includeTransfers, setIncludeTransfers] = useState(getInitialIncludeTransfers);
  const [pitchMode, setPitchMode] = useState<PitchMode>("squad");

  const squadTemplate = getSquadUrlTemplate();
  const fixturesTemplate = getFixturesUrlTemplate();
  const recommendationTemplate = getRecommendationUrlTemplate();

  const canFetchSquad = Boolean(squadTemplate);
  const canFetchFixtures = Boolean(fixturesTemplate);
  const canRecommend = Boolean(recommendationTemplate);
  const canChangeGw = true;

  const squadRequestUrl = useMemo(() => {
    if (!squadTemplate) return undefined;
    return interpolateSquadUrl(squadTemplate, { entryId, eventId: squadGW });
  }, [squadTemplate, entryId, squadGW]);

  const recommendationRequestUrl = useMemo(() => {
    if (!recommendationTemplate) return undefined;
    return interpolateTeamRecommendationUrl(recommendationTemplate, {
      entryId,
      eventId: selectedGW,
      horizonGws,
      strategy: transferStrategy,
      includeTransfers,
    });
  }, [recommendationTemplate, entryId, selectedGW, horizonGws, transferStrategy, includeTransfers]);

  const fixturesRequestUrl = useMemo(() => {
    if (!fixturesTemplate) return undefined;
    return interpolateFixturesUrl(fixturesTemplate, { eventId: selectedGW });
  }, [fixturesTemplate, selectedGW]);

  const squadQuery = useQuery<FplSquad>({
    queryKey: ["squad", entryId, squadGW],
    queryFn: ({ signal }) => fetchSquad({ entryId, eventId: squadGW }, signal),
    enabled: canFetchSquad && Number.isFinite(entryId) && entryId > 0,
    placeholderData: (previousData) => previousData ?? SAMPLE_SQUAD,
    retry: false,
  });

  const fixturesQuery = useQuery<FplTeamFixture[]>({
    queryKey: ["fixtures", selectedGW],
    queryFn: ({ signal }) => fetchFixtures({ eventId: selectedGW }, signal),
    enabled: canFetchFixtures && Number.isFinite(selectedGW) && selectedGW >= 1 && selectedGW <= 38,
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

  const recommendationMutation = useMutation<FplTeamRecommendation, unknown, void>({
    mutationFn: async () =>
      fetchTeamRecommendation({
        entryId,
        eventId: selectedGW,
        horizonGws,
        strategy: transferStrategy,
        includeTransfers,
      }),
    onSuccess: () => setPitchMode("recommendation"),
  });
  const resetRecommendation = recommendationMutation.reset;

  useEffect(() => {
    try {
      localStorage.setItem("fpl_entry_id", String(entryId));
      localStorage.setItem("fpl_selected_gw", String(selectedGW));
      localStorage.setItem("fpl_squad_gw", String(squadGW));
      localStorage.setItem("fpl_horizon_gws", String(horizonGws));
      localStorage.setItem("fpl_transfer_strategy", transferStrategy);
      localStorage.setItem("fpl_include_transfers", String(includeTransfers));
    } catch {
      // ignore
    }
  }, [entryId, selectedGW, squadGW, horizonGws, transferStrategy, includeTransfers]);

  useEffect(() => {
    resetRecommendation();
    setPitchMode("squad");
  }, [horizonGws, transferStrategy, includeTransfers, resetRecommendation]);

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
    setSelectedGW(gw);
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
        includeTransfers={includeTransfers}
        onIncludeTransfersChange={setIncludeTransfers}
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
        requestedGw={selectedGW}
        onRequestedGwChange={setGwAndReset}
        gwSelectable={canChangeGw}
        isLoading={isLoading}
        errorMessage={activeErrorMessage}
        requestUrl={activeRequestUrl}
        sourceLabel={sourceLabel}
        fixturesByTeam={fixturesByTeam}
        fixturesRequestUrl={fixturesRequestUrl}
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
