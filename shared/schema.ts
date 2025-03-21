import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Solution table - storing solution data from CSV
export const solutions = pgTable("solutions", {
  id: serial("id").primaryKey(),
  solutionId: text("solution_id").notNull().unique(),
  challengeName: text("challenge_name"),
  summary: text("summary"),
  headquarters: text("headquarters"),
  organizationType: text("organization_type"),
  problemStatement: text("problem_statement"),
  solutionDescription: text("solution_description"),
  targetBeneficiaries: text("target_beneficiaries"),
  technologiesUsed: text("technologies_used"),
  websiteLinks: text("website_links"),
  operatingCountries: text("operating_countries"),
  teamSize: text("team_size"),
  duration: text("duration"),
  diversityApproaches: text("diversity_approaches"),
  businessModel: text("business_model"),
  serviceDeliveryModel: text("service_delivery_model"),
  financialSustainability: text("financial_sustainability"),
});

// Evaluation schema for storing past evaluations
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  solutionId: text("solution_id").notNull(),
  timestamp: text("timestamp").notNull(),
  results: jsonb("results").notNull(),
  overallVerdict: text("overall_verdict").notNull(),
  modelUsed: text("model_used").notNull(),
  temperature: text("temperature").notNull(),
});

// Solution schema for insertion
export const insertSolutionSchema = createInsertSchema(solutions).omit({
  id: true,
});

// Evaluation schema for insertion
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
});

// Types
export type Solution = typeof solutions.$inferSelect;
export type InsertSolution = z.infer<typeof insertSolutionSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;

// User table - keeping it from the template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema for Gemini API evaluation responses
export const criterionSchema = z.object({
  id: z.number(),
  name: z.string(),
  result: z.enum(["PASS", "FAIL"]),
  reasoning: z.string()
});

export const evaluationResponseSchema = z.object({
  criteria: z.array(criterionSchema),
  overallVerdict: z.enum(["PASS", "FAIL"])
});

export type CriterionResult = z.infer<typeof criterionSchema>;
export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
