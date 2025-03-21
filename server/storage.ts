import { users, type User, type InsertUser, type Solution, type InsertSolution, type Evaluation, type InsertEvaluation } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Solution operations
  getAllSolutions(): Promise<Solution[]>;
  getSolutionById(solutionId: string): Promise<Solution | undefined>;
  createOrUpdateSolution(solution: InsertSolution): Promise<Solution>;
  
  // Evaluation operations
  storeEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationsBySolutionId(solutionId: string): Promise<Evaluation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private solutions: Map<string, Solution>;
  private evaluations: Map<number, Evaluation>;
  private userId: number;
  private solutionId: number;
  private evaluationId: number;

  constructor() {
    this.users = new Map();
    this.solutions = new Map();
    this.evaluations = new Map();
    this.userId = 1;
    this.solutionId = 1;
    this.evaluationId = 1;
  }

  // User operations (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Solution operations
  async getAllSolutions(): Promise<Solution[]> {
    return Array.from(this.solutions.values());
  }

  async getSolutionById(solutionId: string): Promise<Solution | undefined> {
    return Array.from(this.solutions.values()).find(
      (solution) => solution.solutionId === solutionId
    );
  }

  async createOrUpdateSolution(insertSolution: InsertSolution): Promise<Solution> {
    const existingSolution = await this.getSolutionById(insertSolution.solutionId);
    
    if (existingSolution) {
      // Update existing solution
      const updatedSolution: Solution = {
        ...existingSolution,
        ...insertSolution
      };
      this.solutions.set(existingSolution.id, updatedSolution);
      return updatedSolution;
    } else {
      // Create new solution
      const id = this.solutionId++;
      const solution: Solution = { ...insertSolution, id };
      this.solutions.set(id, solution);
      return solution;
    }
  }

  // Evaluation operations
  async storeEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = this.evaluationId++;
    const evaluation: Evaluation = { ...insertEvaluation, id };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  async getEvaluationsBySolutionId(solutionId: string): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).filter(
      (evaluation) => evaluation.solutionId === solutionId
    );
  }
}

export const storage = new MemStorage();
