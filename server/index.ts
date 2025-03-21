import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Function to load solutions from CSV file
async function loadSolutionsFromCSV() {
  const csvFilePath = path.resolve("selected_solutions.csv");
  
  // Check if the CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    log(`CSV file not found at ${csvFilePath}`);
    return;
  }

  log(`Loading solutions from CSV file: ${csvFilePath}`);
  const solutions: any[] = [];

  // Parse CSV file
  const parser = fs.createReadStream(csvFilePath)
    .pipe(parse({ columns: true, trim: true }));

  for await (const data of parser) {
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
  }

  // Save solutions to storage
  for (const solution of solutions) {
    await storage.createOrUpdateSolution(solution);
  }

  log(`Successfully loaded ${solutions.length} solutions from CSV file`);
}

(async () => {
  // Load solutions from CSV file
  await loadSolutionsFromCSV();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
