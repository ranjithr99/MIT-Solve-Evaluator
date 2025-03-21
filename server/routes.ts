import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluationResponseSchema } from "@shared/schema";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";
import { evaluateSolution } from "./gemini";

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Simple rate limiter implementation
class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // in milliseconds

  constructor(maxRequests: number, timeWindowSeconds: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowSeconds * 1000;
  }

  isRateLimited(): boolean {
    const now = Date.now();
    // Remove expired timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= this.maxRequests) {
      return true;
    }
    
    // Add current timestamp and allow the request
    this.requestTimestamps.push(now);
    return false;
  }
  
  getTimeToWait(): number {
    if (this.requestTimestamps.length === 0) return 0;
    
    const now = Date.now();
    const oldestTimestamp = this.requestTimestamps[0];
    const timeToWait = this.timeWindow - (now - oldestTimestamp);
    
    return Math.max(0, timeToWait);
  }
}

// Create rate limiter: 5 requests per 60 seconds
const evaluationRateLimiter = new RateLimiter(5, 60);

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const API_PREFIX = "/api";

  // Get all solutions
  app.get(`${API_PREFIX}/solutions`, async (req, res) => {
    try {
      const solutions = await storage.getAllSolutions();
      res.json(solutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get solutions", error: String(error) });
    }
  });

  // Get solution by ID
  app.get(`${API_PREFIX}/solutions/:id`, async (req, res) => {
    try {
      const solution = await storage.getSolutionById(req.params.id);
      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }
      res.json(solution);
    } catch (error) {
      res.status(500).json({ message: "Failed to get solution", error: String(error) });
    }
  });

  // Upload CSV file
  app.post(`${API_PREFIX}/solutions/upload`, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      const solutions: any[] = [];

      // Parse CSV file
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => {
          // Transform CSV data to match our schema
          const solution = {
            solutionId: data["Solution ID"] || "",
            challengeName: data["Challenge Name"] || "",
            summary: data["Provide a one-line summary of your solution."] || "",
            headquarters: data["In what city, town, or region is your solution team headquartered?"] || "",
            organizationType: data["What type of organization is your solution team?"] || "",
            problemStatement: data["What specific problem are you solving?"] || "",
            solutionDescription: data["What is your solution?"] || "",
            targetBeneficiaries: data["Who does your solution serve, and in what ways will the solution impact their lives? "] || "",
            technologiesUsed: data["Please select the technologies currently used in your solution:"] || "",
            websiteLinks: data["If your solution has a website, app, or social media handle, provide the link(s) here:"] || "",
            operatingCountries: data["In which countries do you currently operate?"] || "",
            teamSize: data["How many people work on your solution team?"] || "",
            duration: data["How long have you been working on your solution? "] || "",
            diversityApproaches: data["Tell us about how you ensure that your team is diverse, minimizes barriers to opportunity for staff, and provides a welcoming and inclusive environment for all team members."] || "",
            businessModel: data["What is your business model?"] || "",
            serviceDeliveryModel: data["Do you primarily provide products or services directly to individuals, to other organizations, or to the government?"] || "",
            financialSustainability: data["What is your plan for becoming financially sustainable, and what evidence can you provide that this plan has been successful so far?"] || "",
          };
          solutions.push(solution);
        })
        .on("end", async () => {
          // Clean up the temp file
          fs.unlinkSync(filePath);
          
          // Save solutions to storage
          for (const solution of solutions) {
            await storage.createOrUpdateSolution(solution);
          }
          
          res.json({ message: `Successfully imported ${solutions.length} solutions` });
        })
        .on("error", (error) => {
          // Clean up on error
          fs.unlinkSync(filePath);
          res.status(500).json({ message: "Failed to parse CSV", error: String(error) });
        });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload CSV", error: String(error) });
    }
  });

  // Evaluate a solution using Gemini API
  app.post(`${API_PREFIX}/evaluate/:id`, async (req, res) => {
    try {
      // Check rate limit
      if (evaluationRateLimiter.isRateLimited()) {
        const timeToWait = evaluationRateLimiter.getTimeToWait();
        return res.status(429).json({ 
          message: "Rate limit exceeded. Too many requests to the Gemini API.",
          retryAfter: Math.ceil(timeToWait / 1000), // in seconds
        });
      }

      const { model, temperature } = req.body;
      if (!model || temperature === undefined) {
        return res.status(400).json({ message: "Model and temperature are required" });
      }

      const solution = await storage.getSolutionById(req.params.id);
      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }

      // Call Gemini API for evaluation
      const evaluationResult = await evaluateSolution(solution, model, parseFloat(temperature));
      
      // Validate the evaluation result
      const validatedResult = evaluationResponseSchema.parse(evaluationResult);

      // Store the evaluation result
      const evaluation = {
        solutionId: solution.solutionId,
        timestamp: new Date().toISOString(),
        results: evaluationResult,
        overallVerdict: validatedResult.overallVerdict,
        modelUsed: model,
        temperature: temperature.toString()
      };
      
      await storage.storeEvaluation(evaluation);
      
      res.json(evaluationResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to evaluate solution", error: String(error) });
    }
  });

  // Get previous evaluations for a solution
  app.get(`${API_PREFIX}/evaluations/:id`, async (req, res) => {
    try {
      const evaluations = await storage.getEvaluationsBySolutionId(req.params.id);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evaluations", error: String(error) });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
