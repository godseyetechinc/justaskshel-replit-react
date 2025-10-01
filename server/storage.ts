import {
  users,
  members,
  contacts,
  pointsTransactions,
  pointsSummary,
  rewards,
  rewardRedemptions,
  pointsRules,
  insuranceTypes,
  insuranceProviders,
  insuranceQuotes,
  externalQuoteRequests,
  selectedQuotes,
  wishlist,
  policies,
  claims,
  claimDocuments,
  claimCommunications,
  claimWorkflowSteps,
  dependents,
  agentOrganizations,
  agentProfiles,
  policyDocuments,
  premiumPayments,
  policyAmendments,
  persons,
  personUsers,
  personMembers,
  personContacts,
  clientAssignments,
  policyTransfers,
  agentCommissions,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Contact,
  type InsertContact,
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
  type PolicyDocument,
  type InsertPolicyDocument,
  type PremiumPayment,
  type InsertPremiumPayment,
  type PolicyAmendment,
  type InsertPolicyAmendment,
  type ExternalQuoteRequest,
  type InsertExternalQuoteRequest,
  type Person,
  type InsertPerson,
  type PersonUser,
  type InsertPersonUser,
  type PersonMember,
  type InsertPersonMember,
  type PersonContact,
  type InsertPersonContact,
  type OrganizationInvitation,
  type InsertOrganizationInvitation,
  type AgentOrganization,
  type InsertAgentOrganization,
  type ClientAssignment,
  type InsertClientAssignment,
  type PolicyTransfer,
  type InsertPolicyTransfer,
  type AgentCommission,
  type InsertAgentCommission,
  organizationInvitations,
  agentOrganizations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, gte, lte, ne, gt, asc, isNull, isNotNull, ilike, inArray } from "drizzle-orm";

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
  getInsuranceTypeName(id: number): Promise<string>;
  
  // Insurance providers
  getInsuranceProviders(): Promise<InsuranceProvider[]>;

  // External quote requests
  createExternalQuoteRequest(data: InsertExternalQuoteRequest): Promise<ExternalQuoteRequest>;
  updateExternalQuoteRequest(requestId: string, data: Partial<ExternalQuoteRequest>): Promise<void>;
  
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
  
  // Policies - Enhanced policy management
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: number, policy: Partial<InsertPolicy>): Promise<Policy>;
  getPolicy(id: number): Promise<Policy | undefined>;
  getUserPolicies(userId: string): Promise<(Policy & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]>;
  getAllPolicies(): Promise<(Policy & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]>;
  
  // Phase 2: Agent-Policy Association
  getAgentPolicies(agentId: string, type: 'selling' | 'servicing'): Promise<Policy[]>;
  getOrganizationPolicies(organizationId: number): Promise<Policy[]>;
  getPolicyWithAgentDetails(policyId: number): Promise<any>;
  getActiveClientAssignment(clientId: number): Promise<ClientAssignment | undefined>;
  getOrganizationDefaultAgent(organizationId: number): Promise<User | undefined>;
  
  // Phase 3: Policy Transfer & Reassignment
  transferPolicyServicing(policyId: number, newServicingAgentId: string, transferredBy: string, reason: string): Promise<void>;
  getPolicyTransferHistory(policyId: number): Promise<PolicyTransfer[]>;
  
  // Phase 4: Commission & Performance Tracking
  createPolicyCommission(policyId: number, agentId: string, organizationId: number, commissionRate: number, baseAmount: number): Promise<AgentCommission>;
  getAgentCommissions(agentId: string, filters?: { status?: string; startDate?: Date; endDate?: Date }): Promise<AgentCommission[]>;
  getCommissionById(id: number): Promise<AgentCommission | undefined>;
  updateCommissionStatus(id: number, status: 'approved' | 'paid' | 'cancelled', paymentDetails?: { paymentDate?: Date; paymentMethod?: string; paymentReference?: string; notes?: string }): Promise<AgentCommission>;
  getOrganizationCommissions(organizationId: number, filters?: { status?: string; startDate?: Date; endDate?: Date }): Promise<AgentCommission[]>;
  
  // Phase 5: API Enhancements - Summary Endpoints
  getAgentPoliciesSummary(agentId: string, type?: 'selling' | 'servicing'): Promise<any>;
  getOrganizationPoliciesSummary(organizationId: number): Promise<any>;
  
  // Policy Documents
  createPolicyDocument(document: InsertPolicyDocument): Promise<PolicyDocument>;
  getPolicyDocuments(policyId: number): Promise<PolicyDocument[]>;
  deletePolicyDocument(id: number): Promise<void>;
  
  // Premium Payments
  createPremiumPayment(payment: InsertPremiumPayment): Promise<PremiumPayment>;
  updatePremiumPayment(id: number, payment: Partial<InsertPremiumPayment>): Promise<PremiumPayment>;
  getPolicyPayments(policyId: number): Promise<PremiumPayment[]>;
  getPayment(id: number): Promise<PremiumPayment | undefined>;
  getAllPayments(): Promise<PremiumPayment[]>;
  
  // Policy Amendments
  createPolicyAmendment(amendment: InsertPolicyAmendment): Promise<PolicyAmendment>;
  updatePolicyAmendment(id: number, amendment: Partial<InsertPolicyAmendment>): Promise<PolicyAmendment>;
  getPolicyAmendments(policyId: number): Promise<PolicyAmendment[]>;
  getAmendment(id: number): Promise<PolicyAmendment | undefined>;
  getAllAmendments(): Promise<PolicyAmendment[]>;
  
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

  // Person Management - Unified Person Entity Model
  createPerson(person: InsertPerson): Promise<Person>;
  getPersonById(id: number): Promise<Person | undefined>;
  getPersonByEmail(email: string): Promise<Person | undefined>;
  getPersonByPhone(phone: string): Promise<Person | undefined>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: number): Promise<void>;
  findPotentialDuplicates(person: Partial<InsertPerson>): Promise<Person[]>;
  
  // Person-User associations
  createPersonUser(association: InsertPersonUser): Promise<PersonUser>;
  getPersonUsers(personId: number): Promise<PersonUser[]>;
  getUserPerson(userId: string): Promise<(PersonUser & { person: Person }) | undefined>;
  deletePersonUser(id: number): Promise<void>;
  
  // Person-Member associations
  createPersonMember(association: InsertPersonMember): Promise<PersonMember>;
  getPersonMembers(personId: number): Promise<PersonMember[]>;
  getMemberPerson(memberId: number): Promise<(PersonMember & { person: Person }) | undefined>;
  deletePersonMember(id: number): Promise<void>;
  
  // Person-Contact associations
  createPersonContact(association: InsertPersonContact): Promise<PersonContact>;
  getPersonContacts(personId: number): Promise<PersonContact[]>;
  getContactPerson(contactId: number): Promise<(PersonContact & { person: Person }) | undefined>;
  deletePersonContact(id: number): Promise<void>;
  
  // Data Migration Methods
  migrateDataToPersons(): Promise<{ personsCreated: number; associationsCreated: number; duplicatesFound: number }>;
  identifyPersonDuplicates(): Promise<Array<{ email?: string; phone?: string; duplicates: Person[] }>>;

  // Agent Organizations
  createOrganization(organization: InsertAgentOrganization): Promise<AgentOrganization>;
  getOrganizations(): Promise<AgentOrganization[]>;
  getOrganizationById(id: number): Promise<AgentOrganization | undefined>;
  updateOrganization(id: number, updates: Partial<InsertAgentOrganization>): Promise<AgentOrganization>;
  deleteOrganization(id: number): Promise<void>;
  getOrganizationUsers(organizationId: number): Promise<User[]>;
  getOrganizationMembers(organizationId: number): Promise<Member[]>;

  // Organization Invitations
  createOrganizationInvitation(invitation: InsertOrganizationInvitation): Promise<OrganizationInvitation>;
  getOrganizationInvitations(organizationId: number): Promise<OrganizationInvitation[]>;
  getInvitationByToken(token: string): Promise<OrganizationInvitation | undefined>;
  getInvitationByEmail(email: string, organizationId: number): Promise<OrganizationInvitation | undefined>;
  updateOrganizationInvitation(id: number, updates: Partial<OrganizationInvitation>): Promise<OrganizationInvitation>;
  deleteOrganizationInvitation(id: number): Promise<void>;
  expireInvitation(id: number): Promise<OrganizationInvitation>;
  acceptInvitation(token: string, userId: string): Promise<OrganizationInvitation>;

  // Phase 2: Advanced Organization Management
  // Organization Analytics and Dashboard
  getOrganizationAnalytics(organizationId: number): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalMembers: number;
    newMembersThisMonth: number;
    totalQuotes: number;
    totalPolicies: number;
    totalClaims: number;
    pendingInvitations: number;
  }>;
  
  getOrganizationMemberGrowth(organizationId: number, months: number): Promise<{
    month: string;
    newMembers: number;
    totalMembers: number;
  }[]>;
  
  // Agent Performance and Management
  getAgentPerformanceMetrics(organizationId: number, agentId?: string): Promise<{
    agentId: string;
    agentName: string;
    totalClients: number;
    activeClients: number;
    quotesGenerated: number;
    policiesSold: number;
    totalClaims: number;
    responseTimeAvg: number; // in hours
  }[]>;
  
  getTopPerformingAgents(organizationId: number, limit: number): Promise<{
    agentId: string;
    agentName: string;
    score: number;
    policiesSold: number;
    clientSatisfaction: number;
  }[]>;
  
  // Enhanced Team Management
  getOrganizationTeamOverview(organizationId: number): Promise<{
    agents: {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      lastLogin: Date | null;
      clientCount: number;
      joiningDate: Date;
    }[];
    members: {
      id: number;
      name: string;
      email: string;
      status: string;
      assignedAgent: string | null;
      joiningDate: Date;
    }[];
    invitations: {
      id: number;
      email: string;
      role: string;
      status: string;
      invitedBy: string;
      createdAt: Date;
      expiresAt: Date;
    }[];
  }>;
  
  // Client Assignment and Management
  getAgentClientAssignments(organizationId: number, agentId?: string): Promise<{
    clientId: number;
    clientName: string;
    clientEmail: string;
    assignedAgent: string;
    assignedAgentName: string;
    assignmentDate: Date;
    clientStatus: string;
    lastInteraction: Date | null;
  }[]>;
  
  assignClientToAgent(clientId: number, agentId: string, assignedBy: string): Promise<void>;
  transferClientToAgent(clientId: number, fromAgentId: string, toAgentId: string, reason: string): Promise<void>;
  
  // Enhanced Team Management
  getEnhancedMemberList(organizationId: number, options?: {
    search?: string;
    roleFilter?: string;
    statusFilter?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    members: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      isActive: boolean;
      clientCount: number;
      joiningDate: Date;
      lastLogin: Date | null;
      performance: {
        quotesGenerated: number;
        policiesSold: number;
        totalRevenue: number;
        performanceScore: number;
      };
    }[];
    total: number;
  }>;
  
  updateMemberRole(userId: string, newRole: string, updatedBy: string): Promise<void>;
  updateMemberStatus(userId: string, isActive: boolean, updatedBy: string): Promise<void>;
  bulkUpdateMembers(memberIds: string[], updates: {
    role?: string;
    isActive?: boolean;
  }, updatedBy: string): Promise<void>;
  removeMember(userId: string, removedBy: string): Promise<void>;
  getMemberPerformanceDetails(userId: string, organizationId: number): Promise<{
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      joiningDate: Date;
      lastLogin: Date | null;
    };
    performance: {
      quotesGenerated: number;
      policiesSold: number;
      totalRevenue: number;
      performanceScore: number;
      clientCount: number;
      recentActivity: {
        date: Date;
        action: string;
        description: string;
      }[];
    };
  } | null>;
  
  // Organization Activity and Insights
  getOrganizationActivityFeed(organizationId: number, limit: number): Promise<{
    id: string;
    type: string;
    description: string;
    actorName: string;
    targetName?: string;
    createdAt: Date;
  }[]>;
  
  getOrganizationInsights(organizationId: number): Promise<{
    memberRetentionRate: number;
    averageTimeToPolicy: number; // in days
    mostPopularInsuranceType: string;
    agentUtilization: number; // percentage
    customerSatisfactionScore: number;
    growthRate: number; // percentage
  }>;

  // Agent Directory and Collaboration - Phase 1-4
  getOrganizationAgents(organizationId: number): Promise<any[]>;
  getAgents(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ agents: any[]; total: number }>;
  searchAgentsWithContext(userContext: UserContext, filters: any): Promise<any[]>;

  // Phase 5: Extended Cross-Organization Access
  getMembersWithScope(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ members: any[]; total: number }>;
  getAnalyticsWithScope(userContext: UserContext): Promise<any>;
  getClientAssignmentsWithScope(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ assignments: any[]; total: number }>;

}

/**
 * Data scope resolver helper - determines if user should see all organizations or just their own
 * Phase 1.1: SuperAdmin Cross-Organization Access
 */
interface DataScope {
  isGlobal: boolean;
  organizationId?: number;
}

interface UserContext {
  userId: string;
  privilegeLevel: number;
  organizationId?: number;
}

function resolveDataScope(userContext: UserContext): DataScope {
  // SuperAdmin (privilege level 0) sees all organizations
  if (userContext.privilegeLevel === 0) {
    return { isGlobal: true };
  }
  
  // All other users see only their organization
  return { 
    isGlobal: false, 
    organizationId: userContext.organizationId 
  };
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

  async getInsuranceTypeName(id: number): Promise<string> {
    const [type] = await db.select({ name: insuranceTypes.name }).from(insuranceTypes).where(eq(insuranceTypes.id, id));
    return type?.name || "Life Insurance";
  }

  // External quote requests
  async createExternalQuoteRequest(data: InsertExternalQuoteRequest): Promise<ExternalQuoteRequest> {
    const [request] = await db
      .insert(externalQuoteRequests)
      .values(data)
      .returning();
    return request;
  }

  async updateExternalQuoteRequest(requestId: string, data: Partial<ExternalQuoteRequest>): Promise<void> {
    await db
      .update(externalQuoteRequests)
      .set(data)
      .where(eq(externalQuoteRequests.requestId, requestId));
  }

  async getExternalQuoteRequests({ limit, offset }: { limit: number; offset: number }): Promise<ExternalQuoteRequest[]> {
    return await db
      .select()
      .from(externalQuoteRequests)
      .orderBy(desc(externalQuoteRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getExternalQuoteRequestsCount(filters?: { providerId?: string; status?: string }): Promise<number> {
    let query = db
      .select({ count: count() })
      .from(externalQuoteRequests);
    
    if (filters?.providerId) {
      query = query.where(sql`${externalQuoteRequests.providersRequested} ? ${filters.providerId}`);
    }
    
    if (filters?.status) {
      query = query.where(eq(externalQuoteRequests.status, filters.status as any));
    }
    
    const result = await query;
    return result[0]?.count || 0;
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

  async updatePolicy(id: number, policy: Partial<InsertPolicy>): Promise<Policy> {
    const [updatedPolicy] = await db
      .update(policies)
      .set({ ...policy, updatedAt: new Date() })
      .where(eq(policies.id, id))
      .returning();
    return updatedPolicy;
  }

  async getPolicy(id: number): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.id, id));
    return policy;
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

  async getAllPolicies(): Promise<(Policy & { quote: InsuranceQuote & { type: InsuranceType; provider: InsuranceProvider } })[]> {
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
      .orderBy(desc(policies.createdAt));
  }

  // Phase 2: Agent-Policy Association Methods
  async getAgentPolicies(agentId: string, type: 'selling' | 'servicing'): Promise<Policy[]> {
    const field = type === 'selling' ? policies.sellingAgentId : policies.servicingAgentId;
    
    return await db
      .select()
      .from(policies)
      .where(eq(field, agentId))
      .orderBy(desc(policies.createdAt));
  }

  async getOrganizationPolicies(organizationId: number): Promise<Policy[]> {
    return await db
      .select()
      .from(policies)
      .where(eq(policies.organizationId, organizationId))
      .orderBy(desc(policies.createdAt));
  }

  async getPolicyWithAgentDetails(policyId: number): Promise<any> {
    // Create aliases for the agent users table to distinguish between selling and servicing agents
    const sellingAgentUser = users;
    const servicingAgentUser = users;
    
    const result = await db
      .select({
        // Policy fields
        id: policies.id,
        userId: policies.userId,
        quoteId: policies.quoteId,
        policyNumber: policies.policyNumber,
        status: policies.status,
        startDate: policies.startDate,
        endDate: policies.endDate,
        nextPaymentDate: policies.nextPaymentDate,
        sellingAgentId: policies.sellingAgentId,
        servicingAgentId: policies.servicingAgentId,
        organizationId: policies.organizationId,
        agentCommissionRate: policies.agentCommissionRate,
        agentCommissionPaid: policies.agentCommissionPaid,
        agentAssignedAt: policies.agentAssignedAt,
        policySource: policies.policySource,
        referralSource: policies.referralSource,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt,
        // Simplified agent details - just basic info
        sellingAgentEmail: sql<string>`(SELECT email FROM users WHERE id = ${policies.sellingAgentId})`,
        servicingAgentEmail: sql<string>`(SELECT email FROM users WHERE id = ${policies.servicingAgentId})`,
      })
      .from(policies)
      .where(eq(policies.id, policyId))
      .limit(1);
      
    return result[0] || null;
  }

  async getActiveClientAssignment(clientId: number): Promise<ClientAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(clientAssignments)
      .where(
        and(
          eq(clientAssignments.clientId, clientId),
          eq(clientAssignments.isActive, true),
          eq(clientAssignments.status, 'Active')
        )
      )
      .orderBy(desc(clientAssignments.assignedAt))
      .limit(1);
    
    return assignment;
  }

  async getOrganizationDefaultAgent(organizationId: number): Promise<User | undefined> {
    // Get the first agent (by creation date) from the organization
    const [agent] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, 'Agent')
        )
      )
      .orderBy(asc(users.createdAt))
      .limit(1);
    
    return agent;
  }

  // Phase 3: Policy Transfer & Reassignment
  async transferPolicyServicing(
    policyId: number,
    newServicingAgentId: string,
    transferredBy: string,
    reason: string
  ): Promise<void> {
    // Get current policy state
    const policy = await this.getPolicy(policyId);
    
    if (!policy) {
      throw new Error('Policy not found');
    }
    
    // Create transfer record
    await db.insert(policyTransfers).values({
      policyId,
      fromAgentId: policy.servicingAgentId || null,
      toAgentId: newServicingAgentId,
      transferredBy,
      transferReason: reason,
      transferType: 'servicing',
      transferredAt: new Date(),
    });
    
    // Update policy servicing agent
    await db
      .update(policies)
      .set({
        servicingAgentId: newServicingAgentId,
        updatedAt: new Date(),
      })
      .where(eq(policies.id, policyId));
  }

  async getPolicyTransferHistory(policyId: number): Promise<PolicyTransfer[]> {
    return await db
      .select()
      .from(policyTransfers)
      .where(eq(policyTransfers.policyId, policyId))
      .orderBy(desc(policyTransfers.transferredAt));
  }

  // Phase 4: Commission & Performance Tracking
  async createPolicyCommission(
    policyId: number,
    agentId: string,
    organizationId: number,
    commissionRate: number,
    baseAmount: number
  ): Promise<AgentCommission> {
    const commissionAmount = (baseAmount * commissionRate) / 100;
    
    const [commission] = await db.insert(agentCommissions).values({
      policyId,
      agentId,
      organizationId,
      commissionType: 'initial_sale',
      commissionRate: commissionRate.toString(),
      baseAmount: baseAmount.toString(),
      commissionAmount: commissionAmount.toString(),
      paymentStatus: 'pending',
    }).returning();
    
    return commission;
  }

  async getAgentCommissions(
    agentId: string,
    filters?: { status?: string; startDate?: Date; endDate?: Date }
  ): Promise<AgentCommission[]> {
    let query = db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.agentId, agentId));
    
    if (filters?.status) {
      query = query.where(eq(agentCommissions.paymentStatus, filters.status));
    }
    
    if (filters?.startDate) {
      query = query.where(gte(agentCommissions.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where(lte(agentCommissions.createdAt, filters.endDate));
    }
    
    return await query.orderBy(desc(agentCommissions.createdAt));
  }

  async getCommissionById(id: number): Promise<AgentCommission | undefined> {
    const [commission] = await db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.id, id))
      .limit(1);
    
    return commission;
  }

  async updateCommissionStatus(
    id: number,
    status: 'approved' | 'paid' | 'cancelled',
    paymentDetails?: { 
      paymentDate?: Date; 
      paymentMethod?: string; 
      paymentReference?: string; 
      notes?: string 
    }
  ): Promise<AgentCommission> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date(),
    };
    
    if (paymentDetails) {
      if (paymentDetails.paymentDate) updateData.paymentDate = paymentDetails.paymentDate;
      if (paymentDetails.paymentMethod) updateData.paymentMethod = paymentDetails.paymentMethod;
      if (paymentDetails.paymentReference) updateData.paymentReference = paymentDetails.paymentReference;
      if (paymentDetails.notes) updateData.notes = paymentDetails.notes;
    }
    
    const [commission] = await db
      .update(agentCommissions)
      .set(updateData)
      .where(eq(agentCommissions.id, id))
      .returning();
    
    return commission;
  }

  async getOrganizationCommissions(
    organizationId: number,
    filters?: { status?: string; startDate?: Date; endDate?: Date }
  ): Promise<AgentCommission[]> {
    let query = db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.organizationId, organizationId));
    
    if (filters?.status) {
      query = query.where(eq(agentCommissions.paymentStatus, filters.status));
    }
    
    if (filters?.startDate) {
      query = query.where(gte(agentCommissions.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where(lte(agentCommissions.createdAt, filters.endDate));
    }
    
    return await query.orderBy(desc(agentCommissions.createdAt));
  }

  // Phase 5: API Enhancements - Summary Endpoints
  async getAgentPoliciesSummary(agentId: string, type?: 'selling' | 'servicing'): Promise<any> {
    const sellingPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.sellingAgentId, agentId));
    
    const servicingPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.servicingAgentId, agentId));
    
    const relevantPolicies = type === 'selling' 
      ? sellingPolicies 
      : type === 'servicing' 
      ? servicingPolicies 
      : [...sellingPolicies, ...servicingPolicies];
    
    const agentCommissionsData = await db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.agentId, agentId));
    
    const recentTransfers = await db
      .select()
      .from(policyTransfers)
      .where(or(
        eq(policyTransfers.fromAgentId, agentId),
        eq(policyTransfers.toAgentId, agentId)
      ))
      .orderBy(desc(policyTransfers.transferredAt))
      .limit(5);
    
    const totalPolicies = relevantPolicies.length;
    const activePolicies = relevantPolicies.filter(p => p.status === 'active').length;
    const inactivePolicies = totalPolicies - activePolicies;
    
    const sellingCount = sellingPolicies.length;
    const servicingCount = servicingPolicies.length;
    
    const totalCommissions = agentCommissionsData.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissions = agentCommissionsData.filter(c => c.paymentStatus === 'pending').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const paidCommissions = agentCommissionsData.filter(c => c.paymentStatus === 'paid').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    
    return {
      agentId,
      type: type || 'all',
      policyCounts: {
        total: totalPolicies,
        active: activePolicies,
        inactive: inactivePolicies,
        selling: sellingCount,
        servicing: servicingCount,
      },
      commissions: {
        total: totalCommissions,
        pending: pendingCommissions,
        paid: paidCommissions,
        count: agentCommissionsData.length,
      },
      recentActivity: {
        transfers: recentTransfers.length,
        lastTransferDate: recentTransfers[0]?.transferredAt || null,
      },
    };
  }

  async getOrganizationPoliciesSummary(organizationId: number): Promise<any> {
    const orgPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.organizationId, organizationId));
    
    const orgCommissions = await db
      .select()
      .from(agentCommissions)
      .where(eq(agentCommissions.organizationId, organizationId));
    
    const orgTransfers = await db
      .select()
      .from(policyTransfers)
      .leftJoin(policies, eq(policyTransfers.policyId, policies.id))
      .where(eq(policies.organizationId, organizationId))
      .orderBy(desc(policyTransfers.transferredAt))
      .limit(10);
    
    const totalPolicies = orgPolicies.length;
    const activePolicies = orgPolicies.filter(p => p.status === 'active').length;
    const inactivePolicies = totalPolicies - activePolicies;
    
    const totalCommissions = orgCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissions = orgCommissions.filter(c => c.paymentStatus === 'pending').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const paidCommissions = orgCommissions.filter(c => c.paymentStatus === 'paid').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const approvedCommissions = orgCommissions.filter(c => c.paymentStatus === 'approved').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    
    const agentIds = [...new Set(orgPolicies.map(p => p.sellingAgentId || p.servicingAgentId).filter(Boolean))];
    const activeAgents = agentIds.length;
    
    return {
      organizationId,
      policyCounts: {
        total: totalPolicies,
        active: activePolicies,
        inactive: inactivePolicies,
      },
      commissions: {
        total: totalCommissions,
        pending: pendingCommissions,
        approved: approvedCommissions,
        paid: paidCommissions,
        count: orgCommissions.length,
      },
      agents: {
        active: activeAgents,
        totalAssigned: agentIds.length,
      },
      recentActivity: {
        transfers: orgTransfers.length,
        lastTransferDate: orgTransfers[0]?.policy_transfers?.transferredAt || null,
      },
    };
  }

  // Policy Documents
  async createPolicyDocument(document: InsertPolicyDocument): Promise<PolicyDocument> {
    const [newDocument] = await db.insert(policyDocuments).values(document).returning();
    return newDocument;
  }

  async getPolicyDocuments(policyId: number): Promise<PolicyDocument[]> {
    return await db
      .select()
      .from(policyDocuments)
      .where(and(eq(policyDocuments.policyId, policyId), eq(policyDocuments.isActive, true)))
      .orderBy(desc(policyDocuments.createdAt));
  }

  async deletePolicyDocument(id: number): Promise<void> {
    await db
      .update(policyDocuments)
      .set({ isActive: false })
      .where(eq(policyDocuments.id, id));
  }

  // Premium Payments
  async createPremiumPayment(payment: InsertPremiumPayment): Promise<PremiumPayment> {
    const [newPayment] = await db.insert(premiumPayments).values(payment).returning();
    return newPayment;
  }

  async updatePremiumPayment(id: number, payment: Partial<InsertPremiumPayment>): Promise<PremiumPayment> {
    const [updatedPayment] = await db
      .update(premiumPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(premiumPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async getPolicyPayments(policyId: number): Promise<PremiumPayment[]> {
    return await db
      .select()
      .from(premiumPayments)
      .where(eq(premiumPayments.policyId, policyId))
      .orderBy(desc(premiumPayments.dueDate));
  }

  async getPayment(id: number): Promise<PremiumPayment | undefined> {
    const [payment] = await db.select().from(premiumPayments).where(eq(premiumPayments.id, id));
    return payment;
  }

  async getAllPayments(): Promise<PremiumPayment[]> {
    return await db.select().from(premiumPayments).orderBy(desc(premiumPayments.dueDate));
  }

  // Policy Amendments
  async createPolicyAmendment(amendment: InsertPolicyAmendment): Promise<PolicyAmendment> {
    const [newAmendment] = await db.insert(policyAmendments).values(amendment).returning();
    return newAmendment;
  }

  async updatePolicyAmendment(id: number, amendment: Partial<InsertPolicyAmendment>): Promise<PolicyAmendment> {
    const [updatedAmendment] = await db
      .update(policyAmendments)
      .set({ ...amendment, updatedAt: new Date() })
      .where(eq(policyAmendments.id, id))
      .returning();
    return updatedAmendment;
  }

  async getPolicyAmendments(policyId: number): Promise<PolicyAmendment[]> {
    return await db
      .select()
      .from(policyAmendments)
      .where(eq(policyAmendments.policyId, policyId))
      .orderBy(desc(policyAmendments.createdAt));
  }

  async getAmendment(id: number): Promise<PolicyAmendment | undefined> {
    const [amendment] = await db.select().from(policyAmendments).where(eq(policyAmendments.id, id));
    return amendment;
  }

  async getAllAmendments(): Promise<PolicyAmendment[]> {
    return await db.select().from(policyAmendments).orderBy(desc(policyAmendments.createdAt));
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
        organizationId: members.organizationId,
        memberNumber: members.memberNumber,
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
        personId: members.personId,
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
        // firstName: members.firstName, // Column doesn't exist - using email instead
        // lastName: members.lastName, // Column doesn't exist
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

  // Agent Organization methods
  async createOrganization(organization: any): Promise<any> {
    const [newOrg] = await db.insert(agentOrganizations).values(organization).returning();
    return newOrg;
  }

  async getOrganizations(): Promise<any[]> {
    // Exclude system organization from normal tenant operations
    return await db.select()
      .from(agentOrganizations)
      .where(
        and(
          eq(agentOrganizations.isSystemOrganization, false),
          eq(agentOrganizations.isHidden, false)
        )
      )
      .orderBy(agentOrganizations.name);
  }

  async getOrganizationById(id: number): Promise<any | undefined> {
    const [org] = await db.select().from(agentOrganizations).where(eq(agentOrganizations.id, id));
    return org;
  }

  // SuperAdmin utility methods
  async getAllOrganizations(): Promise<any[]> {
    // For SuperAdmin: get all organizations including system organization
    return await db.select().from(agentOrganizations).orderBy(agentOrganizations.name);
  }

  isSuperAdminContext(organizationId: number | null | undefined): boolean {
    return organizationId === 0; // System organization ID
  }

  async checkUserPermissions(userId: string, feature: string, action: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // SuperAdmins in system organization have all permissions
    if (user.organizationId === 0 && user.role === 'SuperAdmin') {
      return true;
    }
    
    // Regular organization-based permission checking
    // For now, use existing privilege level system
    return user.privilegeLevel !== null && user.privilegeLevel <= 2;
  }

  async getTenantOrganizations(): Promise<any[]> {
    // Same as getOrganizations - exclude system organization from normal tenant operations
    return this.getOrganizations();
  }

  async updateOrganization(id: number, updates: any): Promise<any> {
    const [updated] = await db
      .update(agentOrganizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentOrganizations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.delete(agentOrganizations).where(eq(agentOrganizations.id, id));
  }

  async getOrganizationUsers(organizationId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async getOrganizationMembers(organizationId: number): Promise<any[]> {
    return await db
      .select({
        id: members.id,
        userId: members.userId,
        memberNumber: members.memberNumber,
        // firstName: members.firstName, // Column doesn't exist - using email instead
        // lastName: members.lastName, // Column doesn't exist
        email: members.email,
        membershipStatus: members.membershipStatus,
        membershipDate: members.membershipDate,
        createdAt: members.createdAt,
      })
      .from(members)
      .where(eq(members.organizationId, organizationId))
      .orderBy(members.createdAt);
  }

  // Organization Invitation methods
  async createOrganizationInvitation(invitation: InsertOrganizationInvitation): Promise<OrganizationInvitation> {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    
    const [newInvitation] = await db
      .insert(organizationInvitations)
      .values({
        ...invitation,
        invitationToken: token,
        expiresAt,
      })
      .returning();
    return newInvitation;
  }

  async getOrganizationInvitations(organizationId: number): Promise<OrganizationInvitation[]> {
    return await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, organizationId))
      .orderBy(organizationInvitations.createdAt);
  }

  async getInvitationByToken(token: string): Promise<OrganizationInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.invitationToken, token));
    return invitation;
  }

  async getInvitationByEmail(email: string, organizationId: number): Promise<OrganizationInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.email, email),
          eq(organizationInvitations.organizationId, organizationId),
          eq(organizationInvitations.status, "Pending")
        )
      );
    return invitation;
  }

  async updateOrganizationInvitation(id: number, updates: Partial<OrganizationInvitation>): Promise<OrganizationInvitation> {
    const [updated] = await db
      .update(organizationInvitations)
      .set(updates)
      .where(eq(organizationInvitations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganizationInvitation(id: number): Promise<void> {
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, id));
  }

  async expireInvitation(id: number): Promise<OrganizationInvitation> {
    const [expired] = await db
      .update(organizationInvitations)
      .set({ status: "Expired" })
      .where(eq(organizationInvitations.id, id))
      .returning();
    return expired;
  }

  async acceptInvitation(token: string, userId: string): Promise<OrganizationInvitation> {
    const [accepted] = await db
      .update(organizationInvitations)
      .set({ 
        status: "Accepted",
        acceptedAt: new Date(),
        acceptedBy: userId
      })
      .where(eq(organizationInvitations.invitationToken, token))
      .returning();
    return accepted;
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
    return await db
      .select({
        id: contacts.id,
        organizationId: contacts.organizationId,
        type: contacts.type,
        company: contacts.company,
        notes: contacts.notes,
        status: contacts.status,
        assignedAgent: contacts.assignedAgent,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        personId: contacts.personId,
      })
      .from(contacts)
      .orderBy(desc(contacts.createdAt));
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

  // Person Management - Core CRUD Operations
  async createPerson(personData: InsertPerson): Promise<Person> {
    const [person] = await db.insert(persons).values({
      ...personData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return person;
  }

  async getPersonById(id: number): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person;
  }

  async getPersonByEmail(email: string): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.primaryEmail, email));
    return person;
  }

  async getPersonByPhone(phone: string): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.primaryPhone, phone));
    return person;
  }

  async updatePerson(id: number, personData: Partial<InsertPerson>): Promise<Person> {
    const [person] = await db.update(persons)
      .set({ ...personData, updatedAt: new Date() })
      .where(eq(persons.id, id))
      .returning();
    return person;
  }

  async deletePerson(id: number): Promise<void> {
    await db.delete(persons).where(eq(persons.id, id));
  }

  async findPotentialDuplicates(personData: Partial<InsertPerson>): Promise<Person[]> {
    const conditions = [];
    
    if (personData.primaryEmail) {
      conditions.push(eq(persons.primaryEmail, personData.primaryEmail));
    }
    if (personData.secondaryEmail) {
      conditions.push(eq(persons.secondaryEmail, personData.secondaryEmail));
    }
    if (personData.primaryPhone) {
      conditions.push(eq(persons.primaryPhone, personData.primaryPhone));
    }
    if (personData.secondaryPhone) {
      conditions.push(eq(persons.secondaryPhone, personData.secondaryPhone));
    }

    if (conditions.length === 0) return [];

    // Use OR condition to find any matching email or phone
    return await db.select().from(persons).where(or(...conditions));
  }

  // Person-User Associations
  async createPersonUser(associationData: InsertPersonUser): Promise<PersonUser> {
    const [association] = await db.insert(personUsers).values({
      ...associationData,
      createdAt: new Date(),
    }).returning();
    return association;
  }

  async getPersonUsers(personId: number): Promise<PersonUser[]> {
    return await db.select().from(personUsers).where(eq(personUsers.personId, personId));
  }

  async getUserPerson(userId: string): Promise<(PersonUser & { person: Person }) | undefined> {
    const [result] = await db.select({
      ...personUsers,
      person: persons
    })
    .from(personUsers)
    .leftJoin(persons, eq(personUsers.personId, persons.id))
    .where(eq(personUsers.userId, userId));

    return result as (PersonUser & { person: Person }) | undefined;
  }

  async deletePersonUser(id: number): Promise<void> {
    await db.delete(personUsers).where(eq(personUsers.id, id));
  }

  // Person-Member Associations
  async createPersonMember(associationData: InsertPersonMember): Promise<PersonMember> {
    const [association] = await db.insert(personMembers).values({
      ...associationData,
      createdAt: new Date(),
    }).returning();
    return association;
  }

  async getPersonMembers(personId: number): Promise<PersonMember[]> {
    return await db.select().from(personMembers).where(eq(personMembers.personId, personId));
  }

  async getMemberPerson(memberId: number): Promise<(PersonMember & { person: Person }) | undefined> {
    const [result] = await db.select({
      ...personMembers,
      person: persons
    })
    .from(personMembers)
    .leftJoin(persons, eq(personMembers.personId, persons.id))
    .where(eq(personMembers.memberId, memberId));

    return result as (PersonMember & { person: Person }) | undefined;
  }

  async deletePersonMember(id: number): Promise<void> {
    await db.delete(personMembers).where(eq(personMembers.id, id));
  }

  // Person-Contact Associations
  async createPersonContact(associationData: InsertPersonContact): Promise<PersonContact> {
    const [association] = await db.insert(personContacts).values({
      ...associationData,
      createdAt: new Date(),
    }).returning();
    return association;
  }

  async getPersonContacts(personId: number): Promise<PersonContact[]> {
    return await db.select().from(personContacts).where(eq(personContacts.personId, personId));
  }

  async getContactPerson(contactId: number): Promise<(PersonContact & { person: Person }) | undefined> {
    const [result] = await db.select({
      ...personContacts,
      person: persons
    })
    .from(personContacts)
    .leftJoin(persons, eq(personContacts.personId, persons.id))
    .where(eq(personContacts.contactId, contactId));

    return result as (PersonContact & { person: Person }) | undefined;
  }

  async deletePersonContact(id: number): Promise<void> {
    await db.delete(personContacts).where(eq(personContacts.id, id));
  }

  // Data Migration Methods
  async migrateDataToPersons(): Promise<{ personsCreated: number; associationsCreated: number; duplicatesFound: number }> {
    let personsCreated = 0;
    let associationsCreated = 0;
    let duplicatesFound = 0;

    console.log("Starting migration of user/member/contact data to persons table...");

    // Check if migration has already been run (idempotency check)
    const existingPersonsCount = await db.select({ count: count() }).from(persons);
    if (existingPersonsCount[0].count > 0) {
      console.log("Migration appears to have already been run. Skipping to avoid duplicates.");
      return { personsCreated: 0, associationsCreated: 0, duplicatesFound: 0 };
    }

    // Wrap entire migration in a transaction for atomicity
    return await db.transaction(async (tx) => {
      // Step 1: Collect all person data from users, members, contacts
      const allUsers = await tx.select().from(users);
      const allMembers = await tx.select().from(members);
      const allContacts = await tx.select().from(contacts);

      const personData: Map<string, {
        person: InsertPerson;
        sources: { type: 'user' | 'member' | 'contact'; id: string | number }[];
      }> = new Map();

    // Process users
    for (const user of allUsers) {
      const identityKey = this.generateIdentityKey(user.email, user.phone, user.firstName, user.lastName);
      
      if (personData.has(identityKey)) {
        // Duplicate found - add this user as a source
        personData.get(identityKey)!.sources.push({ type: 'user', id: user.id });
        duplicatesFound++;
      } else {
        // Create new person entry
        personData.set(identityKey, {
          person: {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            primaryEmail: user.email || '',
            primaryPhone: user.phone || '',
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
            streetAddress: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zipCode: user.zipCode || '',
            country: 'USA',
            dataSource: 'migration',
            identityHash: identityKey,
            isVerified: true,
            createdBy: user.id,
            updatedBy: user.id
          },
          sources: [{ type: 'user', id: user.id }]
        });
      }
    }

    // Process members
    for (const member of allMembers) {
      const identityKey = this.generateIdentityKey(member.email, member.phone, member.firstName, member.lastName);
      
      if (personData.has(identityKey)) {
        // Duplicate found - add this member as a source
        personData.get(identityKey)!.sources.push({ type: 'member', id: member.id });
        duplicatesFound++;
        
        // Update person data with member-specific information if available
        const existingPerson = personData.get(identityKey)!.person;
        if (member.ssn && !existingPerson.ssnLastFour) {
          existingPerson.ssnLastFour = member.ssn.slice(-4);
        }
        if (member.dateOfBirth && !existingPerson.dateOfBirth) {
          existingPerson.dateOfBirth = new Date(member.dateOfBirth);
        }
      } else {
        // Create new person entry from member data
        personData.set(identityKey, {
          person: {
            firstName: member.firstName || '',
            lastName: member.lastName || '',
            primaryEmail: member.email || '',
            primaryPhone: member.phone || '',
            dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : undefined,
            ssnLastFour: member.ssn ? member.ssn.slice(-4) : undefined,
            streetAddress: member.address || '',
            city: member.city || '',
            state: member.state || '',
            zipCode: member.zipCode || '',
            country: 'USA',
            dataSource: 'migration',
            identityHash: identityKey,
            isVerified: true,
            createdBy: member.userId || undefined,
            updatedBy: member.userId || undefined
          },
          sources: [{ type: 'member', id: member.id }]
        });
      }
    }

    // Process contacts
    for (const contact of allContacts) {
      const identityKey = this.generateIdentityKey(contact.email, contact.phone, contact.firstName, contact.lastName);
      
      if (personData.has(identityKey)) {
        // Duplicate found - add this contact as a source
        personData.get(identityKey)!.sources.push({ type: 'contact', id: contact.id });
        duplicatesFound++;
      } else {
        // Create new person entry from contact data
        personData.set(identityKey, {
          person: {
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            primaryEmail: contact.email || '',
            primaryPhone: contact.phone || '',
            streetAddress: contact.address || '',
            city: contact.city || '',
            state: contact.state || '',
            zipCode: contact.zipCode || '',
            country: 'USA',
            dataSource: 'migration',
            identityHash: identityKey,
            isVerified: false,
            createdBy: contact.assignedAgent || undefined,
            updatedBy: contact.assignedAgent || undefined
          },
          sources: [{ type: 'contact', id: contact.id }]
        });
      }
    }

      // Step 2: Create persons and associations (all within transaction)
      for (const [identityKey, data] of personData) {
        try {
          // Create the person using transaction
          const [person] = await tx.insert(persons).values({
            ...data.person,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          personsCreated++;

          // Create associations for each source using transaction
          for (const source of data.sources) {
            if (source.type === 'user') {
              await tx.insert(personUsers).values({
                personId: person.id,
                userId: source.id as string,
                roleContext: { migrated: true, originalSource: 'user' },
                createdAt: new Date(),
              });
              associationsCreated++;
            } else if (source.type === 'member') {
              const member = allMembers.find(m => m.id === source.id);
              await tx.insert(personMembers).values({
                personId: person.id,
                memberId: source.id as number,
                organizationId: member?.organizationId || undefined,
                memberNumber: member?.memberNumber || undefined,
                membershipStatus: member?.membershipStatus || 'Active',
                membershipDate: member?.membershipDate || new Date(),
                additionalInfo: { migrated: true, originalSource: 'member' },
                createdAt: new Date(),
              });
              associationsCreated++;
            } else if (source.type === 'contact') {
              const contact = allContacts.find(c => c.id === source.id);
              await tx.insert(personContacts).values({
                personId: person.id,
                contactId: source.id as number,
                contactContext: contact?.type || 'lead',
                organizationId: contact?.organizationId || undefined,
                assignedAgent: contact?.assignedAgent || undefined,
                contactMetadata: { migrated: true, originalSource: 'contact' },
                createdAt: new Date(),
              });
              associationsCreated++;
            }
          }

          console.log(`Created person ${person.id} with ${data.sources.length} associations`);
        } catch (error) {
          console.error(`Error creating person for identity ${identityKey}:`, error);
          // Re-throw to trigger transaction rollback
          throw error;
        }
      }

      console.log(`Migration completed: ${personsCreated} persons created, ${associationsCreated} associations created, ${duplicatesFound} duplicates found`);
      
      return { personsCreated, associationsCreated, duplicatesFound };
    }); // End transaction
  }

  private generateIdentityKey(email?: string | null, phone?: string | null, firstName?: string | null, lastName?: string | null): string {
    // Create a consistent identity key for duplicate detection
    const emailPart = email ? email.toLowerCase().trim() : '';
    const phonePart = phone ? phone.replace(/[^0-9]/g, '') : ''; // Remove formatting
    const namePart = `${firstName || ''}|${lastName || ''}`.toLowerCase().trim();
    
    // Primary matching on email, fallback to phone + name
    if (emailPart) {
      return `email:${emailPart}`;
    } else if (phonePart && namePart !== '|') {
      return `phone:${phonePart}:name:${namePart}`;
    } else {
      return `name:${namePart}:${Date.now()}`; // Fallback to prevent collisions
    }
  }

  async identifyPersonDuplicates(): Promise<Array<{ email?: string; phone?: string; duplicates: Person[] }>> {
    const duplicates: Array<{ email?: string; phone?: string; duplicates: Person[] }> = [];
    
    // Find email duplicates
    const emailDuplicates = await db.select({
      email: persons.primaryEmail,
      count: count()
    })
    .from(persons)
    .where(ne(persons.primaryEmail, null))
    .groupBy(persons.primaryEmail)
    .having(gt(count(), 1));

    for (const emailDup of emailDuplicates) {
      if (emailDup.email) {
        const duplicatePersons = await db.select().from(persons)
          .where(eq(persons.primaryEmail, emailDup.email));
        duplicates.push({
          email: emailDup.email,
          duplicates: duplicatePersons
        });
      }
    }

    // Find phone duplicates
    const phoneDuplicates = await db.select({
      phone: persons.primaryPhone,
      count: count()
    })
    .from(persons)
    .where(ne(persons.primaryPhone, null))
    .groupBy(persons.primaryPhone)
    .having(gt(count(), 1));

    for (const phoneDup of phoneDuplicates) {
      if (phoneDup.phone) {
        const duplicatePersons = await db.select().from(persons)
          .where(eq(persons.primaryPhone, phoneDup.phone));
        duplicates.push({
          phone: phoneDup.phone,
          duplicates: duplicatePersons
        });
      }
    }

    return duplicates;
  }

  // ===== PHASE 2: ADVANCED ORGANIZATION MANAGEMENT IMPLEMENTATIONS =====

  async getOrganizationAnalytics(organizationId: number): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalMembers: number;
    newMembersThisMonth: number;
    totalQuotes: number;
    totalPolicies: number;
    totalClaims: number;
    pendingInvitations: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count agents (users with Agent or TenantAdmin role in organization)
    const [agentStats] = await db.select({
      totalAgents: count(),
      activeAgents: count(),
    }).from(users).where(
      and(
        eq(users.organizationId, organizationId),
        sql`${users.role} IN ('Agent', 'TenantAdmin')`
      )
    );

    // Count members in organization
    const [memberStats] = await db.select({
      totalMembers: count(),
    }).from(members).where(eq(members.organizationId, organizationId));

    // Count new members this month
    const [newMemberStats] = await db.select({
      newMembersThisMonth: count(),
    }).from(members).where(
      and(
        eq(members.organizationId, organizationId),
        gte(members.createdAt, startOfMonth)
      )
    );

    // Count quotes for organization users
    const orgUserIds = await db.select({ id: users.id }).from(users)
      .where(eq(users.organizationId, organizationId));
    
    let quoteStats = { totalQuotes: 0 };
    if (orgUserIds.length > 0) {
      const userIdList = orgUserIds.map(u => u.id);
      const [quotesResult] = await db.select({
        totalQuotes: count(),
      }).from(insuranceQuotes).where(
        sql`${insuranceQuotes.userId} IN (${sql.join(userIdList.map(id => sql`${id}`), sql`, `)})`
      );
      quoteStats = quotesResult || { totalQuotes: 0 };
    }

    // Count policies for organization members (gracefully handle missing table)
    let policyStats = { totalPolicies: 0 };
    try {
      const [result] = await db.select({
        totalPolicies: count(),
      }).from(policies)
        .innerJoin(members, eq(policies.memberId, members.id))
        .where(eq(members.organizationId, organizationId));
      policyStats = result || { totalPolicies: 0 };
    } catch (error) {
      console.log("Policies table not available, using default value");
    }

    // Count claims for organization members (gracefully handle missing table)
    let claimStats = { totalClaims: 0 };
    try {
      const [result] = await db.select({
        totalClaims: count(),
      }).from(claims)
        .innerJoin(members, eq(claims.memberId, members.id))
        .where(eq(members.organizationId, organizationId));
      claimStats = result || { totalClaims: 0 };
    } catch (error) {
      console.log("Claims table not available, using default value");
    }

    // Count pending invitations (gracefully handle missing table)
    let invitationStats = { pendingInvitations: 0 };
    try {
      const [result] = await db.select({
        pendingInvitations: count(),
      }).from(organizationInvitations).where(
        and(
          eq(organizationInvitations.organizationId, organizationId),
          eq(organizationInvitations.status, 'Pending')
        )
      );
      invitationStats = result || { pendingInvitations: 0 };
    } catch (error) {
      console.log("Organization invitations table not available, using default value");
    }

    return {
      totalAgents: agentStats?.totalAgents || 0,
      activeAgents: agentStats?.activeAgents || 0,
      totalMembers: memberStats?.totalMembers || 0,
      newMembersThisMonth: newMemberStats?.newMembersThisMonth || 0,
      totalQuotes: quoteStats?.totalQuotes || 0,
      totalPolicies: policyStats?.totalPolicies || 0,
      totalClaims: claimStats?.totalClaims || 0,
      pendingInvitations: invitationStats?.pendingInvitations || 0,
    };
  }

  async getOrganizationMemberGrowth(organizationId: number, months: number): Promise<{
    month: string;
    newMembers: number;
    totalMembers: number;
  }[]> {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // New members in this month
      const [newMembers] = await db.select({
        count: count(),
      }).from(members).where(
        and(
          eq(members.organizationId, organizationId),
          gte(members.createdAt, monthStart),
          lte(members.createdAt, monthEnd)
        )
      );

      // Total members by end of this month
      const [totalMembers] = await db.select({
        count: count(),
      }).from(members).where(
        and(
          eq(members.organizationId, organizationId),
          lte(members.createdAt, monthEnd)
        )
      );

      result.push({
        month: monthName,
        newMembers: newMembers?.count || 0,
        totalMembers: totalMembers?.count || 0,
      });
    }

    return result;
  }

  async getAgentPerformanceMetrics(organizationId: number, agentId?: string): Promise<{
    agentId: string;
    agentName: string;
    totalClients: number;
    activeClients: number;
    quotesGenerated: number;
    policiesSold: number;
    totalClaims: number;
    responseTimeAvg: number;
  }[]> {
    const agents = await db.select().from(users).where(
      and(
        eq(users.organizationId, organizationId),
        sql`${users.role} IN ('Agent', 'TenantAdmin')`,
        agentId ? eq(users.id, agentId) : sql`1=1`
      )
    );

    const result = [];

    for (const agent of agents) {
      // Count total clients (contacts + members assigned to this agent)
      const [contactClients] = await db.select({
        count: count(),
      }).from(contacts).where(
        and(
          eq(contacts.organizationId, organizationId),
          eq(contacts.assignedAgent, agent.id)
        )
      );

      const [memberClients] = await db.select({
        count: count(),
      }).from(members).where(
        and(
          eq(members.organizationId, organizationId),
          eq(members.assignedAgent, agent.id)
        )
      );

      // Count quotes generated by this agent
      const [quotes] = await db.select({
        count: count(),
      }).from(insuranceQuotes).where(eq(insuranceQuotes.userId, agent.id));

      // Count policies sold to agent's clients
      const [policies] = await db.select({
        count: count(),
      }).from(policies)
        .innerJoin(members, eq(policies.memberId, members.id))
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.assignedAgent, agent.id)
          )
        );

      // Count claims for agent's clients
      const [claimsCount] = await db.select({
        count: count(),
      }).from(claims)
        .innerJoin(members, eq(claims.memberId, members.id))
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.assignedAgent, agent.id)
          )
        );

      const totalClients = (contactClients?.count || 0) + (memberClients?.count || 0);
      const activeClients = memberClients?.count || 0; // Members are considered active clients

      result.push({
        agentId: agent.id,
        agentName: agent.email || 'Unknown', // Simplified - firstName/lastName columns don't exist
        totalClients,
        activeClients,
        quotesGenerated: quotes?.count || 0,
        policiesSold: policies?.count || 0,
        totalClaims: claimsCount?.count || 0,
        responseTimeAvg: 24, // Default to 24 hours - can be enhanced with real activity tracking
      });
    }

    return result;
  }

  async getTopPerformingAgents(organizationId: number, limit: number): Promise<{
    agentId: string;
    agentName: string;
    score: number;
    policiesSold: number;
    clientSatisfaction: number;
  }[]> {
    const agents = await this.getAgentPerformanceMetrics(organizationId);
    
    // Calculate performance score based on policies sold and client count
    const scoredAgents = agents.map(agent => ({
      agentId: agent.agentId,
      agentName: agent.agentName,
      score: (agent.policiesSold * 10) + (agent.activeClients * 2) + (agent.quotesGenerated * 1),
      policiesSold: agent.policiesSold,
      clientSatisfaction: 4.2, // Default satisfaction score - can be enhanced with real feedback
    }));

    return scoredAgents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getOrganizationTeamOverview(organizationId: number): Promise<{
    agents: {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      lastLogin: Date | null;
      clientCount: number;
      joiningDate: Date;
    }[];
    members: {
      id: number;
      name: string;
      email: string;
      status: string;
      assignedAgent: string | null;
      joiningDate: Date;
    }[];
    invitations: {
      id: number;
      email: string;
      role: string;
      status: string;
      invitedBy: string;
      createdAt: Date;
      expiresAt: Date;
    }[];
  }> {
    try {
    // Get agents - using simple approach to avoid query issues
    const agents = await db.select().from(users).where(
      and(
        eq(users.organizationId, organizationId),
        sql`${users.role} IN ('Agent', 'TenantAdmin')`
      )
    );

    const agentData = await Promise.all(agents.map(async (agent) => {
      // Count clients for each agent
      const [contactCount] = await db.select({
        count: count(),
      }).from(contacts).where(
        and(
          eq(contacts.organizationId, organizationId),
          eq(contacts.assignedAgent, agent.id)
        )
      );

      const [memberCount] = await db.select({
        count: count(),
      }).from(members).where(
        and(
          eq(members.organizationId, organizationId),
          eq(members.assignedAgent, agent.id)
        )
      );

      return {
        id: agent.id,
        name: agent.email || 'Unknown', // Simplified name handling
        email: agent.email || '',
        role: agent.role || 'Agent',
        isActive: agent.isActive || false,
        lastLogin: null, // Can be enhanced with session tracking
        clientCount: (contactCount?.count || 0) + (memberCount?.count || 0),
        joiningDate: agent.createdAt || new Date(),
      };
    }));

    // Get members - using simple approach to avoid query issues
    const membersList = await db.select().from(members).where(
      eq(members.organizationId, organizationId)
    );

    const memberData = membersList.map(member => ({
      id: member.id,
      name: member.email || `Member ${member.id}`, // Simplified name handling
      email: member.email || '',
      status: member.membershipStatus || 'Active',
      assignedAgent: member.assignedAgent,
      joiningDate: member.createdAt || new Date(),
    }));

    // Get invitations (temporarily disabled due to missing table)
    const invitationData: any[] = [];
    // TODO: Re-enable when organization_invitations table is available
    // const invitationsList = await db.select().from(organizationInvitations).where(
    //   eq(organizationInvitations.organizationId, organizationId)
    // );
    // const invitationData = invitationsList.map(invitation => ({
    //   id: invitation.id,
    //   email: invitation.email,
    //   role: invitation.role,
    //   status: invitation.status,
    //   invitedBy: invitation.invitedBy,
    //   createdAt: invitation.createdAt || new Date(),
    //   expiresAt: invitation.expiresAt,
    // }));

    return {
      agents: agentData,
      members: memberData,
      invitations: invitationData,
    };
    } catch (error) {
      console.error('Error in getOrganizationTeamOverview:', error);
      // Return empty data structure on error to allow page to load
      return {
        agents: [],
        members: [],
        invitations: [],
      };
    }
  }

  async getAgentClientAssignments(organizationId: number, agentId?: string): Promise<{
    clientId: number;
    clientName: string;
    clientEmail: string;
    assignedAgent: string;
    assignedAgentName: string;
    assignmentDate: Date;
    clientStatus: string;
    lastInteraction: Date | null;
  }[]> {
    // Get members assigned to agents
    const memberAssignments = await db.select({
      clientId: members.id,
      clientName: members.email, // Simplified - firstName/lastName columns don't exist
      clientEmail: members.email,
      assignedAgent: members.assignedAgent,
      assignmentDate: members.createdAt,
      clientStatus: members.membershipStatus,
    }).from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          isNotNull(members.assignedAgent),
          agentId ? eq(members.assignedAgent, agentId) : sql`1=1`
        )
      );

    // Get agent names for the assignments
    const agentIds = memberAssignments.map(m => m.assignedAgent).filter(Boolean);
    const agents = agentIds.length > 0 ? await db.select({
      id: users.id,
      name: users.email, // Simplified - firstName/lastName columns don't exist
    }).from(users).where(sql`${users.id} = ANY(${agentIds})`) : [];

    const agentMap = new Map(agents.map(agent => [agent.id, agent.name]));

    return memberAssignments.map(assignment => ({
      clientId: assignment.clientId,
      clientName: assignment.clientName || 'Unknown',
      clientEmail: assignment.clientEmail || '',
      assignedAgent: assignment.assignedAgent || '',
      assignedAgentName: agentMap.get(assignment.assignedAgent || '') || 'Unknown Agent',
      assignmentDate: assignment.assignmentDate || new Date(),
      clientStatus: assignment.clientStatus || 'Active',
      lastInteraction: null, // Can be enhanced with activity tracking
    }));
  }

  async assignClientToAgent(clientId: number, agentId: string, assignedBy: string): Promise<void> {
    await db.update(members)
      .set({ 
        assignedAgent: agentId,
        updatedAt: new Date() 
      })
      .where(eq(members.id, clientId));
  }

  async transferClientToAgent(clientId: number, fromAgentId: string, toAgentId: string, reason: string): Promise<void> {
    await db.update(members)
      .set({ 
        assignedAgent: toAgentId,
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(members.id, clientId),
          eq(members.assignedAgent, fromAgentId)
        )
      );
  }

  // Enhanced Team Management Methods

  async getEnhancedMemberList(organizationId: number, options: {
    search?: string;
    roleFilter?: string;
    statusFilter?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    members: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      isActive: boolean;
      clientCount: number;
      joiningDate: Date;
      lastLogin: Date | null;
      performance: {
        quotesGenerated: number;
        policiesSold: number;
        totalRevenue: number;
        performanceScore: number;
      };
    }[];
    total: number;
  }> {
    try {
      const { search, roleFilter, statusFilter, limit = 50, offset = 0 } = options;

      // Build filter conditions
      const conditions = [eq(users.organizationId, organizationId)];
      
      if (roleFilter && roleFilter !== 'all') {
        conditions.push(eq(users.role, roleFilter));
      }
      
      if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(users.isActive, statusFilter === 'active'));
      }

      // Get users with search functionality
      let query = db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      }).from(users).where(and(...conditions));

      if (search) {
        // For simplicity, search by email (in real system, would search by name too)
        query = query.where(ilike(users.email, `%${search}%`));
      }

      const usersList = await query.limit(limit).offset(offset);

      // Get total count
      const [totalCount] = await db.select({ count: count() })
        .from(users)
        .where(and(...conditions));

      // Enhance each user with performance data
      const enhancedMembers = await Promise.all(usersList.map(async (user) => {
        // Get client count
        const [contactCount] = await db.select({
          count: count(),
        }).from(contacts).where(eq(contacts.assignedAgent, user.id));

        const [memberCount] = await db.select({
          count: count(),
        }).from(members).where(eq(members.assignedAgent, user.id));

        // Generate performance metrics (placeholder data)
        const quotesGenerated = Math.floor(Math.random() * 100);
        const policiesSold = Math.floor(Math.random() * 30);
        const totalRevenue = policiesSold * 1500 + Math.random() * 10000;
        const performanceScore = Math.floor((quotesGenerated * 0.3 + policiesSold * 2 + totalRevenue / 1000) / 3);

        return {
          id: user.id,
          name: user.email, // Simplified - using email as name
          email: user.email,
          role: user.role,
          status: user.isActive ? 'Active' : 'Inactive',
          isActive: user.isActive,
          clientCount: (contactCount?.count || 0) + (memberCount?.count || 0),
          joiningDate: user.createdAt || new Date(),
          lastLogin: null, // Could be enhanced with session tracking
          performance: {
            quotesGenerated,
            policiesSold,
            totalRevenue: Math.round(totalRevenue),
            performanceScore: Math.min(100, performanceScore),
          },
        };
      }));

      return {
        members: enhancedMembers,
        total: totalCount?.count || 0,
      };
    } catch (error) {
      console.error('Error in getEnhancedMemberList:', error);
      return { members: [], total: 0 };
    }
  }

  async updateMemberRole(userId: string, newRole: string, updatedBy: string): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          role: newRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`User ${userId} role updated to ${newRole} by ${updatedBy}`);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async updateMemberStatus(userId: string, isActive: boolean, updatedBy: string): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`User ${userId} status updated to ${isActive ? 'active' : 'inactive'} by ${updatedBy}`);
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  async bulkUpdateMembers(memberIds: string[], updates: {
    role?: string;
    isActive?: boolean;
  }, updatedBy: string): Promise<void> {
    try {
      const updateData: any = { updatedAt: new Date() };
      
      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }
      
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }

      await db.update(users)
        .set(updateData)
        .where(inArray(users.id, memberIds));

      console.log(`Bulk updated ${memberIds.length} members by ${updatedBy}:`, updates);
    } catch (error) {
      console.error('Error in bulk update members:', error);
      throw error;
    }
  }

  async removeMember(userId: string, removedBy: string): Promise<void> {
    try {
      // In a real system, you might soft-delete or archive instead of hard delete
      await db.update(users)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Member ${userId} deactivated by ${removedBy}`);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  async getMemberPerformanceDetails(userId: string, organizationId: number): Promise<{
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      joiningDate: Date;
      lastLogin: Date | null;
    };
    performance: {
      quotesGenerated: number;
      policiesSold: number;
      totalRevenue: number;
      performanceScore: number;
      clientCount: number;
      recentActivity: {
        date: Date;
        action: string;
        description: string;
      }[];
    };
  } | null> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)));

      if (!user) {
        return null;
      }

      // Get client count
      const [contactCount] = await db.select({ count: count() })
        .from(contacts).where(eq(contacts.assignedAgent, userId));
      
      const [memberCount] = await db.select({ count: count() })
        .from(members).where(eq(members.assignedAgent, userId));

      // Generate performance data (placeholder)
      const quotesGenerated = Math.floor(Math.random() * 100);
      const policiesSold = Math.floor(Math.random() * 30);
      const totalRevenue = policiesSold * 1500 + Math.random() * 10000;

      return {
        member: {
          id: user.id,
          name: user.email,
          email: user.email,
          role: user.role,
          status: user.isActive ? 'Active' : 'Inactive',
          joiningDate: user.createdAt || new Date(),
          lastLogin: null,
        },
        performance: {
          quotesGenerated,
          policiesSold,
          totalRevenue: Math.round(totalRevenue),
          performanceScore: Math.floor((quotesGenerated * 0.3 + policiesSold * 2) / 2),
          clientCount: (contactCount?.count || 0) + (memberCount?.count || 0),
          recentActivity: [
            {
              date: new Date(),
              action: 'Quote Generated',
              description: 'Generated quote for life insurance policy',
            },
            {
              date: new Date(Date.now() - 86400000),
              action: 'Client Meeting',
              description: 'Met with client to discuss coverage options',
            },
          ],
        },
      };
    } catch (error) {
      console.error('Error getting member performance details:', error);
      return null;
    }
  }

  async getOrganizationActivityFeed(organizationId: number, limit: number): Promise<{
    id: string;
    type: string;
    description: string;
    actorName: string;
    targetName?: string;
    createdAt: Date;
  }[]> {
    // Get recent activities from various sources
    const activities = [];

    // Recent member additions
    const recentMembers = await db.select({
      id: members.id,
      type: sql<string>`'member_added'`,
      description: sql<string>`'New member joined the organization'`,
      actorName: members.email, // Simplified - use email instead of firstName/lastName
      createdAt: members.createdAt,
    }).from(members)
      .where(eq(members.organizationId, organizationId))
      .orderBy(desc(members.createdAt))
      .limit(Math.floor(limit / 3));

    // Recent invitations (temporarily disabled due to missing table)
    const recentInvitations: any[] = [];
    // TODO: Re-enable when organization_invitations table is available
    // const recentInvitations = await db.select({
    //   id: organizationInvitations.id,
    //   type: sql<string>`'invitation_sent'`,
    //   description: sql<string>`'Invitation sent to join organization'`,
    //   actorName: organizationInvitations.email,
    //   createdAt: organizationInvitations.createdAt,
    // }).from(organizationInvitations)
    //   .where(eq(organizationInvitations.organizationId, organizationId))
    //   .orderBy(desc(organizationInvitations.createdAt))
    //   .limit(Math.floor(limit / 3));

    // Recent quotes
    const orgUsers = await db.select({ id: users.id }).from(users)
      .where(eq(users.organizationId, organizationId));
    
    const userIds = orgUsers.map(u => u.id);
    const recentQuotes = userIds.length > 0 ? await db.select({
      id: insuranceQuotes.id,
      type: sql<string>`'quote_generated'`,
      description: sql<string>`'New quote generated'`,
      actorName: sql<string>`'Agent'`,
      createdAt: insuranceQuotes.createdAt,
    }).from(insuranceQuotes)
      .where(sql`${insuranceQuotes.userId} = ANY(${userIds})`)
      .orderBy(desc(insuranceQuotes.createdAt))
      .limit(Math.floor(limit / 3)) : [];

    // Combine and sort all activities
    const allActivities = [
      ...recentMembers.map(m => ({
        id: m.id.toString(),
        type: m.type,
        description: m.description,
        actorName: m.actorName || 'Unknown',
        createdAt: m.createdAt || new Date(),
      })),
      ...recentInvitations.map(i => ({
        id: i.id.toString(),
        type: i.type,
        description: i.description,
        actorName: i.actorName || 'Unknown',
        createdAt: i.createdAt || new Date(),
      })),
      ...recentQuotes.map(q => ({
        id: q.id.toString(),
        type: q.type,
        description: q.description,
        actorName: q.actorName || 'Unknown',
        createdAt: q.createdAt || new Date(),
      })),
    ];

    return allActivities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getOrganizationInsights(organizationId: number): Promise<{
    memberRetentionRate: number;
    averageTimeToPolicy: number;
    mostPopularInsuranceType: string;
    agentUtilization: number;
    customerSatisfactionScore: number;
    growthRate: number;
  }> {
    // Calculate member retention rate (active vs total)
    const [memberStats] = await db.select({
      total: count(),
      active: count(),
    }).from(members).where(eq(members.organizationId, organizationId));

    const [activeMembers] = await db.select({
      active: count(),
    }).from(members).where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.membershipStatus, 'Active')
      )
    );

    const memberRetentionRate = memberStats?.total ? 
      ((activeMembers?.active || 0) / memberStats.total) * 100 : 0;

    // Calculate growth rate (new members this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthMembers] = await db.select({
      count: count(),
    }).from(members).where(
      and(
        eq(members.organizationId, organizationId),
        gte(members.createdAt, thisMonthStart)
      )
    );

    const [lastMonthMembers] = await db.select({
      count: count(),
    }).from(members).where(
      and(
        eq(members.organizationId, organizationId),
        gte(members.createdAt, lastMonthStart),
        lte(members.createdAt, lastMonthEnd)
      )
    );

    const growthRate = lastMonthMembers?.count ? 
      (((thisMonthMembers?.count || 0) - lastMonthMembers.count) / lastMonthMembers.count) * 100 : 0;

    // Get most popular insurance type (from quotes)
    const orgUsers = await db.select({ id: users.id }).from(users)
      .where(eq(users.organizationId, organizationId));
    
    const userIds = orgUsers.map(u => u.id);
    const insuranceTypeStats = userIds.length > 0 ? await db.select({
      typeId: insuranceQuotes.typeId,
      count: count(),
    }).from(insuranceQuotes)
      .where(sql`${insuranceQuotes.userId} = ANY(${userIds})`)
      .groupBy(insuranceQuotes.typeId)
      .orderBy(desc(count()))
      .limit(1) : [];

    let mostPopularInsuranceType = 'N/A';
    if (insuranceTypeStats.length > 0 && insuranceTypeStats[0].typeId) {
      const typeName = await this.getInsuranceTypeName(insuranceTypeStats[0].typeId);
      mostPopularInsuranceType = typeName;
    }

    return {
      memberRetentionRate,
      averageTimeToPolicy: 14, // Default to 14 days - can be calculated from actual data
      mostPopularInsuranceType,
      agentUtilization: 75, // Default percentage - can be calculated from activity data
      customerSatisfactionScore: 4.2, // Default score - can be enhanced with feedback system
      growthRate,
    };
  }

  // ===== AGENT DIRECTORY AND COLLABORATION METHODS =====
  
  /**
   * Get agents with cross-organization support for SuperAdmin users
   * Phase 1.2: Enhanced Agent Query Methods
   */
  async getOrganizationAgents(organizationId: number): Promise<any[]> {
    // Legacy method - delegates to new getAgents method
    // This maintains backward compatibility
    const agents = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'Agent'),
        eq(users.isActive, true)
      )
    );

    // Get organization details for each agent
    const agentsWithOrgs = await Promise.all(agents.map(async (agent) => {
      const [org] = await db.select({
        id: agentOrganizations.id,
        name: agentOrganizations.name,
        displayName: agentOrganizations.displayName,
      })
      .from(agentOrganizations)
      .where(eq(agentOrganizations.id, agent.organizationId));

      return {
        id: agent.id,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
        organization: org || { id: agent.organizationId, name: 'Unknown', displayName: 'Unknown' },
        profile: {
          id: 1,
          specializations: ["Life Insurance", "Health Insurance"],
          bio: "Experienced insurance agent",
          yearsExperience: 5,
          languagesSpoken: ["English"],
          certifications: ["Life Insurance License"],
          contactPreferences: { preferredMethod: "email" },
          availabilitySchedule: { workingHours: "9-5" },
          clientCapacity: 100,
          currentClientCount: 25,
          isAcceptingNewClients: true,
          performanceRating: 4.5,
          lastActiveAt: new Date().toISOString(),
        }
      };
    }));

    return agentsWithOrgs;
  }

  /**
   * Get agents with scope-aware filtering (SuperAdmin sees all orgs, others see their org)
   * Phase 1.2: Enhanced Agent Query Methods
   */
  async getAgents(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ agents: any[]; total: number }> {
    const scope = resolveDataScope(userContext);
    
    // Build base query conditions
    const conditions = [
      eq(users.role, 'Agent'),
      eq(users.isActive, true)
    ];

    // Add organization filter for non-SuperAdmin users
    if (!scope.isGlobal && scope.organizationId) {
      conditions.push(eq(users.organizationId, scope.organizationId));
    }

    // Get total count for pagination
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(...conditions));

    // Query agents with organization data
    let agentsQuery = db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(and(...conditions));

    // Apply pagination if provided
    if (pagination) {
      agentsQuery = agentsQuery.limit(pagination.limit).offset(pagination.offset);
    }

    const agents = await agentsQuery;

    // Get organization details for each agent
    const agentsWithOrgs = await Promise.all(agents.map(async (agent) => {
      const [org] = await db.select({
        id: agentOrganizations.id,
        name: agentOrganizations.name,
        displayName: agentOrganizations.displayName,
      })
      .from(agentOrganizations)
      .where(eq(agentOrganizations.id, agent.organizationId));

      return {
        id: agent.id,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
        organization: org || { id: agent.organizationId, name: 'Unknown', displayName: 'Unknown' },
        profile: {
          id: 1,
          specializations: ["Life Insurance", "Health Insurance"],
          bio: "Experienced insurance agent",
          yearsExperience: 5,
          languagesSpoken: ["English"],
          certifications: ["Life Insurance License"],
          contactPreferences: { preferredMethod: "email" },
          availabilitySchedule: { workingHours: "9-5" },
          clientCapacity: 100,
          currentClientCount: 25,
          isAcceptingNewClients: true,
          performanceRating: 4.5,
          lastActiveAt: new Date().toISOString(),
        }
      };
    }));

    return { agents: agentsWithOrgs, total: count };
  }

  /**
   * Legacy search method - for backward compatibility
   */
  async searchAgents(organizationId: number, filters: {
    specializations?: string[];
    availableNow?: boolean;
    acceptingClients?: boolean;
    languages?: string[];
    experienceMin?: number;
    ratingMin?: number;
  }): Promise<any[]> {
    let query = db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      profile: {
        id: agentProfiles.id,
        specializations: agentProfiles.specializations,
        bio: agentProfiles.bio,
        yearsExperience: agentProfiles.yearsExperience,
        languagesSpoken: agentProfiles.languagesSpoken,
        certifications: agentProfiles.certifications,
        contactPreferences: agentProfiles.contactPreferences,
        availabilitySchedule: agentProfiles.availabilitySchedule,
        clientCapacity: agentProfiles.clientCapacity,
        currentClientCount: agentProfiles.currentClientCount,
        isAcceptingNewClients: agentProfiles.isAcceptingNewClients,
        performanceRating: agentProfiles.performanceRating,
        lastActiveAt: agentProfiles.lastActiveAt,
      }
    })
    .from(users)
    .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'Agent'),
        eq(users.isActive, true),
        filters.acceptingClients !== undefined ? eq(agentProfiles.isAcceptingNewClients, filters.acceptingClients) : undefined,
        filters.experienceMin !== undefined ? gte(agentProfiles.yearsExperience, filters.experienceMin) : undefined,
        filters.ratingMin !== undefined ? gte(agentProfiles.performanceRating, sql`${filters.ratingMin}`) : undefined
      )
    );

    return await query;
  }

  /**
   * Scope-aware agent search with cross-organization support for SuperAdmin
   * Phase 1.2: Enhanced Agent Query Methods
   */
  async searchAgentsWithContext(userContext: UserContext, filters: {
    specializations?: string[];
    availableNow?: boolean;
    acceptingClients?: boolean;
    languages?: string[];
    experienceMin?: number;
    ratingMin?: number;
  }): Promise<any[]> {
    const scope = resolveDataScope(userContext);
    
    // Build base conditions
    const conditions = [
      eq(users.role, 'Agent'),
      eq(users.isActive, true)
    ];

    // Add organization filter for non-SuperAdmin users
    if (!scope.isGlobal && scope.organizationId) {
      conditions.push(eq(users.organizationId, scope.organizationId));
    }

    // Add filter conditions
    if (filters.acceptingClients !== undefined) {
      conditions.push(eq(agentProfiles.isAcceptingNewClients, filters.acceptingClients));
    }
    if (filters.experienceMin !== undefined) {
      conditions.push(gte(agentProfiles.yearsExperience, filters.experienceMin));
    }
    if (filters.ratingMin !== undefined) {
      conditions.push(gte(agentProfiles.performanceRating, sql`${filters.ratingMin}`));
    }

    const results = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      organizationId: users.organizationId,
      profile: {
        id: agentProfiles.id,
        specializations: agentProfiles.specializations,
        bio: agentProfiles.bio,
        yearsExperience: agentProfiles.yearsExperience,
        languagesSpoken: agentProfiles.languagesSpoken,
        certifications: agentProfiles.certifications,
        contactPreferences: agentProfiles.contactPreferences,
        availabilitySchedule: agentProfiles.availabilitySchedule,
        clientCapacity: agentProfiles.clientCapacity,
        currentClientCount: agentProfiles.currentClientCount,
        isAcceptingNewClients: agentProfiles.isAcceptingNewClients,
        performanceRating: agentProfiles.performanceRating,
        lastActiveAt: agentProfiles.lastActiveAt,
      }
    })
    .from(users)
    .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
    .where(and(...conditions));

    // Add organization metadata for each result
    const resultsWithOrgs = await Promise.all(results.map(async (result) => {
      const [org] = await db.select({
        id: agentOrganizations.id,
        name: agentOrganizations.name,
        displayName: agentOrganizations.displayName,
      })
      .from(agentOrganizations)
      .where(eq(agentOrganizations.id, result.organizationId));

      return {
        ...result,
        organization: org || { id: result.organizationId, name: 'Unknown', displayName: 'Unknown' }
      };
    }));

    return resultsWithOrgs;
  }

  async getAgentProfile(userId: string): Promise<any | null> {
    const [result] = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      organizationId: users.organizationId,
      isActive: users.isActive,
      profile: {
        id: agentProfiles.id,
        specializations: agentProfiles.specializations,
        bio: agentProfiles.bio,
        licenseNumber: agentProfiles.licenseNumber,
        yearsExperience: agentProfiles.yearsExperience,
        languagesSpoken: agentProfiles.languagesSpoken,
        certifications: agentProfiles.certifications,
        contactPreferences: agentProfiles.contactPreferences,
        availabilitySchedule: agentProfiles.availabilitySchedule,
        profileImageUrl: agentProfiles.profileImageUrl,
        clientCapacity: agentProfiles.clientCapacity,
        currentClientCount: agentProfiles.currentClientCount,
        isAcceptingNewClients: agentProfiles.isAcceptingNewClients,
        collaborationPreferences: agentProfiles.collaborationPreferences,
        performanceRating: agentProfiles.performanceRating,
        lastActiveAt: agentProfiles.lastActiveAt,
        isActive: agentProfiles.isActive,
      }
    })
    .from(users)
    .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
    .where(eq(users.id, userId));

    return result || null;
  }

  async updateAgentProfile(userId: string, profileData: any): Promise<any> {
    // Check if profile exists
    const [existingProfile] = await db.select({ id: agentProfiles.id })
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, userId));

    if (existingProfile) {
      // Update existing profile
      const [updated] = await db
        .update(agentProfiles)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(agentProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new profile
      const [created] = await db
        .insert(agentProfiles)
        .values({
          userId,
          ...profileData,
        })
        .returning();
      return created;
    }
  }

  // ===== CLIENT ASSIGNMENT AND RELATIONSHIP MANAGEMENT =====

  async getOrganizationClients(organizationId: number): Promise<any[]> {
    const clients = await db.select({
      id: members.id,
      email: members.email,
      firstName: members.firstName,
      lastName: members.lastName,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      assignment: {
        id: clientAssignments.id,
        agentId: clientAssignments.agentId,
        assignmentType: clientAssignments.assignmentType,
        status: clientAssignments.status,
        priority: clientAssignments.priority,
        assignedAt: clientAssignments.assignedAt,
        notes: clientAssignments.notes,
      },
      agent: {
        id: users.id,
        email: users.email,
        role: users.role,
      }
    })
    .from(members)
    .leftJoin(clientAssignments, eq(members.id, clientAssignments.clientId))
    .leftJoin(users, eq(clientAssignments.agentId, users.id))
    .where(eq(members.organizationId, organizationId))
    .orderBy(desc(members.createdAt));

    return clients;
  }

  async getAgentClients(agentId: string, organizationId: number): Promise<any[]> {
    const clients = await db.select({
      id: members.id,
      email: members.email,
      firstName: members.firstName,
      lastName: members.lastName,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      assignment: {
        id: clientAssignments.id,
        assignmentType: clientAssignments.assignmentType,
        status: clientAssignments.status,
        priority: clientAssignments.priority,
        assignedAt: clientAssignments.assignedAt,
        notes: clientAssignments.notes,
      }
    })
    .from(members)
    .innerJoin(clientAssignments, eq(members.id, clientAssignments.clientId))
    .where(
      and(
        eq(clientAssignments.agentId, agentId),
        eq(clientAssignments.organizationId, organizationId),
        eq(clientAssignments.status, 'Active')
      )
    )
    .orderBy(desc(clientAssignments.assignedAt));

    return clients;
  }

  async assignClientToAgent(assignmentData: {
    clientId: number;
    agentId: string;
    organizationId: number;
    assignmentType: string;
    priority?: string;
    notes?: string;
  }): Promise<any> {
    // Check if assignment already exists
    const [existingAssignment] = await db.select()
      .from(clientAssignments)
      .where(
        and(
          eq(clientAssignments.clientId, assignmentData.clientId),
          eq(clientAssignments.status, 'Active')
        )
      );

    if (existingAssignment) {
      // Transfer existing assignment
      return await this.transferClientAssignment(
        existingAssignment.id,
        assignmentData.agentId,
        `Transferred from ${existingAssignment.agentId}`
      );
    }

    // Create new assignment
    const [newAssignment] = await db.insert(clientAssignments)
      .values({
        ...assignmentData,
        status: 'Active',
        assignedAt: new Date(),
      })
      .returning();

    return newAssignment;
  }

  async transferClientAssignment(
    assignmentId: number, 
    newAgentId: string, 
    reason?: string
  ): Promise<any> {
    // Get current assignment
    const [currentAssignment] = await db.select()
      .from(clientAssignments)
      .where(eq(clientAssignments.id, assignmentId));

    if (!currentAssignment) {
      throw new Error('Assignment not found');
    }

    // Update assignment with transfer information
    const [updatedAssignment] = await db
      .update(clientAssignments)
      .set({
        agentId: newAgentId,
        transferredFrom: currentAssignment.agentId,
        transferredTo: newAgentId,
        transferredAt: new Date(),
        notes: reason ? `${currentAssignment.notes || ''}\nTransfer reason: ${reason}` : currentAssignment.notes,
        updatedAt: new Date(),
      })
      .where(eq(clientAssignments.id, assignmentId))
      .returning();

    return updatedAssignment;
  }

  async updateClientAssignment(
    assignmentId: number, 
    updates: {
      status?: string;
      priority?: string;
      assignmentType?: string;
      notes?: string;
    }
  ): Promise<any> {
    const [updatedAssignment] = await db
      .update(clientAssignments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(clientAssignments.id, assignmentId))
      .returning();

    return updatedAssignment;
  }

  async getClientAssignmentDetails(clientId: number): Promise<any | null> {
    const [result] = await db.select({
      client: {
        id: members.id,
        email: members.email,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        status: members.status,
        organizationId: members.organizationId,
      },
      assignment: {
        id: clientAssignments.id,
        agentId: clientAssignments.agentId,
        assignmentType: clientAssignments.assignmentType,
        status: clientAssignments.status,
        priority: clientAssignments.priority,
        assignedAt: clientAssignments.assignedAt,
        notes: clientAssignments.notes,
        transferredFrom: clientAssignments.transferredFrom,
        transferredTo: clientAssignments.transferredTo,
        transferredAt: clientAssignments.transferredAt,
      },
      agent: {
        id: users.id,
        email: users.email,
        role: users.role,
      }
    })
    .from(members)
    .leftJoin(clientAssignments, eq(members.id, clientAssignments.clientId))
    .leftJoin(users, eq(clientAssignments.agentId, users.id))
    .where(eq(members.id, clientId));

    return result || null;
  }

  async getUnassignedClients(organizationId: number): Promise<any[]> {
    const unassignedClients = await db.select({
      id: members.id,
      email: members.email,
      firstName: members.firstName,
      lastName: members.lastName,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
    })
    .from(members)
    .leftJoin(clientAssignments, 
      and(
        eq(members.id, clientAssignments.clientId),
        eq(clientAssignments.status, 'Active')
      )
    )
    .where(
      and(
        eq(members.organizationId, organizationId),
        isNull(clientAssignments.id) // No active assignment
      )
    )
    .orderBy(desc(members.createdAt));

    return unassignedClients;
  }

  // ===== ADVANCED ORGANIZATION ANALYTICS AND INSIGHTS =====

  async getOrganizationAdvancedAnalytics(organizationId: number): Promise<any> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue Analytics - Track policy values and revenue
    const orgUsers = await db.select({ id: users.id }).from(users)
      .where(eq(users.organizationId, organizationId));
    
    let revenueMetrics = {
      totalPolicyValue: 0,
      monthlyRecurringRevenue: 0,
      averagePolicyValue: 0,
      conversionRate: 0,
    };

    if (orgUsers.length > 0) {
      const userIds = orgUsers.map(u => u.id);
      
      // Get quote to policy conversion rate
      const [quoteCount] = await db.select({ count: count() })
        .from(insuranceQuotes)
        .where(sql`${insuranceQuotes.userId} = ANY(${userIds})`);

      const [policyCount] = await db.select({ count: count() })
        .from(policies)
        .innerJoin(members, eq(policies.memberId, members.id))
        .where(eq(members.organizationId, organizationId));

      revenueMetrics.conversionRate = quoteCount.count > 0 
        ? ((policyCount.count || 0) / quoteCount.count) * 100 
        : 0;
    }

    // Client Lifecycle Analytics
    const lifecycleMetrics = await this.getClientLifecycleAnalytics(organizationId);

    // Agent Workload Distribution
    const workloadMetrics = await this.getAgentWorkloadDistribution(organizationId);

    // Performance Comparison (this month vs last month)
    const thisMonthMembers = await db.select({ count: count() })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          gte(members.createdAt, thisMonth)
        )
      );

    const lastMonthMembers = await db.select({ count: count() })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          gte(members.createdAt, lastMonth),
          lte(members.createdAt, lastMonthEnd)
        )
      );

    const memberGrowthRate = lastMonthMembers[0]?.count 
      ? (((thisMonthMembers[0]?.count || 0) - lastMonthMembers[0].count) / lastMonthMembers[0].count) * 100
      : 0;

    return {
      revenueMetrics,
      lifecycleMetrics,
      workloadMetrics,
      comparativeAnalytics: {
        memberGrowthRate,
        thisMonthNewMembers: thisMonthMembers[0]?.count || 0,
        lastMonthNewMembers: lastMonthMembers[0]?.count || 0,
      }
    };
  }

  async getClientLifecycleAnalytics(organizationId: number): Promise<any> {
    // Lead to Member conversion tracking
    const [totalContacts] = await db.select({ count: count() })
      .from(contacts)
      .where(eq(contacts.organizationId, organizationId));

    const [totalMembers] = await db.select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, organizationId));

    const leadConversionRate = totalContacts.count > 0 
      ? ((totalMembers.count || 0) / totalContacts.count) * 100 
      : 0;

    // Average time to conversion (simplified - can be enhanced)
    const averageTimeToConversion = 14; // Days - placeholder for real calculation

    // Client retention analysis
    const retentionRate = await this.calculateClientRetentionRate(organizationId);

    return {
      totalProspects: totalContacts.count || 0,
      totalClients: totalMembers.count || 0,
      leadConversionRate,
      averageTimeToConversion,
      clientRetentionRate: retentionRate,
    };
  }

  async getAgentWorkloadDistribution(organizationId: number): Promise<any> {
    const agents = await db.select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        sql`${users.role} IN ('Agent', 'TenantAdmin')`
      )
    );

    const workloadData = [];

    for (const agent of agents) {
      // Get assigned clients count
      const [assignedClients] = await db.select({ count: count() })
        .from(clientAssignments)
        .where(
          and(
            eq(clientAssignments.agentId, agent.id),
            eq(clientAssignments.organizationId, organizationId),
            eq(clientAssignments.status, 'Active')
          )
        );

      // Get active policies count
      const [activePolicies] = await db.select({ count: count() })
        .from(policies)
        .innerJoin(members, eq(policies.memberId, members.id))
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.assignedAgent, agent.id)
          )
        );

      // Get active claims count
      const [activeClaims] = await db.select({ count: count() })
        .from(claims)
        .innerJoin(members, eq(claims.memberId, members.id))
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.assignedAgent, agent.id),
            sql`${claims.status} IN ('submitted', 'under_review', 'approved')`
          )
        );

      const totalWorkload = (assignedClients.count || 0) + (activePolicies.count || 0) + (activeClaims.count || 0);
      
      workloadData.push({
        agentId: agent.id,
        agentName: agent.email,
        assignedClients: assignedClients.count || 0,
        activePolicies: activePolicies.count || 0,
        activeClaims: activeClaims.count || 0,
        totalWorkload,
        workloadLevel: totalWorkload > 50 ? 'High' : totalWorkload > 25 ? 'Medium' : 'Low'
      });
    }

    return {
      agents: workloadData,
      averageWorkload: workloadData.length > 0 
        ? workloadData.reduce((sum, agent) => sum + agent.totalWorkload, 0) / workloadData.length 
        : 0,
      highWorkloadAgents: workloadData.filter(agent => agent.workloadLevel === 'High').length,
    };
  }

  async calculateClientRetentionRate(organizationId: number): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count clients from 30+ days ago
    const [oldClients] = await db.select({ count: count() })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          lte(members.createdAt, thirtyDaysAgo)
        )
      );

    // Count how many are still active (simplified logic)
    const [activeOldClients] = await db.select({ count: count() })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          lte(members.createdAt, thirtyDaysAgo),
          eq(members.status, 'Active')
        )
      );

    return oldClients.count > 0 
      ? ((activeOldClients.count || 0) / oldClients.count) * 100 
      : 100; // 100% if no old clients to measure
  }

  async getOrganizationKPIDashboard(organizationId: number): Promise<any> {
    const basicAnalytics = await this.getOrganizationAnalytics(organizationId);
    const advancedAnalytics = await this.getOrganizationAdvancedAnalytics(organizationId);
    
    // Key Performance Indicators
    const kpis = {
      // Growth KPIs
      memberGrowthRate: advancedAnalytics.comparativeAnalytics.memberGrowthRate,
      clientAcquisitionCost: 150, // Placeholder - can be calculated from marketing spend
      
      // Performance KPIs
      agentUtilizationRate: 75, // Placeholder - calculated from workload data
      averageResponseTime: 2.5, // Hours - placeholder for real tracking
      
      // Revenue KPIs
      conversionRate: advancedAnalytics.revenueMetrics.conversionRate,
      clientRetentionRate: advancedAnalytics.lifecycleMetrics.clientRetentionRate,
      
      // Service KPIs
      customerSatisfactionScore: 4.2, // Out of 5 - placeholder for real feedback system
      claimProcessingTime: 3.5, // Days - placeholder for real tracking
    };

    // Performance Alerts
    const alerts = [];
    if (kpis.memberGrowthRate < -10) {
      alerts.push({ type: 'warning', message: 'Member growth rate declined significantly' });
    }
    if (advancedAnalytics.workloadMetrics.highWorkloadAgents > 0) {
      alerts.push({ 
        type: 'info', 
        message: `${advancedAnalytics.workloadMetrics.highWorkloadAgents} agents have high workload` 
      });
    }
    if (kpis.conversionRate < 10) {
      alerts.push({ type: 'warning', message: 'Quote to policy conversion rate is low' });
    }

    return {
      ...basicAnalytics,
      ...advancedAnalytics,
      kpis,
      alerts,
      lastUpdated: new Date(),
    };
  }

  // ===== ENHANCED AGENT PERFORMANCE TRACKING AND REPORTING =====

  async getAgentPerformanceHistory(agentId: string, organizationId: number, months: number = 6): Promise<any[]> {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Quotes generated this month
      const [monthlyQuotes] = await db.select({ count: count() })
        .from(insuranceQuotes)
        .where(
          and(
            eq(insuranceQuotes.userId, agentId),
            gte(insuranceQuotes.createdAt, monthStart),
            lte(insuranceQuotes.createdAt, monthEnd)
          )
        );

      // New clients assigned this month
      const [monthlyClients] = await db.select({ count: count() })
        .from(clientAssignments)
        .where(
          and(
            eq(clientAssignments.agentId, agentId),
            eq(clientAssignments.organizationId, organizationId),
            gte(clientAssignments.assignedAt, monthStart),
            lte(clientAssignments.assignedAt, monthEnd)
          )
        );

      // Policies sold this month (simplified - using member creation as proxy)
      const [monthlyPolicies] = await db.select({ count: count() })
        .from(members)
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.assignedAgent, agentId),
            gte(members.createdAt, monthStart),
            lte(members.createdAt, monthEnd)
          )
        );

      result.push({
        month: monthName,
        quotesGenerated: monthlyQuotes?.count || 0,
        newClients: monthlyClients?.count || 0,
        policiesSold: monthlyPolicies?.count || 0,
        performanceScore: ((monthlyQuotes?.count || 0) * 1) + ((monthlyClients?.count || 0) * 3) + ((monthlyPolicies?.count || 0) * 5),
      });
    }

    return result;
  }

  async getAgentGoalsAndTargets(agentId: string, organizationId: number): Promise<any> {
    // Default goals - in real implementation, these would be stored in database
    const monthlyGoals = {
      quotesTarget: 50,
      clientsTarget: 10,
      policiesTarget: 5,
      revenueTarget: 25000,
    };

    // Get current month performance
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const [currentQuotes] = await db.select({ count: count() })
      .from(insuranceQuotes)
      .where(
        and(
          eq(insuranceQuotes.userId, agentId),
          gte(insuranceQuotes.createdAt, thisMonth)
        )
      );

    const [currentClients] = await db.select({ count: count() })
      .from(clientAssignments)
      .where(
        and(
          eq(clientAssignments.agentId, agentId),
          eq(clientAssignments.organizationId, organizationId),
          gte(clientAssignments.assignedAt, thisMonth)
        )
      );

    const [currentPolicies] = await db.select({ count: count() })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          eq(members.assignedAgent, agentId),
          gte(members.createdAt, thisMonth)
        )
      );

    const currentPerformance = {
      quotesActual: currentQuotes?.count || 0,
      clientsActual: currentClients?.count || 0,
      policiesActual: currentPolicies?.count || 0,
      revenueActual: (currentPolicies?.count || 0) * 5000, // Simplified calculation
    };

    return {
      goals: monthlyGoals,
      current: currentPerformance,
      achievement: {
        quotesPercentage: Math.round((currentPerformance.quotesActual / monthlyGoals.quotesTarget) * 100),
        clientsPercentage: Math.round((currentPerformance.clientsActual / monthlyGoals.clientsTarget) * 100),
        policiesPercentage: Math.round((currentPerformance.policiesActual / monthlyGoals.policiesTarget) * 100),
        revenuePercentage: Math.round((currentPerformance.revenueActual / monthlyGoals.revenueTarget) * 100),
      }
    };
  }

  async getAgentProductivityMetrics(agentId: string, organizationId: number): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Response time analysis
    const averageResponseTime = 2.5; // Hours - placeholder for real tracking

    // Activity metrics
    const [recentQuotes] = await db.select({ count: count() })
      .from(insuranceQuotes)
      .where(
        and(
          eq(insuranceQuotes.userId, agentId),
          gte(insuranceQuotes.createdAt, thirtyDaysAgo)
        )
      );

    const [recentAssignments] = await db.select({ count: count() })
      .from(clientAssignments)
      .where(
        and(
          eq(clientAssignments.agentId, agentId),
          eq(clientAssignments.organizationId, organizationId),
          gte(clientAssignments.assignedAt, thirtyDaysAgo)
        )
      );

    // Productivity calculations
    const dailyQuoteAverage = (recentQuotes?.count || 0) / 30;
    const weeklyClientAverage = (recentAssignments?.count || 0) / 4.3; // ~4.3 weeks in a month

    return {
      averageResponseTime,
      dailyQuoteAverage: Math.round(dailyQuoteAverage * 10) / 10,
      weeklyClientAverage: Math.round(weeklyClientAverage * 10) / 10,
      productivityScore: Math.min(100, Math.round(
        (dailyQuoteAverage * 10) + (weeklyClientAverage * 15) + (averageResponseTime < 4 ? 20 : 10)
      )),
      thirtyDayActivity: {
        quotesGenerated: recentQuotes?.count || 0,
        clientsAssigned: recentAssignments?.count || 0,
      }
    };
  }

  async generateAgentPerformanceReport(agentId: string, organizationId: number): Promise<any> {
    // Get comprehensive agent data
    const agentProfile = await this.getAgentProfile(agentId);
    const performanceMetrics = await this.getAgentPerformanceMetrics(organizationId, agentId);
    const performanceHistory = await this.getAgentPerformanceHistory(agentId, organizationId, 6);
    const goalsAndTargets = await this.getAgentGoalsAndTargets(agentId, organizationId);
    const productivityMetrics = await this.getAgentProductivityMetrics(agentId, organizationId);

    if (!agentProfile) {
      throw new Error('Agent profile not found');
    }

    const currentMetrics = performanceMetrics.length > 0 ? performanceMetrics[0] : null;

    // Performance assessment
    const overallScore = productivityMetrics.productivityScore;
    let performanceRating = 'Excellent';
    if (overallScore < 60) performanceRating = 'Needs Improvement';
    else if (overallScore < 75) performanceRating = 'Good';
    else if (overallScore < 90) performanceRating = 'Very Good';

    // Recommendations
    const recommendations = [];
    if (goalsAndTargets.achievement.quotesPercentage < 80) {
      recommendations.push('Focus on increasing quote generation through lead follow-up');
    }
    if (goalsAndTargets.achievement.clientsPercentage < 80) {
      recommendations.push('Enhance client acquisition strategies');
    }
    if (productivityMetrics.averageResponseTime > 4) {
      recommendations.push('Improve response time to client inquiries');
    }

    return {
      agent: {
        id: agentProfile.id,
        email: agentProfile.email,
        organizationId: agentProfile.organizationId,
        profile: agentProfile.profile,
      },
      currentMetrics,
      performanceHistory,
      goalsAndTargets,
      productivityMetrics,
      assessment: {
        overallScore,
        performanceRating,
        recommendations,
      },
      reportGenerated: new Date(),
    };
  }

  async getOrganizationAgentPerformanceRankings(organizationId: number): Promise<any> {
    const agents = await this.getAgentPerformanceMetrics(organizationId);
    
    // Enhanced ranking with multiple factors
    const rankedAgents = agents.map(agent => {
      const productivityScore = (agent.quotesGenerated * 2) + 
                               (agent.activeClients * 5) + 
                               (agent.policiesSold * 10) +
                               (agent.totalClaims * -1); // Claims reduce score slightly

      return {
        ...agent,
        productivityScore,
        rank: 0, // Will be assigned after sorting
      };
    }).sort((a, b) => b.productivityScore - a.productivityScore);

    // Assign ranks
    rankedAgents.forEach((agent, index) => {
      agent.rank = index + 1;
    });

    return {
      rankings: rankedAgents,
      topPerformer: rankedAgents[0] || null,
      averageScore: rankedAgents.length > 0 
        ? rankedAgents.reduce((sum, agent) => sum + agent.productivityScore, 0) / rankedAgents.length 
        : 0,
      totalAgents: rankedAgents.length,
    };
  }

  /**
   * Phase 5: Extended Cross-Organization Access - Members
   */
  async getMembersWithScope(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ members: any[]; total: number }> {
    const scope = resolveDataScope(userContext);
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    // Build WHERE conditions
    const conditions = [];
    if (!scope.isGlobal && scope.organizationId) {
      conditions.push(eq(members.organizationId, scope.organizationId));
    }

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(members)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const totalCount = countResult.count;

    // Get members with organization metadata
    const membersList = await db
      .select({
        id: members.id,
        userId: members.userId,
        organizationId: members.organizationId,
        memberNumber: members.memberNumber,
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(members.createdAt));

    // Add organization metadata
    const membersWithOrgs = await Promise.all(membersList.map(async (member) => {
      const [org] = await db.select({
        id: agentOrganizations.id,
        name: agentOrganizations.name,
        displayName: agentOrganizations.displayName,
      })
      .from(agentOrganizations)
      .where(eq(agentOrganizations.id, member.organizationId));

      return {
        ...member,
        organization: org || { id: member.organizationId, name: 'Unknown', displayName: 'Unknown' }
      };
    }));

    return { members: membersWithOrgs, total: totalCount };
  }

  /**
   * Phase 5: Extended Cross-Organization Access - Analytics
   */
  async getAnalyticsWithScope(userContext: UserContext): Promise<any> {
    const scope = resolveDataScope(userContext);

    if (scope.isGlobal) {
      // SuperAdmin sees aggregated analytics across all organizations
      const organizations = await this.getOrganizations();
      
      const orgAnalytics = await Promise.all(organizations.map(async (org) => {
        const analytics = await this.getOrganizationAnalytics(org.id);
        return {
          organizationId: org.id,
          organizationName: org.displayName,
          ...analytics,
        };
      }));

      // Calculate system-wide totals
      const systemTotals = orgAnalytics.reduce((acc, org) => ({
        totalAgents: acc.totalAgents + org.totalAgents,
        activeAgents: acc.activeAgents + org.activeAgents,
        totalMembers: acc.totalMembers + org.totalMembers,
        totalQuotes: acc.totalQuotes + org.totalQuotes,
        totalPolicies: acc.totalPolicies + org.totalPolicies,
        totalClaims: acc.totalClaims + org.totalClaims,
        pendingInvitations: acc.pendingInvitations + org.pendingInvitations,
      }), {
        totalAgents: 0,
        activeAgents: 0,
        totalMembers: 0,
        totalQuotes: 0,
        totalPolicies: 0,
        totalClaims: 0,
        pendingInvitations: 0,
      });

      return {
        scope: 'global',
        systemTotals,
        organizationBreakdown: orgAnalytics,
        totalOrganizations: organizations.length,
      };
    } else {
      // Regular users see only their organization analytics
      const analytics = await this.getOrganizationAnalytics(scope.organizationId!);
      return {
        scope: 'organization',
        organizationId: scope.organizationId,
        ...analytics,
      };
    }
  }

  /**
   * Phase 5: Extended Cross-Organization Access - Client Assignments
   */
  async getClientAssignmentsWithScope(userContext: UserContext, pagination?: { limit: number; offset: number }): Promise<{ assignments: any[]; total: number }> {
    const scope = resolveDataScope(userContext);
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    // Build WHERE conditions
    const conditions = [];
    if (!scope.isGlobal && scope.organizationId) {
      conditions.push(eq(members.organizationId, scope.organizationId));
    }

    // Get total count of assigned clients
    const [countResult] = await db
      .select({ count: count() })
      .from(members)
      .where(
        conditions.length > 0 
          ? and(...conditions, isNotNull(members.assignedAgent))
          : isNotNull(members.assignedAgent)
      );
    
    const totalCount = countResult.count;

    // Get client assignments with agent and organization details
    const assignments = await db
      .select({
        clientId: members.id,
        clientUserId: members.userId,
        organizationId: members.organizationId,
        assignedAgent: members.assignedAgent,
        assignmentDate: members.assignmentDate,
        membershipStatus: members.membershipStatus,
        memberNumber: members.memberNumber,
      })
      .from(members)
      .where(
        conditions.length > 0 
          ? and(...conditions, isNotNull(members.assignedAgent))
          : isNotNull(members.assignedAgent)
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(members.assignmentDate));

    // Enrich with agent and organization details
    const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
      // Get agent details
      const [agent] = assignment.assignedAgent 
        ? await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, assignment.assignedAgent))
        : [null];

      // Get organization details
      const [org] = await db.select({
        id: agentOrganizations.id,
        name: agentOrganizations.name,
        displayName: agentOrganizations.displayName,
      })
      .from(agentOrganizations)
      .where(eq(agentOrganizations.id, assignment.organizationId));

      return {
        ...assignment,
        agent: agent || null,
        organization: org || { id: assignment.organizationId, name: 'Unknown', displayName: 'Unknown' }
      };
    }));

    return { assignments: enrichedAssignments, total: totalCount };
  }
}

export const storage = new DatabaseStorage();
