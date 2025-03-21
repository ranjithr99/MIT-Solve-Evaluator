import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Solution, EvaluationResponse, ApiConfig } from "@/lib/types";
import { RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface BatchEvaluationProps {
  solutions: Solution[] | undefined;
  apiConfig: ApiConfig;
}

interface BatchResult {
  [solutionId: string]: EvaluationResponse;
}

export default function BatchEvaluation({ solutions, apiConfig }: BatchEvaluationProps) {
  const [batchResults, setBatchResults] = useState<BatchResult>({});
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calculate progress percentage
  const progressPercentage = solutions && inProgress 
    ? Math.round((currentSolutionIndex / solutions.length) * 100) 
    : 0;

  // Mutation for evaluating a single solution
  const { mutateAsync: evaluateSolution } = useMutation({
    mutationFn: async (solutionId: string) => {
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
        throw err;
      }
    },
    onSuccess: (_, solutionId) => {
      // Invalidate evaluation cache
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations', solutionId] });
    }
  });

  // Process all solutions in sequence
  const evaluateAll = async () => {
    if (!solutions || solutions.length === 0) {
      toast({
        title: "No Solutions Available",
        description: "There are no solutions to evaluate.",
        variant: "destructive",
      });
      return;
    }

    setInProgress(true);
    const results: BatchResult = {};
    
    try {
      for (let i = 0; i < solutions.length; i++) {
        const solution = solutions[i];
        setCurrentSolutionIndex(i);
        
        toast({
          title: "Evaluating Solution",
          description: `Processing ${i + 1} of ${solutions.length}: ${solution.solutionId}`,
        });
        
        try {
          const result = await evaluateSolution(solution.solutionId);
          results[solution.solutionId] = result;
        } catch (error) {
          console.error(`Error evaluating solution ${solution.solutionId}:`, error);
          // Continue with next solution even if one fails
        }
      }
      
      setBatchResults(results);
      toast({
        title: "Batch Evaluation Complete",
        description: `Successfully evaluated ${Object.keys(results).length} of ${solutions.length} solutions.`,
      });
    } catch (error) {
      toast({
        title: "Batch Evaluation Error",
        description: `Error during batch evaluation: ${error}`,
        variant: "destructive",
      });
    } finally {
      setInProgress(false);
      setCurrentSolutionIndex(-1);
    }
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (Object.keys(batchResults).length === 0) {
      toast({
        title: "No Results to Export",
        description: "Please evaluate the solutions first.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV header
    let csvContent = "Solution ID,Criterion 1,Criterion 2,Criterion 3,Criterion 4,Criterion 5\n";
    
    // Add data rows
    Object.entries(batchResults).forEach(([solutionId, evaluation]) => {
      const criteriaResults = new Array(5).fill(0);
      
      // Map criteria results (1 for pass, 0 for fail)
      evaluation.criteria.forEach(criterion => {
        // Criteria IDs are 1-indexed in our schema
        const index = criterion.id - 1;
        if (index >= 0 && index < 5) {
          criteriaResults[index] = criterion.result === "PASS" ? 1 : 0;
        }
      });
      
      // Add row to CSV
      csvContent += `${solutionId},${criteriaResults.join(",")}\n`;
    });
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "evaluation_results.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Results have been exported to CSV.",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-medium mb-4 text-gray-800">Batch Evaluation</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={evaluateAll}
            disabled={inProgress || !solutions}
            className="bg-blue-600 text-white hover:bg-blue-700 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Evaluate All Solutions
          </Button>
          
          <Button
            onClick={exportToCSV}
            disabled={Object.keys(batchResults).length === 0}
            className="bg-green-600 text-white hover:bg-green-700 gap-2"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>
        
        {/* Status and progress */}
        {inProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Processing solution {currentSolutionIndex + 1} of {solutions?.length}
              </span>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        {/* Results summary */}
        {!inProgress && Object.keys(batchResults).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-700 mb-2">Evaluation Summary</h3>
            <p className="text-sm text-gray-600">
              {Object.keys(batchResults).length} solutions have been evaluated.
              Click "Export to CSV" to download the results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}