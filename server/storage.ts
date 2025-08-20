import {
  users,
  members,
  contacts,
  applications,
  pointsTransactions,
  pointsSummary,
  rewards,
  rewardRedemptions,
  pointsRules,
  applicants,
  applicantDependents,
  insuranceTypes,
  insuranceProviders,
  insuranceQuotes,
  selectedQuotes,
  wishlist,
  policies,
  claims,
  claimDocuments,
  claimCommunications,
  claimWorkflowSteps,
  dependents,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Contact,
  type InsertContact,
  type Application,
  type InsertApplication,
  type PointsTransaction,
  type InsertPointsTransaction,
  type PointsSummary,
  type InsertPointsSummary,
  type Reward,
  type InsertReward,
  type RewardRedemption,
  type InsertRewardRedemption,
  type PointsRule,
  type InsertPointsRule,
  type Applicant,
  type InsertApplicant,
  type ApplicantDependent,
  type InsertApplicantDependent,
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
  type ClaimDocument,
  type InsertClaimDocument,
  type ClaimCommunication,
  type InsertClaimCommunication,
  type ClaimWorkflowStep,
  type InsertClaimWorkflowStep,
  type Dependent,
  type InsertDependent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, userData: Partial<UpsertUser>): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createDefaultAdminUser(): Promise<User | null>;
  
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
  updateClaim(id: number, claim: Partial<InsertClaim>): Promise<Claim>;
  getClaim(id: number): Promise<Claim | undefined>;
  getUserClaims(userId: string): Promise<(Claim & { policy: Policy & { quote: InsuranceQuote & { type: InsuranceType } } })[]>;
  getAllClaims(): Promise<Claim[]>;
  
  // Claim Documents
  uploadClaimDocument(document: InsertClaimDocument): Promise<ClaimDocument>;
  getClaimDocuments(claimId: number): Promise<ClaimDocument[]>;
  deleteClaimDocument(id: number): Promise<void>;
  
  // Claim Communications
  addClaimCommunication(communication: InsertClaimCommunication): Promise<ClaimCommunication>;
  getClaimCommunications(claimId: number): Promise<ClaimCommunication[]>;
  
  // Claim Workflow Steps
  createWorkflowStep(step: InsertClaimWorkflowStep): Promise<ClaimWorkflowStep>;
  updateWorkflowStep(id: number, step: Partial<InsertClaimWorkflowStep>): Promise<ClaimWorkflowStep>;
  getClaimWorkflowSteps(claimId: number): Promise<ClaimWorkflowStep[]>;
  initializeClaimWorkflow(claimId: number, claimType: string): Promise<ClaimWorkflowStep[]>;
  
  // Dependents
  createDependent(dependent: InsertDependent): Promise<Dependent>;
  getUserDependents(userId: string): Promise<Dependent[]>;
  removeDependent(id: number): Promise<void>;

  // Members
  createMember(member: InsertMember): Promise<Member>;
  getMembers(): Promise<Member[]>;
  getMemberById(id: number): Promise<Member | undefined>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplications(): Promise<Application[]>;
  getUserApplications(userId: string): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application>;
  deleteApplication(id: number): Promise<void>;

  // Points System
  // Points Transactions
  createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;
  getUserPointsTransactions(userId: string): Promise<PointsTransaction[]>;
  getPointsTransactionById(id: number): Promise<PointsTransaction | undefined>;
  
  // Points Summary
  getUserPointsSummary(userId: string): Promise<PointsSummary | undefined>;
  updatePointsSummary(userId: string, update: Partial<InsertPointsSummary>): Promise<PointsSummary>;
  initializeUserPointsSummary(userId: string): Promise<PointsSummary>;
  
  // Rewards
  createReward(reward: InsertReward): Promise<Reward>;
  getRewards(): Promise<Reward[]>;
  getActiveRewards(): Promise<Reward[]>;
  getRewardById(id: number): Promise<Reward | undefined>;
  updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward>;
  deleteReward(id: number): Promise<void>;
  
  // Reward Redemptions
  createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption>;
  getUserRedemptions(userId: string): Promise<(RewardRedemption & { reward: Reward })[]>;
  getRedemptionById(id: number): Promise<RewardRedemption | undefined>;
  updateRedemption(id: number, redemption: Partial<InsertRewardRedemption>): Promise<RewardRedemption>;
  
  // Points Rules
  createPointsRule(rule: InsertPointsRule): Promise<PointsRule>;
  getPointsRules(): Promise<PointsRule[]>;
  getActivePointsRules(): Promise<PointsRule[]>;
  getPointsRuleByCategory(category: string): Promise<PointsRule | undefined>;
  
  // Points Management Helper Methods
  awardPoints(userId: string, points: number, category: string, description: string, referenceId?: string, referenceType?: string): Promise<PointsTransaction>;
  redeemPoints(userId: string, points: number, description: string, rewardId?: number): Promise<PointsTransaction>;
  calculateTierLevel(totalPoints: number): Promise<{ tier: string; progress: number; nextThreshold: number }>;
  processPointsExpiration(): Promise<void>;

  // Applicants
  createApplicant(applicant: InsertApplicant): Promise<Applicant>;
  getApplicants(): Promise<Applicant[]>;
  getApplicationApplicants(applicationId: number): Promise<Applicant[]>;
  updateApplicant(id: number, applicant: Partial<InsertApplicant>): Promise<Applicant>;
  deleteApplicant(id: number): Promise<void>;

  // Applicant Dependents
  createApplicantDependent(dependent: InsertApplicantDependent): Promise<ApplicantDependent>;
  getApplicantDependents(): Promise<ApplicantDependent[]>;
  getApplicationDependents(applicationId: number): Promise<ApplicantDependent[]>;
  updateApplicantDependent(id: number, dependent: Partial<InsertApplicantDependent>): Promise<ApplicantDependent>;
  deleteApplicantDependent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
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

  async updateUserProfile(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createDefaultAdminUser(): Promise<User | null> {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@insurescope.com")).limit(1);
    if (existingAdmin.length > 0) {
      return existingAdmin[0];
    }

    // Create default admin user with password "Admin#pass1"
    // In production, this should use bcrypt for hashing
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash("Admin#pass1", 10);

    const [adminUser] = await db
      .insert(users)
      .values({
        id: "admin-default-user",
        email: "admin@insurescope.com",
        firstName: "System",
        lastName: "Administrator",
        password: hashedPassword,
        role: "Admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();
    
    return adminUser || null;
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

  async updateClaim(id: number, claim: Partial<InsertClaim>): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ ...claim, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();
    return updatedClaim;
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims).orderBy(desc(claims.createdAt));
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

  // Members
  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async getMembers(): Promise<Member[]> {
    return await db
      .select({
        id: members.id,
        userId: members.userId,
        memberNumber: members.memberNumber,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        dateOfBirth: members.dateOfBirth,
        phone: members.phone,
        address: members.address,
        city: members.city,
        state: members.state,
        zipCode: members.zipCode,
        ssn: members.ssn,
        profileImageUrl: members.profileImageUrl,
        avatarType: members.avatarType,
        avatarColor: members.avatarColor,
        bio: members.bio,
        emergencyContact: members.emergencyContact,
        preferences: members.preferences,
        membershipStatus: members.membershipStatus,
        membershipDate: members.membershipDate,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
      })
      .from(members)
      .orderBy(desc(members.createdAt));
  }

  async getMemberById(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  async getMemberByUserId(userId: string): Promise<Member | undefined> {
    const [member] = await db
      .select({
        id: members.id,
        userId: members.userId,
        memberNumber: members.memberNumber,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        dateOfBirth: members.dateOfBirth,
        phone: members.phone,
        address: members.address,
        city: members.city,
        state: members.state,
        zipCode: members.zipCode,
        ssn: members.ssn,
        profileImageUrl: members.profileImageUrl,
        avatarType: members.avatarType,
        avatarColor: members.avatarColor,
        bio: members.bio,
        emergencyContact: members.emergencyContact,
        preferences: members.preferences,
        membershipStatus: members.membershipStatus,
        membershipDate: members.membershipDate,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
      })
      .from(members)
      .where(eq(members.userId, userId));
    return member;
  }

  async upsertMemberProfile(userId: string, memberData: Partial<InsertMember>): Promise<Member> {
    // First try to update existing member
    const existing = await this.getMemberByUserId(userId);
    
    if (existing) {
      const [updatedMember] = await db
        .update(members)
        .set({ ...memberData, updatedAt: new Date() })
        .where(eq(members.userId, userId))
        .returning();
      return updatedMember;
    } else {
      // Create new member profile
      const [newMember] = await db
        .insert(members)
        .values({
          userId,
          memberNumber: `MBR${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate unique member number
          ...memberData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return newMember;
    }
  }

  // Contacts
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Applications
  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async getApplications(): Promise<Application[]> {
    return await db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  // Points
  async createPoints(pointsData: InsertPoints): Promise<Points> {
    const [newPoints] = await db.insert(points).values(pointsData).returning();
    return newPoints;
  }

  async getUserPoints(userId: string): Promise<Points[]> {
    return await db.select().from(points).where(eq(points.userId, userId)).orderBy(desc(points.createdAt));
  }

  async getMemberPoints(memberId: number): Promise<Points[]> {
    return await db.select().from(points).where(eq(points.memberId, memberId)).orderBy(desc(points.createdAt));
  }

  // Applicants
  async createApplicant(applicant: InsertApplicant): Promise<Applicant> {
    const [newApplicant] = await db.insert(applicants).values(applicant).returning();
    return newApplicant;
  }

  async getApplicants(): Promise<Applicant[]> {
    return await db.select().from(applicants).orderBy(desc(applicants.createdAt));
  }

  async getApplicationApplicants(applicationId: number): Promise<Applicant[]> {
    return await db.select().from(applicants).where(eq(applicants.applicationId, applicationId));
  }

  async updateApplicant(id: number, applicant: Partial<InsertApplicant>): Promise<Applicant> {
    const [updatedApplicant] = await db
      .update(applicants)
      .set({ ...applicant, updatedAt: new Date() })
      .where(eq(applicants.id, id))
      .returning();
    return updatedApplicant;
  }

  async deleteApplicant(id: number): Promise<void> {
    await db.delete(applicants).where(eq(applicants.id, id));
  }

  // Applicant Dependents
  async createApplicantDependent(dependent: InsertApplicantDependent): Promise<ApplicantDependent> {
    const [newDependent] = await db.insert(applicantDependents).values(dependent).returning();
    return newDependent;
  }

  async getApplicantDependents(): Promise<ApplicantDependent[]> {
    return await db.select().from(applicantDependents).orderBy(desc(applicantDependents.createdAt));
  }

  async getApplicationDependents(applicationId: number): Promise<ApplicantDependent[]> {
    return await db.select().from(applicantDependents).where(eq(applicantDependents.applicationId, applicationId));
  }

  async updateApplicantDependent(id: number, dependent: Partial<InsertApplicantDependent>): Promise<ApplicantDependent> {
    const [updatedDependent] = await db
      .update(applicantDependents)
      .set({ ...dependent, updatedAt: new Date() })
      .where(eq(applicantDependents.id, id))
      .returning();
    return updatedDependent;
  }

  async deleteApplicantDependent(id: number): Promise<void> {
    await db.delete(applicantDependents).where(eq(applicantDependents.id, id));
  }

  // Claim Documents
  async uploadClaimDocument(document: InsertClaimDocument): Promise<ClaimDocument> {
    const [newDocument] = await db.insert(claimDocuments).values(document).returning();
    return newDocument;
  }

  async getClaimDocuments(claimId: number): Promise<ClaimDocument[]> {
    return await db.select().from(claimDocuments).where(eq(claimDocuments.claimId, claimId));
  }

  async deleteClaimDocument(id: number): Promise<void> {
    await db.delete(claimDocuments).where(eq(claimDocuments.id, id));
  }

  // Claim Communications
  async addClaimCommunication(communication: InsertClaimCommunication): Promise<ClaimCommunication> {
    const [newCommunication] = await db.insert(claimCommunications).values(communication).returning();
    return newCommunication;
  }

  async getClaimCommunications(claimId: number): Promise<ClaimCommunication[]> {
    return await db.select().from(claimCommunications)
      .where(eq(claimCommunications.claimId, claimId))
      .orderBy(desc(claimCommunications.createdAt));
  }

  // Claim Workflow Steps
  async createWorkflowStep(step: InsertClaimWorkflowStep): Promise<ClaimWorkflowStep> {
    const [newStep] = await db.insert(claimWorkflowSteps).values(step).returning();
    return newStep;
  }

  async updateWorkflowStep(id: number, step: Partial<InsertClaimWorkflowStep>): Promise<ClaimWorkflowStep> {
    const [updatedStep] = await db
      .update(claimWorkflowSteps)
      .set({ ...step, updatedAt: new Date() })
      .where(eq(claimWorkflowSteps.id, id))
      .returning();
    return updatedStep;
  }

  async getClaimWorkflowSteps(claimId: number): Promise<ClaimWorkflowStep[]> {
    return await db.select().from(claimWorkflowSteps)
      .where(eq(claimWorkflowSteps.claimId, claimId))
      .orderBy(claimWorkflowSteps.createdAt);
  }

  async initializeClaimWorkflow(claimId: number, claimType: string): Promise<ClaimWorkflowStep[]> {
    // Define workflow steps based on claim type
    const workflowTemplates = {
      medical: [
        { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
        { stepName: "Medical Review", stepDescription: "Medical professional reviews claim details" },
        { stepName: "Verification", stepDescription: "Verify medical records and treatment" },
        { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
        { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
      ],
      dental: [
        { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
        { stepName: "Dental Review", stepDescription: "Dental professional reviews claim details" },
        { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
        { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
      ],
      vision: [
        { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
        { stepName: "Vision Review", stepDescription: "Vision care professional reviews claim details" },
        { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
        { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
      ],
      life: [
        { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
        { stepName: "Investigation", stepDescription: "Investigate claim circumstances" },
        { stepName: "Documentation Review", stepDescription: "Review all required documentation" },
        { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
        { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
      ],
      disability: [
        { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
        { stepName: "Medical Evaluation", stepDescription: "Medical evaluation of disability claim" },
        { stepName: "Vocational Assessment", stepDescription: "Assess work capability and vocational factors" },
        { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
        { stepName: "Payment Setup", stepDescription: "Setup ongoing disability payments" }
      ]
    };

    const template = workflowTemplates[claimType.toLowerCase() as keyof typeof workflowTemplates] || workflowTemplates.medical;
    
    const steps: ClaimWorkflowStep[] = [];
    for (const [index, stepTemplate] of template.entries()) {
      const step = await this.createWorkflowStep({
        claimId,
        stepName: stepTemplate.stepName,
        stepDescription: stepTemplate.stepDescription,
        status: index === 0 ? "in_progress" : "pending"
      });
      steps.push(step);
    }

    return steps;
  }

  // Points System Implementation
  // Points Transactions
  async createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction> {
    const [result] = await db.insert(pointsTransactions).values(transaction).returning();
    
    // Update user's points summary
    await this.updatePointsSummaryAfterTransaction(transaction.userId, transaction.points, transaction.transactionType);
    
    return result;
  }

  async getUserPointsTransactions(userId: string): Promise<PointsTransaction[]> {
    return await db.select().from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt));
  }

  async getPointsTransactionById(id: number): Promise<PointsTransaction | undefined> {
    const [transaction] = await db.select().from(pointsTransactions)
      .where(eq(pointsTransactions.id, id));
    return transaction;
  }

  // Points Summary
  async getUserPointsSummary(userId: string): Promise<PointsSummary | undefined> {
    const [summary] = await db.select().from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));
    return summary;
  }

  async updatePointsSummary(userId: string, update: Partial<InsertPointsSummary>): Promise<PointsSummary> {
    const [result] = await db.update(pointsSummary)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(pointsSummary.userId, userId))
      .returning();
    return result;
  }

  async initializeUserPointsSummary(userId: string): Promise<PointsSummary> {
    const [result] = await db.insert(pointsSummary)
      .values({
        userId,
        totalEarned: 0,
        totalRedeemed: 0,
        currentBalance: 0,
        lifetimeBalance: 0,
        tierLevel: "Bronze",
        tierProgress: 0,
        nextTierThreshold: 500
      })
      .returning();
    return result;
  }

  // Private helper method to update points summary after transactions
  private async updatePointsSummaryAfterTransaction(userId: string, points: number, transactionType: string): Promise<void> {
    let summary = await this.getUserPointsSummary(userId);
    
    if (!summary) {
      summary = await this.initializeUserPointsSummary(userId);
    }

    const updates: Partial<InsertPointsSummary> = {};
    
    if (transactionType === "Earned" || transactionType === "Bonus" || transactionType === "Referral") {
      updates.totalEarned = (summary.totalEarned || 0) + points;
      updates.currentBalance = (summary.currentBalance || 0) + points;
      updates.lifetimeBalance = (summary.lifetimeBalance || 0) + points;
      updates.lastEarnedAt = new Date();
    } else if (transactionType === "Redeemed") {
      updates.totalRedeemed = (summary.totalRedeemed || 0) + Math.abs(points);
      updates.currentBalance = (summary.currentBalance || 0) - Math.abs(points);
    }

    // Calculate tier progression
    if (updates.lifetimeBalance !== undefined) {
      const tierInfo = await this.calculateTierLevel(updates.lifetimeBalance);
      updates.tierLevel = tierInfo.tier as any;
      updates.tierProgress = tierInfo.progress;
      updates.nextTierThreshold = tierInfo.nextThreshold;
    }

    await this.updatePointsSummary(userId, updates);
  }

  // Rewards
  async createReward(reward: InsertReward): Promise<Reward> {
    const [result] = await db.insert(rewards).values(reward).returning();
    return result;
  }

  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async getActiveRewards(): Promise<Reward[]> {
    return await db.select().from(rewards)
      .where(eq(rewards.isActive, true))
      .orderBy(rewards.pointsCost);
  }

  async getRewardById(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards)
      .where(eq(rewards.id, id));
    return reward;
  }

  async updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward> {
    const [result] = await db.update(rewards)
      .set({ ...reward, updatedAt: new Date() })
      .where(eq(rewards.id, id))
      .returning();
    return result;
  }

  async deleteReward(id: number): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  // Reward Redemptions
  async createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption> {
    const [result] = await db.insert(rewardRedemptions).values(redemption).returning();
    return result;
  }

  async getUserRedemptions(userId: string): Promise<(RewardRedemption & { reward: Reward })[]> {
    return await db.select()
      .from(rewardRedemptions)
      .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
      .where(eq(rewardRedemptions.userId, userId))
      .orderBy(desc(rewardRedemptions.createdAt)) as any;
  }

  async getRedemptionById(id: number): Promise<RewardRedemption | undefined> {
    const [redemption] = await db.select().from(rewardRedemptions)
      .where(eq(rewardRedemptions.id, id));
    return redemption;
  }

  async updateRedemption(id: number, redemption: Partial<InsertRewardRedemption>): Promise<RewardRedemption> {
    const [result] = await db.update(rewardRedemptions)
      .set({ ...redemption, updatedAt: new Date() })
      .where(eq(rewardRedemptions.id, id))
      .returning();
    return result;
  }

  // Points Rules
  async createPointsRule(rule: InsertPointsRule): Promise<PointsRule> {
    const [result] = await db.insert(pointsRules).values(rule).returning();
    return result;
  }

  async getPointsRules(): Promise<PointsRule[]> {
    return await db.select().from(pointsRules).orderBy(pointsRules.category);
  }

  async getActivePointsRules(): Promise<PointsRule[]> {
    return await db.select().from(pointsRules)
      .where(eq(pointsRules.isActive, true))
      .orderBy(pointsRules.category);
  }

  async getPointsRuleByCategory(category: string): Promise<PointsRule | undefined> {
    const [rule] = await db.select().from(pointsRules)
      .where(and(
        eq(pointsRules.category, category as any),
        eq(pointsRules.isActive, true)
      ));
    return rule;
  }

  // Points Management Helper Methods
  async awardPoints(
    userId: string, 
    points: number, 
    category: string, 
    description: string, 
    referenceId?: string, 
    referenceType?: string
  ): Promise<PointsTransaction> {
    const summary = await this.getUserPointsSummary(userId);
    const balanceAfter = (summary?.currentBalance || 0) + points;

    return await this.createPointsTransaction({
      userId,
      transactionType: "Earned",
      points,
      description,
      category: category as any,
      referenceId,
      referenceType,
      balanceAfter
    });
  }

  async redeemPoints(
    userId: string, 
    points: number, 
    description: string, 
    rewardId?: number
  ): Promise<PointsTransaction> {
    const summary = await this.getUserPointsSummary(userId);
    
    if (!summary || summary.currentBalance < points) {
      throw new Error("Insufficient points balance");
    }

    const balanceAfter = summary.currentBalance - points;

    return await this.createPointsTransaction({
      userId,
      transactionType: "Redeemed",
      points: -points, // Negative for redemption
      description,
      category: "Redemption",
      referenceId: rewardId?.toString(),
      referenceType: "reward",
      balanceAfter
    });
  }

  async calculateTierLevel(totalPoints: number): Promise<{ tier: string; progress: number; nextThreshold: number }> {
    const tierThresholds = {
      Bronze: 0,
      Silver: 500,
      Gold: 1500,
      Platinum: 3000,
      Diamond: 5000
    };

    let currentTier = "Bronze";
    let nextThreshold = 500;

    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (totalPoints >= threshold) {
        currentTier = tier;
      }
    }

    // Calculate next threshold
    const tierKeys = Object.keys(tierThresholds);
    const currentTierIndex = tierKeys.indexOf(currentTier);
    if (currentTierIndex < tierKeys.length - 1) {
      nextThreshold = Object.values(tierThresholds)[currentTierIndex + 1];
    } else {
      nextThreshold = totalPoints; // Already at highest tier
    }

    const currentThreshold = tierThresholds[currentTier as keyof typeof tierThresholds];
    const progress = nextThreshold > totalPoints ? totalPoints - currentThreshold : nextThreshold - currentThreshold;

    return { tier: currentTier, progress, nextThreshold };
  }

  async processPointsExpiration(): Promise<void> {
    // Process expired points (points with expiresAt in the past)
    const expiredTransactions = await db.select().from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.transactionType, "Earned"),
        // Add condition for expired points if needed
      ));

    // Implementation for processing expired points
    // This would typically run as a scheduled job
  }
}

export const storage = new DatabaseStorage();
