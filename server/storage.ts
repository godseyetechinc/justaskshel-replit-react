import {
  users,
  members,
  contacts,
  applications,
  points,
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
  type Points,
  type InsertPoints,
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
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, userData: Partial<UpsertUser>): Promise<User>;
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

  // Points
  createPoints(points: InsertPoints): Promise<Points>;
  getUserPoints(userId: string): Promise<Points[]>;
  getMemberPoints(memberId: number): Promise<Points[]>;

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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createDefaultAdminUser(): Promise<User | null> {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.role, "Admin")).limit(1);
    if (existingAdmin.length > 0) {
      return existingAdmin[0];
    }

    // Create default admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        id: "admin-default-user",
        email: "admin@insurescope.com",
        firstName: "System",
        lastName: "Administrator",
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
    return await db.select().from(members).orderBy(desc(members.createdAt));
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
}

export const storage = new DatabaseStorage();
