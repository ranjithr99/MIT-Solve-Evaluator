import { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
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
  // State for tracking upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is CSV
    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      setUploadSuccess(null);
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/solutions/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload CSV');
      }

      setUploadSuccess(result.message);
      
      // Refresh the page to load new solutions
      window.location.reload();
    } catch (error) {
      setUploadError(`Error uploading CSV: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-medium mb-3 text-gray-800">Select a Solution</h2>
      
      <div className="relative">
        <div className="mb-4">
          <div className="flex items-center mb-2 gap-2">
            <Button
              type="button" 
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white"
              disabled={isUploading}
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="h-5 w-5" />
              Upload CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="text-sm text-gray-600">
              <div className="animate-pulse">Uploading file...</div>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="text-sm text-green-600 mt-1">
              {uploadSuccess}
            </div>
          )}
          
          {uploadError && (
            <div className="text-sm text-red-600 mt-1">
              {uploadError}
            </div>
          )}
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
              {solutions && solutions.map((solution) => (
                <SelectItem 
                  key={solution.solutionId} 
                  value={solution.solutionId}
                >
                  {solution.solutionId} - {solution.summary?.length > 40 
                    ? `${solution.summary.substring(0, 40)}...` 
                    : solution.summary}
                </SelectItem>
              ))}
              {solutions && solutions.length === 0 && (
                <div className="p-2 text-center text-gray-500">
                  No solutions available. Please upload a CSV file.
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
