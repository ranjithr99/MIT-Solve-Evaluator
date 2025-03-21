import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Solution } from "@/lib/types";

interface SolutionSelectorProps {
  solutions: Solution[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onSelect: (solutionId: string) => void;
  selectedSolutionId: string | null;
}

export default function SolutionSelector({ 
  solutions, 
  isLoading, 
  error, 
  onSelect, 
  selectedSolutionId 
}: SolutionSelectorProps) {
  // State for the search input
  const [searchQuery, setSearchQuery] = useState("");

  // Filter solutions based on search query
  const filteredSolutions = useMemo(() => {
    if (!solutions) return [];
    
    if (!searchQuery.trim()) return solutions;
    
    const query = searchQuery.toLowerCase();
    return solutions.filter(
      (solution) => 
        solution.solutionId.toLowerCase().includes(query) || 
        solution.summary.toLowerCase().includes(query)
    );
  }, [solutions, searchQuery]);

  // Reset selected solution when solutions data changes
  useEffect(() => {
    if (solutions && solutions.length > 0 && !selectedSolutionId) {
      // Don't auto-select anything, let the user choose
    }
  }, [solutions, selectedSolutionId]);

  // Handle solution selection
  const handleSelectionChange = (value: string) => {
    onSelect(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-medium mb-3 text-gray-800">Select a Solution</h2>
      
      <div className="relative">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Search className="h-5 w-5 text-gray-500 mr-2" />
            <Input
              type="text"
              id="solution-search"
              placeholder="Search solutions..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading solutions...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            Error loading solutions: {error.message}
          </div>
        ) : (
          <Select 
            value={selectedSolutionId || ""} 
            onValueChange={handleSelectionChange}
          >
            <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none appearance-none cursor-pointer">
              <SelectValue placeholder="Choose a solution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>Choose a solution</SelectItem>
              {filteredSolutions.map((solution) => (
                <SelectItem 
                  key={solution.solutionId} 
                  value={solution.solutionId}
                >
                  {solution.solutionId} - {solution.summary.length > 40 
                    ? `${solution.summary.substring(0, 40)}...` 
                    : solution.summary}
                </SelectItem>
              ))}
              {filteredSolutions.length === 0 && (
                <div className="p-2 text-center text-gray-500">
                  {solutions && solutions.length > 0 
                    ? "No matching solutions found" 
                    : "No solutions available. Please upload a CSV file."}
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
