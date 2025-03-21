import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import SolutionSelector from "@/components/SolutionSelector";
import SolutionOverview from "@/components/SolutionOverview";
import EvaluationResults from "@/components/EvaluationResults";
import BatchEvaluation from "@/components/BatchEvaluation";
import ApiConfigPanel from "@/components/ApiConfig";
import { Solution, ApiConfig as ApiConfigType } from "@/lib/types";
import logo from "@/assets/logo.jpeg";

export default function Home() {
  // State
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfigType>({
    model: "gemini-2.0-flash",
    temperature: 0.2
  });
  
  // Reference to the evaluation reset function
  const resetEvaluationRef = useRef<() => void>(() => {});

  // Fetch solutions
  const { 
    data: solutions, 
    isLoading: solutionsLoading,
    error: solutionsError 
  } = useQuery<Solution[]>({
    queryKey: ['/api/solutions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch selected solution details
  const {
    data: selectedSolution,
    isLoading: solutionLoading,
    error: solutionError,
  } = useQuery<Solution>({
    queryKey: ['/api/solutions', selectedSolutionId],
    enabled: !!selectedSolutionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
  
  // Log query results
  console.log("Selected solution ID:", selectedSolutionId);
  console.log("Solution loading:", solutionLoading);
  console.log("Solution error:", solutionError);
  console.log("Selected solution data:", selectedSolution);

  // Handle solution selection
  const handleSolutionSelect = (solutionId: string) => {
    // Reset evaluation results when a new solution is selected
    if (resetEvaluationRef.current) {
      resetEvaluationRef.current();
    }
    setSelectedSolutionId(solutionId);
  };

  // Update API configuration
  const handleApiConfigUpdate = (newConfig: ApiConfigType) => {
    setApiConfig(newConfig);
  };

  return (
    <div className="bg-neutral-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center mb-2">
            <img 
              src={logo} 
              alt="MIT Solve Logo" 
              className="h-10 mr-3"
            />
            <h1 className="text-2xl md:text-3xl font-medium text-gray-800">Global Health Challenge Evaluator</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Evaluate startup solutions from the MIT Solve Global Health Challenge against five screening criteria using the Google Gemini API.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Solution Selection & Overview */}
          <div className="lg:col-span-5">
            <SolutionSelector
              solutions={solutions}
              isLoading={solutionsLoading}
              error={solutionsError as Error | null}
              onSelect={handleSolutionSelect}
              selectedSolutionId={selectedSolutionId}
            />
            
            <SolutionOverview
              solution={selectedSolution as Solution}
              isLoading={solutionLoading}
            />
          </div>

          {/* Right Column: Evaluation Results */}
          <div className="lg:col-span-7">
            <EvaluationResults
              solutionId={selectedSolutionId}
              apiConfig={apiConfig}
              solution={selectedSolution as Solution}
              onResetRef={resetEvaluationRef}
            />
            
            {/* Batch Evaluation Panel */}
            <BatchEvaluation 
              solutions={solutions}
              apiConfig={apiConfig}
            />
            
            <ApiConfigPanel
              config={apiConfig}
              onConfigChange={handleApiConfigUpdate}
            />
          </div>
        </main>
        
        <footer className="mt-10 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MIT Solve. This tool is for evaluation purposes only.</p>
        </footer>
      </div>
    </div>
  );
}
