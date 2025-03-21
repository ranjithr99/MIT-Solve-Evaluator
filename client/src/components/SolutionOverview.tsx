import { Solution } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface SolutionOverviewProps {
  solution: Solution | undefined;
  isLoading: boolean;
}

export default function SolutionOverview({ solution, isLoading }: SolutionOverviewProps) {
  // Render loading skeleton when data is loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Solution Overview</h2>
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // No solution selected state
  if (!solution) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Solution Overview</h2>
        
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Select a solution to view details</p>
        </div>
      </div>
    );
  }

  // Solution details
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-medium mb-4 text-gray-800">Solution Overview</h2>
      
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-blue-600">{solution.summary}</h3>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-md text-gray-600">{solution.solutionId}</span>
        </div>
        <p className="text-gray-600 mt-1">{solution.challengeName}</p>
      </div>
      
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Headquarters</h4>
              <p className="text-gray-800">{solution.headquarters || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Organization Type</h4>
              <p className="text-gray-800">{solution.organizationType || "N/A"}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Problem Statement</h4>
            <p className="text-gray-800 text-sm">{solution.problemStatement || "N/A"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Solution Description</h4>
            <p className="text-gray-800 text-sm">{solution.solutionDescription || "N/A"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Target Beneficiaries</h4>
            <p className="text-gray-800 text-sm">{solution.targetBeneficiaries || "N/A"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Technologies Used</h4>
            <p className="text-gray-800 text-sm">{solution.technologiesUsed || "N/A"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Operating Countries</h4>
              <p className="text-gray-800 text-sm">{solution.operatingCountries || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Team & Duration</h4>
              <p className="text-gray-800 text-sm">{solution.teamSize || "N/A"} {solution.duration ? `, ${solution.duration}` : ""}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Business Model</h4>
            <p className="text-gray-800 text-sm">{solution.businessModel || "N/A"}</p>
          </div>
          
          {solution.serviceDeliveryModel && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Service Delivery Model</h4>
              <p className="text-gray-800 text-sm">{solution.serviceDeliveryModel}</p>
            </div>
          )}
          
          {solution.financialSustainability && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Financial Sustainability</h4>
              <p className="text-gray-800 text-sm">{solution.financialSustainability}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
