import {
  users,
  insuranceTypes,
  insuranceProviders,
  insuranceQuotes,
  selectedQuotes,
  wishlist,
  policies,
  claims,
  dependents,
  type User,
  type UpsertUser,
  type InsuranceType,
  type InsuranceProvider,
  type InsuranceQuote,
  type InsertInsuranceQuote,
  type SelectedQuote,
  type InsertSelectedQuote,
  type Wishlist,
  type InsertWishlist,
  type Policy,
  type InsertPolicy,
  type Claim,
  type InsertClaim,
  type Dependent,
  type InsertDependent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Insurance types
  getInsuranceTypes(): Promise<InsuranceType[]>;
  
  // Insurance providers
  getInsuranceProviders(): Promise<InsuranceProvider[]>;
  
  // Insurance quotes
  searchQuotes(filters: {
    typeId?: number;
    userId?: string;
    ageRange?: string;
    zipCode?: string;
    coverageAmount?: string;
  }): Promise<(InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider })[]>;
  createQuote(quote: InsertInsuranceQuote): Promise<InsuranceQuote>;
  getQuoteById(id: number): Promise<(InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider }) | undefined>;
  
  // Selected quotes
  addToSelectedQuotes(data: InsertSelectedQuote): Promise<SelectedQuote>;
  removeFromSelectedQuotes(userId: string, quoteId: number): Promise<void>;
  getUserSelectedQuotes(userId: string): Promise<(SelectedQuote & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]>;
  
  // Wishlist
  addToWishlist(data: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, quoteId: number): Promise<void>;
  getUserWishlist(userId: string): Promise<(Wishlist & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]>;
  
  // Policies
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  getUserPolicies(userId: string): Promise<(Policy & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]>;
  
  // Claims
  createClaim(claim: InsertClaim): Promise<Claim>;
  getUserClaims(userId: string): Promise<(Claim & { policy: Policy & { quote: InsuranceQuote & { type: InsuranceType } } })[]>;
  
  // Dependents
  createDependent(dependent: InsertDependent): Promise<Dependent>;
  getUserDependents(userId: string): Promise<Dependent[]>;
  removeDependent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Insurance types
  async getInsuranceTypes(): Promise<InsuranceType[]> {
    return await db.select().from(insuranceTypes);
  }

  // Insurance providers
  async getInsuranceProviders(): Promise<InsuranceProvider[]> {
    return await db.select().from(insuranceProviders);
  }

  // Insurance quotes
  async searchQuotes(filters: {
    typeId?: number;
    userId?: string;
    ageRange?: string;
    zipCode?: string;
    coverageAmount?: string;
  }): Promise<(InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider })[]> {
    let query = db
      .select({
        id: insuranceQuotes.id,
        userId: insuranceQuotes.userId,
        typeId: insuranceQuotes.typeId,
        providerId: insuranceQuotes.providerId,
        monthlyPremium: insuranceQuotes.monthlyPremium,
        coverageAmount: insuranceQuotes.coverageAmount,
        termLength: insuranceQuotes.termLength,
        deductible: insuranceQuotes.deductible,
        medicalExamRequired: insuranceQuotes.medicalExamRequired,
        conversionOption: insuranceQuotes.conversionOption,
        features: insuranceQuotes.features,
        createdAt: insuranceQuotes.createdAt,
        type: insuranceTypes,
        provider: insuranceProviders,
      })
      .from(insuranceQuotes)
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .leftJoin(insuranceProviders, eq(insuranceQuotes.providerId, insuranceProviders.id));

    if (filters.typeId) {
      query = query.where(eq(insuranceQuotes.typeId, filters.typeId));
    }

    return await query;
  }

  async createQuote(quote: InsertInsuranceQuote): Promise<InsuranceQuote> {
    const [newQuote] = await db.insert(insuranceQuotes).values(quote).returning();
    return newQuote;
  }

  async getQuoteById(id: number): Promise<(InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider }) | undefined> {
    const [result] = await db
      .select({
        id: insuranceQuotes.id,
        userId: insuranceQuotes.userId,
        typeId: insuranceQuotes.typeId,
        providerId: insuranceQuotes.providerId,
        monthlyPremium: insuranceQuotes.monthlyPremium,
        coverageAmount: insuranceQuotes.coverageAmount,
        termLength: insuranceQuotes.termLength,
        deductible: insuranceQuotes.deductible,
        medicalExamRequired: insuranceQuotes.medicalExamRequired,
        conversionOption: insuranceQuotes.conversionOption,
        features: insuranceQuotes.features,
        createdAt: insuranceQuotes.createdAt,
        type: insuranceTypes,
        provider: insuranceProviders,
      })
      .from(insuranceQuotes)
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .leftJoin(insuranceProviders, eq(insuranceQuotes.providerId, insuranceProviders.id))
      .where(eq(insuranceQuotes.id, id));
    
    return result;
  }

  // Selected quotes
  async addToSelectedQuotes(data: InsertSelectedQuote): Promise<SelectedQuote> {
    const [result] = await db.insert(selectedQuotes).values(data).returning();
    return result;
  }

  async removeFromSelectedQuotes(userId: string, quoteId: number): Promise<void> {
    await db.delete(selectedQuotes).where(
      and(eq(selectedQuotes.userId, userId), eq(selectedQuotes.quoteId, quoteId))
    );
  }

  async getUserSelectedQuotes(userId: string): Promise<(SelectedQuote & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]> {
    return await db
      .select({
        id: selectedQuotes.id,
        userId: selectedQuotes.userId,
        quoteId: selectedQuotes.quoteId,
        createdAt: selectedQuotes.createdAt,
        quote: {
          id: insuranceQuotes.id,
          userId: insuranceQuotes.userId,
          typeId: insuranceQuotes.typeId,
          providerId: insuranceQuotes.providerId,
          monthlyPremium: insuranceQuotes.monthlyPremium,
          coverageAmount: insuranceQuotes.coverageAmount,
          termLength: insuranceQuotes.termLength,
          deductible: insuranceQuotes.deductible,
          medicalExamRequired: insuranceQuotes.medicalExamRequired,
          conversionOption: insuranceQuotes.conversionOption,
          features: insuranceQuotes.features,
          createdAt: insuranceQuotes.createdAt,
          type: insuranceTypes,
          provider: insuranceProviders,
        },
      })
      .from(selectedQuotes)
      .leftJoin(insuranceQuotes, eq(selectedQuotes.quoteId, insuranceQuotes.id))
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .leftJoin(insuranceProviders, eq(insuranceQuotes.providerId, insuranceProviders.id))
      .where(eq(selectedQuotes.userId, userId))
      .orderBy(desc(selectedQuotes.createdAt));
  }

  // Wishlist
  async addToWishlist(data: InsertWishlist): Promise<Wishlist> {
    const [result] = await db.insert(wishlist).values(data).returning();
    return result;
  }

  async removeFromWishlist(userId: string, quoteId: number): Promise<void> {
    await db.delete(wishlist).where(
      and(eq(wishlist.userId, userId), eq(wishlist.quoteId, quoteId))
    );
  }

  async getUserWishlist(userId: string): Promise<(Wishlist & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]> {
    return await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        quoteId: wishlist.quoteId,
        createdAt: wishlist.createdAt,
        quote: {
          id: insuranceQuotes.id,
          userId: insuranceQuotes.userId,
          typeId: insuranceQuotes.typeId,
          providerId: insuranceQuotes.providerId,
          monthlyPremium: insuranceQuotes.monthlyPremium,
          coverageAmount: insuranceQuotes.coverageAmount,
          termLength: insuranceQuotes.termLength,
          deductible: insuranceQuotes.deductible,
          medicalExamRequired: insuranceQuotes.medicalExamRequired,
          conversionOption: insuranceQuotes.conversionOption,
          features: insuranceQuotes.features,
          createdAt: insuranceQuotes.createdAt,
          type: insuranceTypes,
          provider: insuranceProviders,
        },
      })
      .from(wishlist)
      .leftJoin(insuranceQuotes, eq(wishlist.quoteId, insuranceQuotes.id))
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .leftJoin(insuranceProviders, eq(insuranceQuotes.providerId, insuranceProviders.id))
      .where(eq(wishlist.userId, userId))
      .orderBy(desc(wishlist.createdAt));
  }

  // Policies
  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const [newPolicy] = await db.insert(policies).values(policy).returning();
    return newPolicy;
  }

  async getUserPolicies(userId: string): Promise<(Policy & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]> {
    return await db
      .select({
        id: policies.id,
        userId: policies.userId,
        quoteId: policies.quoteId,
        policyNumber: policies.policyNumber,
        status: policies.status,
        startDate: policies.startDate,
        endDate: policies.endDate,
        nextPaymentDate: policies.nextPaymentDate,
        createdAt: policies.createdAt,
        quote: {
          id: insuranceQuotes.id,
          userId: insuranceQuotes.userId,
          typeId: insuranceQuotes.typeId,
          providerId: insuranceQuotes.providerId,
          monthlyPremium: insuranceQuotes.monthlyPremium,
          coverageAmount: insuranceQuotes.coverageAmount,
          termLength: insuranceQuotes.termLength,
          deductible: insuranceQuotes.deductible,
          medicalExamRequired: insuranceQuotes.medicalExamRequired,
          conversionOption: insuranceQuotes.conversionOption,
          features: insuranceQuotes.features,
          createdAt: insuranceQuotes.createdAt,
          type: insuranceTypes,
          provider: insuranceProviders,
        },
      })
      .from(policies)
      .leftJoin(insuranceQuotes, eq(policies.quoteId, insuranceQuotes.id))
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .leftJoin(insuranceProviders, eq(insuranceQuotes.providerId, insuranceProviders.id))
      .where(eq(policies.userId, userId))
      .orderBy(desc(policies.createdAt));
  }

  // Claims
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db.insert(claims).values(claim).returning();
    return newClaim;
  }

  async getUserClaims(userId: string): Promise<(Claim & { policy: Policy & { quote: InsuranceQuote & { type: InsuranceType } } })[]> {
    return await db
      .select({
        id: claims.id,
        userId: claims.userId,
        policyId: claims.policyId,
        claimNumber: claims.claimNumber,
        description: claims.description,
        amount: claims.amount,
        status: claims.status,
        submittedAt: claims.submittedAt,
        processedAt: claims.processedAt,
        policy: {
          id: policies.id,
          userId: policies.userId,
          quoteId: policies.quoteId,
          policyNumber: policies.policyNumber,
          status: policies.status,
          startDate: policies.startDate,
          endDate: policies.endDate,
          nextPaymentDate: policies.nextPaymentDate,
          createdAt: policies.createdAt,
          quote: {
            id: insuranceQuotes.id,
            userId: insuranceQuotes.userId,
            typeId: insuranceQuotes.typeId,
            providerId: insuranceQuotes.providerId,
            monthlyPremium: insuranceQuotes.monthlyPremium,
            coverageAmount: insuranceQuotes.coverageAmount,
            termLength: insuranceQuotes.termLength,
            deductible: insuranceQuotes.deductible,
            medicalExamRequired: insuranceQuotes.medicalExamRequired,
            conversionOption: insuranceQuotes.conversionOption,
            features: insuranceQuotes.features,
            createdAt: insuranceQuotes.createdAt,
            type: insuranceTypes,
          },
        },
      })
      .from(claims)
      .leftJoin(policies, eq(claims.policyId, policies.id))
      .leftJoin(insuranceQuotes, eq(policies.quoteId, insuranceQuotes.id))
      .leftJoin(insuranceTypes, eq(insuranceQuotes.typeId, insuranceTypes.id))
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.submittedAt));
  }

  // Dependents
  async createDependent(dependent: InsertDependent): Promise<Dependent> {
    const [newDependent] = await db.insert(dependents).values(dependent).returning();
    return newDependent;
  }

  async getUserDependents(userId: string): Promise<Dependent[]> {
    return await db.select().from(dependents).where(eq(dependents.userId, userId));
  }

  async removeDependent(id: number): Promise<void> {
    await db.delete(dependents).where(eq(dependents.id, id));
  }
}

export const storage = new DatabaseStorage();
