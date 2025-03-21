// Frontend type definitions

// Screening criteria definition
export interface Criterion {
  id: number;
  name: string;
  description: string;
}

// Solution data structure
export interface Solution {
  id: number;
  solutionId: string;
  challengeName: string;
  summary: string;
  headquarters: string;
  organizationType: string;
  problemStatement: string;
  solutionDescription: string;
  targetBeneficiaries: string;
  technologiesUsed: string;
  websiteLinks: string;
  operatingCountries: string;
  teamSize: string;
  duration: string;
  diversityApproaches: string;
  businessModel: string;
  serviceDeliveryModel: string;
  financialSustainability: string;
}

// Evaluation result for a criterion
export interface CriterionResult {
  id: number;
  name: string;
  result: "PASS" | "FAIL";
  reasoning: string;
}

// Complete evaluation response
export interface EvaluationResponse {
  criteria: CriterionResult[];
  overallVerdict: "PASS" | "FAIL";
}

// Available Gemini models
export type GeminiModel = "gemini-2.0-flash" | "gemini-1.5-pro";

// API Configuration
export interface ApiConfig {
  model: GeminiModel;
  temperature: number;
}

// This data structure defines the screening criteria descriptions
export const SCREENING_CRITERIA: Criterion[] = [
  {
    id: 1,
    name: "Completeness, Appropriateness, and Intelligibility",
    description: "The Solution Application should be complete with all questions answered clearly. The solution must be presented in English and be fully intelligible for reviewers without requiring translation or interpretation."
  },
  {
    id: 2,
    name: "Prototype Stage Verification",
    description: "The Solution must have advanced beyond the idea/concept phase and be at minimum at prototype stage. There should be evidence of implementation or testing in real-world settings, not just a theoretical concept."
  },
  {
    id: 3,
    name: "Relevance to Challenge",
    description: "The Solution must directly address the MIT Solve Global Health Challenge goals and objectives. It should clearly demonstrate how it improves health outcomes in target communities and aligns with the challenge's focus areas."
  },
  {
    id: 4,
    name: "Technology-Driven Solution",
    description: "The Solution must utilize technology as a key component of its approach, implementation, or scaling strategy. Technology should be integral to how the solution works, not just a peripheral element."
  },
  {
    id: 5,
    name: "Suitability for External Review",
    description: "The Solution must be appropriate for external review and not contain confidential or proprietary information that would prevent comprehensive evaluation by judges and experts."
  }
];
