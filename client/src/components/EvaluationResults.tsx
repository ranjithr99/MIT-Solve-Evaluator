import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Solution, EvaluationResponse, CriterionResult, ApiConfig, SCREENING_CRITERIA } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, X, AlertTriangle, FileText, ChevronDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EvaluationResultsProps {
  solutionId: string | null;
  apiConfig: ApiConfig;
  solution: Solution | undefined;
}

export default function EvaluationResults({ solutionId, apiConfig, solution }: EvaluationResultsProps) {
  const [isApiResponseOpen, setIsApiResponseOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for evaluating a solution
  const {
    mutate: evaluateSolution,
    isPending,
    isError,
    error,
    data: evaluationResult,
    reset
  } = useMutation({
    mutationFn: async () => {
      if (!solutionId) throw new Error("No solution selected");
      
      try {
        const response = await apiRequest(
          "POST", 
          `/api/evaluate/${solutionId}`,
          apiConfig
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        return response.json() as Promise<EvaluationResponse>;
      } catch (err) {
        console.error("Evaluation error:", err);
        throw err; // Re-throw to trigger onError
      }
    },
    onSuccess: () => {
      // Invalidate evaluation cache
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations', solutionId] });
      toast({
        title: "Evaluation Complete",
        description: "The solution has been evaluated successfully.",
      });
    },
    onError: (err) => {
      console.error("Error in mutation:", err);
      toast({
        title: "Evaluation Failed",
        description: String(err),
        variant: "destructive",
      });
    }
  });

  // Handle evaluation button click
  const handleEvaluate = () => {
    if (solutionId) {
      reset();
      evaluateSolution();
    } else {
      toast({
        title: "No Solution Selected",
        description: "Please select a solution to evaluate.",
        variant: "destructive",
      });
    }
  };

  // Render no evaluation state
  if (!solutionId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Evaluation Results</h2>
        
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Select a solution to perform evaluation</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isPending) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Evaluation Results</h2>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Evaluating solution with Gemini API...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError && !evaluationResult) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Evaluation Results</h2>
        
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <p className="text-gray-700 font-medium">Error performing evaluation</p>
          <p className="text-gray-500 mt-2 mb-4">{String(error)}</p>
          <Button 
            onClick={handleEvaluate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Retry Evaluation
          </Button>
        </div>
      </div>
    );
  }

  // No evaluation result yet and no loading/error state
  if (!evaluationResult && !solution) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-800">Evaluation Results</h2>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Solution selected. Ready to evaluate.</p>
          <Button 
            onClick={handleEvaluate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Evaluate with Gemini API
          </Button>
        </div>
      </div>
    );
  }

  // Render evaluation results
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-800">Evaluation Results</h2>
        
        {/* Evaluation Status */}
        {evaluationResult && (
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              evaluationResult.overallVerdict === "PASS" 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {evaluationResult.overallVerdict === "PASS" 
                ? "All Criteria Met" 
                : "Some Criteria Failed"
              }
            </span>
          </div>
        )}
      </div>
      
      {/* Results */}
      {evaluationResult && (
        <>
          {/* Overall verdict banner */}
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            evaluationResult.overallVerdict === "PASS" 
              ? "bg-green-100" 
              : "bg-red-100"
          }`}>
            <div className="flex items-center">
              {evaluationResult.overallVerdict === "PASS" ? (
                <Check className="h-6 w-6 mr-3 text-green-600" />
              ) : (
                <X className="h-6 w-6 mr-3 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium">Overall Verdict</p>
                <p className={`text-lg font-medium ${
                  evaluationResult.overallVerdict === "PASS" 
                    ? "text-green-800" 
                    : "text-red-800"
                }`}>
                  {evaluationResult.overallVerdict}
                  {evaluationResult.overallVerdict === "FAIL" && (
                    ` (${evaluationResult.criteria.filter(c => c.result === "FAIL").length} criteria not satisfied)`
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEvaluate}
              variant="outline"
              className="px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reevaluate
            </Button>
          </div>
          
          {/* Individual criteria results */}
          <ScrollArea className="h-[600px] overflow-y-auto pr-1">
            <div className="space-y-4">
              {evaluationResult.criteria.map((criterion: CriterionResult) => {
                const criterionInfo = SCREENING_CRITERIA.find(c => c.id === criterion.id);
                
                return (
                  <div key={criterion.id} className="border rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-3 ${
                          criterion.result === "PASS" ? "bg-green-500" : "bg-red-500"
                        }`}></span>
                        <h3 className="text-md font-medium">{criterion.name}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-sm font-medium ${
                        criterion.result === "PASS" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {criterion.result}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        {criterionInfo?.description || ""}
                      </p>
                      <div className="bg-gray-100 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Reasoning</h4>
                        <div 
                          className="text-sm text-gray-800 prose prose-sm max-w-none" 
                          dangerouslySetInnerHTML={{ __html: criterion.reasoning }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* API Response (Collapsible) */}
            <div className="mt-6 border rounded-lg overflow-hidden">
              <Collapsible open={isApiResponseOpen} onOpenChange={setIsApiResponseOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="w-full flex justify-between items-center p-4 bg-gray-100 text-left"
                  >
                    <span className="font-medium text-gray-700">View API Response</span>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${
                      isApiResponseOpen ? "rotate-180" : ""
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 bg-gray-900 overflow-x-auto">
                    <pre className="text-green-400 font-mono text-xs">
                      {JSON.stringify(evaluationResult, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
