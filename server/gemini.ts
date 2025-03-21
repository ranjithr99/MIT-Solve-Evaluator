import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Solution, EvaluationResponse } from "@shared/schema";

// Initialize the Google AI client using API key from environment variables
const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please set GEMINI_API_KEY environment variable.");
  }
  return apiKey;
};

// Configure the generative AI client
let genAI: GoogleGenerativeAI;
try {
  genAI = new GoogleGenerativeAI(getApiKey());
} catch (error) {
  console.error("Error initializing Gemini client:", error);
}

// MIT Solve Challenge context
const CHALLENGE_CONTEXT = `
The MIT Solve Global Health Challenge seeks innovative technology-based solutions that improve health outcomes in underserved communities worldwide. The challenge focuses on expanding access to quality healthcare, preventive services, and health education through scalable, sustainable approaches.
`;

// Evaluation criteria detailed descriptions
const EVALUATION_CRITERIA = `
1. Completeness, Appropriateness, and Intelligibility: The Solution Application should be complete with all questions answered clearly. The solution must be presented in English and be fully intelligible for reviewers without requiring translation or interpretation.

2. Prototype Stage Verification: The Solution must have advanced beyond the idea/concept phase and be at minimum at prototype stage. There should be evidence of implementation or testing in real-world settings, not just a theoretical concept.

3. Relevance to Challenge: The Solution must directly address the MIT Solve Global Health Challenge goals and objectives. It should clearly demonstrate how it improves health outcomes in target communities and aligns with the challenge's focus areas.

4. Technology-Driven Solution: The Solution must utilize technology as a key component of its approach, implementation, or scaling strategy. Technology should be integral to how the solution works, not just a peripheral element.

5. Suitability for External Review: The Solution must be appropriate for external review and not contain confidential or proprietary information that would prevent comprehensive evaluation by judges and experts.
`;

/**
 * Evaluates a solution using the Gemini API
 * @param solution Solution to evaluate
 * @param model Model to use (e.g., 'gemini-2.0-flash', 'gemini-1.5-pro')
 * @param temperature Temperature setting for the model
 * @returns Evaluation results in the expected format
 */
export async function evaluateSolution(
  solution: Solution,
  model: string,
  temperature: number
): Promise<EvaluationResponse> {
  try {
    // Configure the model
    const genModel = genAI.getGenerativeModel({
      model: model,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 4096,
      },
    });

    // Construct the prompt
    const prompt = `
You are an expert evaluator for the MIT Solve Global Health Challenge. You need to assess the following solution against the five screening criteria.

### MIT Solve Challenge Context:
${CHALLENGE_CONTEXT}

### Evaluation Criteria:
${EVALUATION_CRITERIA}

### Solution to Evaluate:
Solution ID: ${solution.solutionId}
Challenge Name: ${solution.challengeName}
Summary: ${solution.summary}
Headquarters: ${solution.headquarters}
Organization Type: ${solution.organizationType}
Problem Statement: ${solution.problemStatement}
Solution Description: ${solution.solutionDescription}
Target Beneficiaries: ${solution.targetBeneficiaries}
Technologies Used: ${solution.technologiesUsed}
Website/App Links: ${solution.websiteLinks}
Operating Countries: ${solution.operatingCountries}
Team Size: ${solution.teamSize}
Duration: ${solution.duration}
Diversity and Inclusion Approaches: ${solution.diversityApproaches}
Business Model: ${solution.businessModel}
Service Delivery Model: ${solution.serviceDeliveryModel}
Financial Sustainability Plan: ${solution.financialSustainability}

### Instructions:
1. Carefully analyze the solution against each criterion
2. For each criterion, determine a PASS or FAIL result
3. Provide 2-3 sentences explaining your reasoning for each determination
4. Provide an overall verdict (PASS only if ALL criteria pass, otherwise FAIL)

Return your evaluation in the following JSON format:
{
  "criteria": [
    {
      "id": 1,
      "name": "Completeness, Appropriateness, and Intelligibility",
      "result": "PASS/FAIL",
      "reasoning": "Your reasoning here"
    },
    ... other criteria ...
  ],
  "overallVerdict": "PASS/FAIL"
}

Note: If any single criterion fails, the overall verdict must be FAIL. Only if all criteria pass can the overall verdict be PASS.
`;

    // Call the Gemini API
    const result = await genModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract and parse the JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '').trim() : text;
    
    try {
      const parsedResponse = JSON.parse(jsonString);
      
      // Ensure the response has the expected structure
      if (!parsedResponse.criteria || !parsedResponse.overallVerdict) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      return parsedResponse as EvaluationResponse;
    } catch (parseError) {
      console.error("Error parsing Gemini API response:", parseError);
      throw new Error("Failed to parse Gemini API response");
    }
  } catch (error) {
    console.error("Error evaluating solution with Gemini API:", error);
    throw error;
  }
}
