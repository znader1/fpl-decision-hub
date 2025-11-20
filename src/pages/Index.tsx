import { ParameterSidebar } from "@/components/ParameterSidebar";
import { PitchVisualization } from "@/components/PitchVisualization";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      <ParameterSidebar />
      <PitchVisualization />
      <RecommendationsPanel />
    </div>
  );
};

export default Index;
