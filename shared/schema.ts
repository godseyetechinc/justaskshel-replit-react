import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with role-based authorization - mandatory for Replit Auth
export const users: any = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: integer("person_id").references(() => persons.id),
  email: varchar("email").unique(), // Keep for authentication
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password", { length: 255 }), // Hashed password
  role: varchar("role", { enum: ["SuperAdmin", "LandlordAdmin", "Agent", "Member", "Guest", "Visitor"] }).default("Guest"),
  privilegeLevel: integer("privilege_level").default(4), // 0=SuperAdmin, 1=LandlordAdmin, 2=Agent, 3=Member, 4=Guest, 5=Visitor
  organizationId: integer("organization_id").references(() => agentOrganizations.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Roles definition table for role-based authorization
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  privilegeLevel: integer("privilege_level").unique().notNull(), // 1=highest, 5=lowest
  description: text("description"),
  permissions: jsonb("permissions"), // JSON object defining specific permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insurance types
export const insuranceTypes = pgTable("insurance_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insurance providers
export const insuranceProviders = pgTable("insurance_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insurance quotes - Enhanced to support both internal and external provider quotes
export const insuranceQuotes = pgTable("insurance_quotes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  typeId: integer("type_id").references(() => insuranceTypes.id),
  providerId: integer("provider_id").references(() => insuranceProviders.id),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }).notNull(),
  annualPremium: decimal("annual_premium", { precision: 10, scale: 2 }),
  coverageAmount: decimal("coverage_amount", { precision: 12, scale: 2 }),
  termLength: integer("term_length"), // in years
  deductible: decimal("deductible", { precision: 10, scale: 2 }),
  medicalExamRequired: boolean("medical_exam_required").default(false),
  conversionOption: boolean("conversion_option").default(false),
  features: jsonb("features"), // array of features
  rating: decimal("rating", { precision: 2, scale: 1 }),
  // External provider integration fields
  isExternal: boolean("is_external").default(false),
  externalQuoteId: varchar("external_quote_id", { length: 255 }),
  externalProviderId: varchar("external_provider_id", { length: 100 }),
  externalProviderName: varchar("external_provider_name", { length: 255 }),
  applicationUrl: varchar("application_url", { length: 500 }),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"), // Store API response and additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External quote requests - Track real-time API quote requests
export const externalQuoteRequests = pgTable("external_quote_requests", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 100 }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  coverageType: varchar("coverage_type", { length: 100 }).notNull(),
  applicantAge: integer("applicant_age").notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  coverageAmount: decimal("coverage_amount", { precision: 12, scale: 2 }).notNull(),
  termLength: integer("term_length"),
  paymentFrequency: varchar("payment_frequency", { length: 20 }),
  effectiveDate: timestamp("effective_date"),
  requestData: jsonb("request_data"), // Full request payload
  providersQueried: jsonb("providers_queried"), // List of providers contacted
  totalQuotesReceived: integer("total_quotes_received").default(0),
  successfulProviders: integer("successful_providers").default(0),
  failedProviders: integer("failed_providers").default(0),
  errors: jsonb("errors"), // Provider errors and issues
  status: varchar("status", { 
    enum: ["pending", "processing", "completed", "failed", "expired"] 
  }).default("pending"),
  processingStartedAt: timestamp("processing_started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User selected quotes
export const selectedQuotes = pgTable("selected_quotes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  quoteId: integer("quote_id").references(() => insuranceQuotes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User wishlist
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  quoteId: integer("quote_id").references(() => insuranceQuotes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User policies - Match actual database schema
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  quoteId: integer("quote_id"),
  policyNumber: varchar("policy_number").notNull(),
  status: varchar("status").default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  policyId: integer("policy_id").references(() => policies.id),
  claimNumber: varchar("claim_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  claimType: varchar("claim_type", { length: 50 }).notNull(), // medical, dental, vision, life, disability
  incidentDate: timestamp("incident_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default("draft"), // draft, submitted, under_review, approved, denied, paid, closed
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  assignedAgent: varchar("assigned_agent").references(() => users.id),
  // Additional claim fields for comprehensive data (will be enabled after schema sync)
  // policyNumber: varchar("policy_number", { length: 50 }),
  // providerName: varchar("provider_name", { length: 200 }),
  // providerAddress: text("provider_address"),
  // contactPhone: varchar("contact_phone", { length: 20 }),
  // emergencyContact: varchar("emergency_contact", { length: 100 }),
  // emergencyPhone: varchar("emergency_phone", { length: 20 }),
  // additionalNotes: text("additional_notes"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Claims documents table for file attachments
export const claimDocuments = pgTable("claim_documents", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size"),
  documentType: varchar("document_type", { length: 50 }).notNull(), // medical_record, receipt, police_report, photo, other
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isRequired: boolean("is_required").default(false),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
});

// Claims communications/notes table
export const claimCommunications = pgTable("claim_communications", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  messageType: varchar("message_type", { length: 50 }).notNull(), // note, message, system_update, status_change
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // internal notes vs customer communications
  createdAt: timestamp("created_at").defaultNow(),
});

// Claims workflow steps
export const claimWorkflowSteps = pgTable("claim_workflow_steps", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  stepName: varchar("step_name", { length: 100 }).notNull(),
  stepDescription: text("step_description"),
  status: varchar("status", { length: 20 }).notNull(), // pending, in_progress, completed, skipped
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Policy documents table for managing policy-related documents
export const policyDocuments = pgTable("policy_documents", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id).notNull(),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentType: varchar("document_type", { 
    enum: ["Policy Certificate", "Application", "Medical Records", "Beneficiary Form", "Amendment", "Payment Receipt", "Cancellation Notice", "Other"] 
  }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size"),
  filePath: varchar("file_path", { length: 500 }),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium payments tracking table
export const premiumPayments = pgTable("premium_payments", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id).notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { 
    enum: ["Premium", "Late Fee", "Processing Fee", "Adjustment", "Refund"] 
  }).default("Premium"),
  paymentMethod: varchar("payment_method", { 
    enum: ["Credit Card", "Bank Transfer", "Check", "Cash", "ACH", "Wire Transfer"] 
  }),
  transactionId: varchar("transaction_id", { length: 100 }),
  paymentStatus: varchar("payment_status", { 
    enum: ["Pending", "Processed", "Failed", "Cancelled", "Refunded"] 
  }).default("Pending"),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  gracePeriodEnd: timestamp("grace_period_end"),
  lateFeeAmount: decimal("late_fee_amount", { precision: 10, scale: 2 }).default("0"),
  isAutoPay: boolean("is_auto_pay").default(false),
  paymentReference: varchar("payment_reference", { length: 100 }),
  notes: text("notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Policy amendments and endorsements table
export const policyAmendments = pgTable("policy_amendments", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id).notNull(),
  amendmentType: varchar("amendment_type", { 
    enum: ["Beneficiary Change", "Coverage Change", "Premium Adjustment", "Address Change", "Name Change", "Payment Method Change", "Other"] 
  }).notNull(),
  amendmentNumber: varchar("amendment_number", { length: 50 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  description: text("description").notNull(),
  oldValue: jsonb("old_value"), // Store the previous value(s)
  newValue: jsonb("new_value"), // Store the new value(s)
  premiumImpact: decimal("premium_impact", { precision: 10, scale: 2 }).default("0"), // Change in premium
  status: varchar("status", { 
    enum: ["Draft", "Pending Review", "Approved", "Implemented", "Rejected", "Cancelled"] 
  }).default("Draft"),
  requestedBy: varchar("requested_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  implementedBy: varchar("implemented_by").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  implementedAt: timestamp("implemented_at"),
  rejectionReason: text("rejection_reason"),
  documentPath: varchar("document_path", { length: 500 }), // Path to amendment document
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dependents
export const dependents = pgTable("dependents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  relationship: varchar("relationship", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Members - extends users with additional member-specific information
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => persons.id),
  userId: varchar("user_id").unique().references(() => users.id),
  organizationId: integer("organization_id").references(() => agentOrganizations.id),
  memberNumber: varchar("member_number", { length: 20 }).unique().notNull(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar("email", { length: 100 }),
  dateOfBirth: timestamp("date_of_birth"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  ssn: varchar("ssn", { length: 11 }), // encrypted
  profileImageUrl: varchar("profile_image_url"),
  avatarType: varchar("avatar_type", { enum: ["initials", "image", "generated"] }).default("initials"),
  avatarColor: varchar("avatar_color", { length: 7 }).default("#0EA5E9"), // hex color
  bio: text("bio"),
  emergencyContact: text("emergency_contact"),
  preferences: jsonb("preferences"), // JSON object for member preferences
  membershipStatus: varchar("membership_status", { enum: ["Active", "Inactive", "Suspended"] }).default("Active"),
  membershipDate: timestamp("membership_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Organizations - multi-tenant organization structure
export const agentOrganizations = pgTable("agent_organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  logoUrl: varchar("logo_url", { length: 255 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#0EA5E9"), // hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#64748B"),
  status: varchar("status", { enum: ["Active", "Inactive", "Suspended"] }).default("Active"),
  subscriptionPlan: varchar("subscription_plan", { enum: ["Basic", "Professional", "Enterprise"] }).default("Basic"),
  subscriptionStatus: varchar("subscription_status", { enum: ["Active", "Inactive", "Trial", "Expired"] }).default("Trial"),
  maxAgents: integer("max_agents").default(5),
  maxMembers: integer("max_members").default(100),
  settings: jsonb("settings"), // organization-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization invitations - manage invitations to join organizations  
export const organizationInvitations = pgTable("organization_invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  role: varchar("role", { enum: ["Agent", "Member"] }).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  invitationToken: varchar("invitation_token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: varchar("accepted_by").references(() => users.id),
  status: varchar("status", { enum: ["Pending", "Accepted", "Expired", "Revoked"] }).default("Pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_organization_invitations_org_id").on(table.organizationId),
  index("idx_organization_invitations_email").on(table.email),
  index("idx_organization_invitations_token").on(table.invitationToken),
]);

// Contacts - general contact information
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => persons.id),
  organizationId: integer("organization_id").references(() => agentOrganizations.id),
  type: varchar("type", { enum: ["Lead", "Customer", "Provider", "Agent"] }).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  notes: text("notes"),
  status: varchar("status", { enum: ["Active", "Inactive", "Prospect"] }).default("Active"),
  assignedAgent: varchar("assigned_agent").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Points system - member rewards/points transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  transactionType: varchar("transaction_type", { 
    enum: ["Earned", "Redeemed", "Expired", "Adjustment", "Bonus", "Referral"] 
  }).notNull(),
  points: integer("points").notNull(), // positive for earned, negative for redeemed
  description: text("description").notNull(),
  category: varchar("category", { 
    enum: ["Policy Purchase", "Claim Submission", "Referral", "Login", "Profile Complete", "Newsletter", "Review", "Survey", "Birthday", "Anniversary", "Redemption", "Adjustment", "Bonus"] 
  }).notNull(),
  referenceId: varchar("reference_id"), // can reference policy, claim, etc.
  referenceType: varchar("reference_type"), // policy, claim, referral, etc.
  balanceAfter: integer("balance_after").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Points summary for each user
export const pointsSummary = pgTable("points_summary", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  totalEarned: integer("total_earned").default(0),
  totalRedeemed: integer("total_redeemed").default(0),
  currentBalance: integer("current_balance").default(0),
  lifetimeBalance: integer("lifetime_balance").default(0),
  tierLevel: varchar("tier_level", { 
    enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] 
  }).default("Bronze"),
  tierProgress: integer("tier_progress").default(0), // points toward next tier
  nextTierThreshold: integer("next_tier_threshold").default(500),
  lastEarnedAt: timestamp("last_earned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rewards catalog - what users can redeem points for
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { 
    enum: ["Discount", "Gift Card", "Premium Service", "Insurance Credit", "Merchandise", "Experience"] 
  }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // dollar value
  imageUrl: varchar("image_url"),
  availableQuantity: integer("available_quantity"),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User reward redemptions
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  pointsTransactionId: integer("points_transaction_id").references(() => pointsTransactions.id),
  pointsUsed: integer("points_used").notNull(),
  status: varchar("status", { 
    enum: ["Pending", "Approved", "Delivered", "Cancelled", "Expired"] 
  }).default("Pending"),
  redemptionCode: varchar("redemption_code", { length: 50 }),
  deliveryMethod: varchar("delivery_method", { 
    enum: ["Email", "Mail", "Digital", "Account Credit", "Instant"] 
  }),
  deliveryAddress: text("delivery_address"),
  deliveredAt: timestamp("delivered_at"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Points earning rules
export const pointsRules = pgTable("points_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { 
    enum: ["Policy Purchase", "Claim Submission", "Referral", "Login", "Profile Complete", "Newsletter", "Review", "Survey", "Birthday", "Anniversary", "Bonus"] 
  }).notNull(),
  points: integer("points").notNull(),
  maxPerPeriod: integer("max_per_period"), // max points per period
  periodType: varchar("period_type", { 
    enum: ["Daily", "Weekly", "Monthly", "Yearly", "Lifetime"] 
  }),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  conditions: jsonb("conditions"), // additional conditions as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievement system - Phase 2 User Engagement Features
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { 
    enum: ["Milestone", "Streak", "Activity", "Special", "Referral", "Tier"] 
  }).notNull(),
  icon: varchar("icon", { length: 50 }), // lucide icon name
  pointsReward: integer("points_reward").default(0),
  requirements: jsonb("requirements"), // flexible requirements JSON
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User achievements - tracks which achievements users have unlocked
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: jsonb("progress"), // track progress toward achievement
  pointsAwarded: integer("points_awarded").default(0),
  notificationSent: boolean("notification_sent").default(false),
}, (table) => [
  index("idx_user_achievements_user_id").on(table.userId),
  index("idx_user_achievements_achievement_id").on(table.achievementId),
]);

// Referral system - Phase 2 User Engagement Features  
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  isActive: boolean("is_active").default(true),
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_referral_codes_code").on(table.code),
  index("idx_referral_codes_user_id").on(table.userId),
]);

// Referral signups - track successful referrals
export const referralSignups = pgTable("referral_signups", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").references(() => referralCodes.id).notNull(),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(),
  refereeId: varchar("referee_id").references(() => users.id).notNull(),
  referrerPoints: integer("referrer_points").default(200),
  refereePoints: integer("referee_points").default(100),
  status: varchar("status", { 
    enum: ["Pending", "Completed", "Cancelled"] 
  }).default("Completed"),
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referral_signups_referrer_id").on(table.referrerId),
  index("idx_referral_signups_referee_id").on(table.refereeId),
]);

// Notifications system - Phase 2 User Engagement Features
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { 
    enum: ["Points", "TierUpgrade", "Achievement", "Referral", "Reward", "System"] 
  }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional notification data
  isRead: boolean("is_read").default(false),
  priority: varchar("priority", { 
    enum: ["Low", "Normal", "High", "Urgent"] 
  }).default("Normal"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("idx_notifications_user_id").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
  index("idx_notifications_type").on(table.type),
]);


// ===== UNIFIED PERSON ENTITY MODEL =====
// Central person identity table - single source of truth for individual identity
export const persons: any = pgTable("persons", {
  id: serial("id").primaryKey(),
  
  // Core Identity
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  fullName: varchar("full_name", { length: 101 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { enum: ["Male", "Female", "Other", "Prefer not to say"] }),
  
  // Unique Identifiers
  ssnEncrypted: varchar("ssn_encrypted", { length: 255 }), // Encrypted SSN
  externalIds: jsonb("external_ids"), // For storing external system IDs
  
  // Contact Information (normalized)
  primaryEmail: varchar("primary_email", { length: 100 }),
  secondaryEmail: varchar("secondary_email", { length: 100 }),
  primaryPhone: varchar("primary_phone", { length: 20 }),
  secondaryPhone: varchar("secondary_phone", { length: 20 }),
  
  // Address Information
  streetAddress: text("street_address"),
  addressLine2: varchar("address_line_2", { length: 100 }),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  country: varchar("country", { length: 50 }).default("USA"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  
  // Data Quality
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  dataSource: varchar("data_source", { length: 50 }), // 'manual', 'import', 'migration', etc.
  identityHash: varchar("identity_hash", { length: 64 }), // For duplicate detection
}, (table) => [
  index("idx_persons_name").on(table.lastName, table.firstName),
  index("idx_persons_primary_email").on(table.primaryEmail),
  index("idx_persons_primary_phone").on(table.primaryPhone),
  index("idx_persons_identity_hash").on(table.identityHash),
]);

// User roles association
export const personUsers = pgTable("person_users", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleContext: jsonb("role_context"), // Store role-specific metadata
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_person_users_person_id").on(table.personId),
  index("idx_person_users_user_id").on(table.userId),
]);

// Member association
export const personMembers = pgTable("person_members", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id),
  memberNumber: varchar("member_number", { length: 20 }),
  membershipStatus: varchar("membership_status", { length: 20 }).default("Active"),
  membershipDate: timestamp("membership_date").defaultNow(),
  additionalInfo: jsonb("additional_info"), // Member-specific data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_person_members_person_id").on(table.personId),
  index("idx_person_members_member_id").on(table.memberId),
]);

// Contact association
export const personContacts = pgTable("person_contacts", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  contactContext: varchar("contact_context", { length: 50 }), // 'lead', 'customer', 'provider', etc.
  organizationId: integer("organization_id").references(() => agentOrganizations.id),
  assignedAgent: varchar("assigned_agent").references(() => users.id),
  contactMetadata: jsonb("contact_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_person_contacts_person_id").on(table.personId),
  index("idx_person_contacts_contact_id").on(table.contactId),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  member: one(members),
  quotes: many(insuranceQuotes),
  selectedQuotes: many(selectedQuotes),
  wishlist: many(wishlist),
  policies: many(policies),
  claims: many(claims),
  dependents: many(dependents),
  pointsTransactions: many(pointsTransactions),
  pointsSummary: one(pointsSummary),
  rewardRedemptions: many(rewardRedemptions),
  assignedContacts: many(contacts),
}));

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  assignedAgent: one(users, {
    fields: [contacts.assignedAgent],
    references: [users.id],
  }),
}));



export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointsTransactions.userId],
    references: [users.id],
  }),
}));

export const pointsSummaryRelations = relations(pointsSummary, ({ one }) => ({
  user: one(users, {
    fields: [pointsSummary.userId],
    references: [users.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [rewardRedemptions.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id],
  }),
  pointsTransaction: one(pointsTransactions, {
    fields: [rewardRedemptions.pointsTransactionId],
    references: [pointsTransactions.id],
  }),
}));

export const pointsRulesRelations = relations(pointsRules, ({ }) => ({}));

export const insuranceQuotesRelations = relations(insuranceQuotes, ({ one, many }) => ({
  user: one(users, {
    fields: [insuranceQuotes.userId],
    references: [users.id],
  }),
  type: one(insuranceTypes, {
    fields: [insuranceQuotes.typeId],
    references: [insuranceTypes.id],
  }),
  provider: one(insuranceProviders, {
    fields: [insuranceQuotes.providerId],
    references: [insuranceProviders.id],
  }),
  selectedQuotes: many(selectedQuotes),
  wishlistItems: many(wishlist),
  policies: many(policies),
}));

export const selectedQuotesRelations = relations(selectedQuotes, ({ one }) => ({
  user: one(users, {
    fields: [selectedQuotes.userId],
    references: [users.id],
  }),
  quote: one(insuranceQuotes, {
    fields: [selectedQuotes.quoteId],
    references: [insuranceQuotes.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  quote: one(insuranceQuotes, {
    fields: [wishlist.quoteId],
    references: [insuranceQuotes.id],
  }),
}));

export const policiesRelations = relations(policies, ({ one, many }) => ({
  user: one(users, {
    fields: [policies.userId],
    references: [users.id],
  }),
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  user: one(users, {
    fields: [claims.userId],
    references: [users.id],
  }),
  policy: one(policies, {
    fields: [claims.policyId],
    references: [policies.id],
  }),
  assignedAgent: one(users, {
    fields: [claims.assignedAgent],
    references: [users.id],
  }),
  documents: many(claimDocuments),
  communications: many(claimCommunications),
  workflowSteps: many(claimWorkflowSteps),
}));

export const claimDocumentsRelations = relations(claimDocuments, ({ one }) => ({
  claim: one(claims, {
    fields: [claimDocuments.claimId],
    references: [claims.id],
  }),
  uploadedBy: one(users, {
    fields: [claimDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const claimCommunicationsRelations = relations(claimCommunications, ({ one }) => ({
  claim: one(claims, {
    fields: [claimCommunications.claimId],
    references: [claims.id],
  }),
  user: one(users, {
    fields: [claimCommunications.userId],
    references: [users.id],
  }),
}));

export const claimWorkflowStepsRelations = relations(claimWorkflowSteps, ({ one }) => ({
  claim: one(claims, {
    fields: [claimWorkflowSteps.claimId],
    references: [claims.id],
  }),
  assignedTo: one(users, {
    fields: [claimWorkflowSteps.assignedTo],
    references: [users.id],
  }),
}));

// Policy documents relations
export const policyDocumentsRelations = relations(policyDocuments, ({ one }) => ({
  policy: one(policies, {
    fields: [policyDocuments.policyId],
    references: [policies.id],
  }),
  uploadedBy: one(users, {
    fields: [policyDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// Premium payments relations
export const premiumPaymentsRelations = relations(premiumPayments, ({ one }) => ({
  policy: one(policies, {
    fields: [premiumPayments.policyId],
    references: [policies.id],
  }),
  processedBy: one(users, {
    fields: [premiumPayments.processedBy],
    references: [users.id],
  }),
}));

// Policy amendments relations
export const policyAmendmentsRelations = relations(policyAmendments, ({ one }) => ({
  policy: one(policies, {
    fields: [policyAmendments.policyId],
    references: [policies.id],
  }),
  requestedBy: one(users, {
    fields: [policyAmendments.requestedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [policyAmendments.approvedBy],
    references: [users.id],
  }),
  implementedBy: one(users, {
    fields: [policyAmendments.implementedBy],
    references: [users.id],
  }),
}));

export const dependentsRelations = relations(dependents, ({ one }) => ({
  user: one(users, {
    fields: [dependents.userId],
    references: [users.id],
  }),
}));

// Export types  
export type UpsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertMember = typeof members.$inferInsert;
export type Member = typeof members.$inferSelect;

export type InsertContact = typeof contacts.$inferInsert;
export type Contact = typeof contacts.$inferSelect;


// Points system types
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;
export type PointsSummary = typeof pointsSummary.$inferSelect;
export type InsertPointsSummary = typeof pointsSummary.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = typeof rewardRedemptions.$inferInsert;
export type PointsRule = typeof pointsRules.$inferSelect;
export type InsertPointsRule = typeof pointsRules.$inferInsert;

// ===== PHASE 5: SEASONAL CAMPAIGNS SCHEMA =====

// Seasonal campaigns for holiday bonuses and limited-time events
export const seasonalCampaigns = pgTable("seasonal_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  campaignType: varchar("campaign_type", { 
    enum: ["Holiday", "Special Event", "Milestone", "Seasonal", "Anniversary"] 
  }).notNull(),
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1.00"), // e.g., 1.5x points
  bonusPoints: integer("bonus_points").default(0), // flat bonus points
  isActive: boolean("is_active").default(true),
  autoStart: boolean("auto_start").default(false), // auto-activate on start date
  autoEnd: boolean("auto_end").default(true), // auto-deactivate on end date
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  targetUserTiers: varchar("target_user_tiers").array(), // ["Bronze", "Silver"] - empty array means all tiers
  targetCategories: varchar("target_categories").array(), // point rule categories to apply multiplier
  maxParticipants: integer("max_participants"), // optional participant limit
  currentParticipants: integer("current_participants").default(0),
  conditions: jsonb("conditions"), // additional campaign conditions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign participation tracking
export const campaignParticipations = pgTable("campaign_participations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => seasonalCampaigns.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pointsEarned: integer("points_earned").default(0),
  bonusPointsEarned: integer("bonus_points_earned").default(0),
  participatedAt: timestamp("participated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Seasonal achievements - special achievements available during campaigns
export const seasonalAchievements = pgTable("seasonal_achievements", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => seasonalCampaigns.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: varchar("category", { 
    enum: ["Holiday", "Seasonal", "Special Event", "Challenge", "Milestone"] 
  }).notNull(),
  pointsReward: integer("points_reward").default(0),
  requirement: jsonb("requirement"), // conditions to unlock achievement
  isRepeatable: boolean("is_repeatable").default(false),
  maxUnlocks: integer("max_unlocks").default(1),
  unlockOrder: integer("unlock_order").default(1), // for sequential achievements
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User seasonal achievement unlocks
export const userSeasonalAchievements = pgTable("user_seasonal_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => seasonalAchievements.id).notNull(),
  campaignId: integer("campaign_id").references(() => seasonalCampaigns.id).notNull(),
  pointsAwarded: integer("points_awarded").default(0),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  tier: varchar("tier", { 
    enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] 
  }),
  progressData: jsonb("progress_data"), // additional progress information
});

// Seasonal campaigns types
export type SeasonalCampaign = typeof seasonalCampaigns.$inferSelect;
export type InsertSeasonalCampaign = typeof seasonalCampaigns.$inferInsert;
export type CampaignParticipation = typeof campaignParticipations.$inferSelect;
export type InsertCampaignParticipation = typeof campaignParticipations.$inferInsert;
export type SeasonalAchievement = typeof seasonalAchievements.$inferSelect;
export type InsertSeasonalAchievement = typeof seasonalAchievements.$inferInsert;
export type UserSeasonalAchievement = typeof userSeasonalAchievements.$inferSelect;
export type InsertUserSeasonalAchievement = typeof userSeasonalAchievements.$inferInsert;

// ===== PHASE 5.2: SOCIAL FEATURES SCHEMA =====

// Leaderboard opt-in settings and privacy controls
export const leaderboardSettings = pgTable("leaderboard_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  isOptedIn: boolean("is_opted_in").default(false),
  displayName: varchar("display_name", { length: 100 }), // Custom display name for leaderboard
  showTierLevel: boolean("show_tier_level").default(true),
  showTotalPoints: boolean("show_total_points").default(true),
  showRecentActivity: boolean("show_recent_activity").default(false),
  visibilityLevel: varchar("visibility_level", { 
    enum: ["Public", "Friends", "Private"] 
  }).default("Public"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievement sharing and social posts
export const achievementShares = pgTable("achievement_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id),
  seasonalAchievementId: integer("seasonal_achievement_id").references(() => seasonalAchievements.id),
  shareType: varchar("share_type", { 
    enum: ["Internal", "Facebook", "Twitter", "LinkedIn", "Instagram", "WhatsApp"] 
  }).notNull(),
  message: text("message"),
  imageUrl: varchar("image_url", { length: 500 }),
  hashtags: varchar("hashtags").array(),
  isPublic: boolean("is_public").default(true),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  sharedAt: timestamp("shared_at").defaultNow(),
});

// Social media connection bonuses and integration
export const socialMediaIntegrations = pgTable("social_media_integrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { 
    enum: ["Facebook", "Twitter", "LinkedIn", "Instagram", "TikTok", "YouTube"] 
  }).notNull(),
  platformUserId: varchar("platform_user_id", { length: 200 }),
  platformUsername: varchar("platform_username", { length: 100 }),
  isConnected: boolean("is_connected").default(true),
  bonusPointsEarned: integer("bonus_points_earned").default(0),
  lastActivitySync: timestamp("last_activity_sync"),
  connectionBonusAwarded: boolean("connection_bonus_awarded").default(false),
  connectedAt: timestamp("connected_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friend system with invite tracking
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  addresseeId: varchar("addressee_id").references(() => users.id).notNull(),
  status: varchar("status", { 
    enum: ["Pending", "Accepted", "Declined", "Blocked"] 
  }).default("Pending"),
  requestMessage: text("request_message"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Enhanced referral system with social tracking
export const socialReferrals = pgTable("social_referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  inviteMethod: varchar("invite_method", { 
    enum: ["Email", "SMS", "Social Media", "Direct Link", "QR Code"] 
  }).notNull(),
  platformUsed: varchar("platform_used", { length: 50 }), // specific social platform if applicable
  bonusTier: varchar("bonus_tier", { 
    enum: ["Standard", "Premium", "Elite"] 
  }).default("Standard"),
  referrerReward: integer("referrer_reward").default(0),
  referredReward: integer("referred_reward").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard periods and rankings cache
export const leaderboardRankings = pgTable("leaderboard_rankings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  period: varchar("period", { 
    enum: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "All-Time"] 
  }).notNull(),
  category: varchar("category", { 
    enum: ["Points", "Achievements", "Referrals", "Activity", "Redemptions"] 
  }).notNull(),
  rank: integer("rank").notNull(),
  score: integer("score").notNull(),
  previousRank: integer("previous_rank"),
  rankChange: integer("rank_change").default(0), // positive = moved up, negative = moved down
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social activity feed and interactions
export const socialActivities = pgTable("social_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { 
    enum: ["Achievement Unlocked", "Tier Promotion", "Points Milestone", "Referral Success", "Redemption", "Campaign Join", "Challenge Complete"] 
  }).notNull(),
  description: text("description").notNull(),
  pointsInvolved: integer("points_involved"),
  achievementId: integer("achievement_id").references(() => achievements.id),
  isPublic: boolean("is_public").default(true),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes and reactions to social activities
export const activityLikes = pgTable("activity_likes", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => socialActivities.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reactionType: varchar("reaction_type", { 
    enum: ["Like", "Love", "Celebrate", "Inspire", "Congratulate"] 
  }).default("Like"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments on social activities
export const activityComments: any = pgTable("activity_comments", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => socialActivities.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  isReply: boolean("is_reply").default(false),
  parentCommentId: integer("parent_comment_id"),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social features types
export type LeaderboardSettings = typeof leaderboardSettings.$inferSelect;
export type InsertLeaderboardSettings = typeof leaderboardSettings.$inferInsert;
export type AchievementShare = typeof achievementShares.$inferSelect;
export type InsertAchievementShare = typeof achievementShares.$inferInsert;
export type SocialMediaIntegration = typeof socialMediaIntegrations.$inferSelect;
export type InsertSocialMediaIntegration = typeof socialMediaIntegrations.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;
export type SocialReferral = typeof socialReferrals.$inferSelect;
export type InsertSocialReferral = typeof socialReferrals.$inferInsert;
export type LeaderboardRanking = typeof leaderboardRankings.$inferSelect;
export type InsertLeaderboardRanking = typeof leaderboardRankings.$inferInsert;
export type SocialActivity = typeof socialActivities.$inferSelect;
export type InsertSocialActivity = typeof socialActivities.$inferInsert;
export type ActivityLike = typeof activityLikes.$inferSelect;
export type InsertActivityLike = typeof activityLikes.$inferInsert;
export type ActivityComment = typeof activityComments.$inferSelect;
export type InsertActivityComment = typeof activityComments.$inferInsert;

// ===== PHASE 5.3: ADVANCED REDEMPTION OPTIONS SCHEMA =====

// Reward wishlists for users to save desired rewards
export const rewardWishlists = pgTable("reward_wishlists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  priority: integer("priority").default(1), // 1=high, 2=medium, 3=low
  targetPointsGoal: integer("target_points_goal"), // user's savings goal for this reward
  isNotificationsEnabled: boolean("is_notifications_enabled").default(true),
  priceAlertThreshold: decimal("price_alert_threshold", { precision: 5, scale: 2 }), // alert when price drops below this
  addedAt: timestamp("added_at").defaultNow(),
  lastNotified: timestamp("last_notified"),
});

// Dynamic pricing history and demand tracking
export const rewardPricingHistory = pgTable("reward_pricing_history", {
  id: serial("id").primaryKey(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  originalPrice: integer("original_price").notNull(),
  adjustedPrice: integer("adjusted_price").notNull(),
  demandMultiplier: decimal("demand_multiplier", { precision: 3, scale: 2 }).default("1.00"),
  redemptionCount: integer("redemption_count").default(0), // redemptions in current period
  viewCount: integer("view_count").default(0), // views in current period
  demandLevel: varchar("demand_level", { 
    enum: ["Very Low", "Low", "Normal", "High", "Very High"] 
  }).default("Normal"),
  priceChangeReason: varchar("price_change_reason", { 
    enum: ["Demand", "Seasonal", "Inventory", "Promotion", "Manual"] 
  }),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Partial redemption support for high-value rewards
export const partialRedemptions = pgTable("partial_redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  totalPointsRequired: integer("total_points_required").notNull(),
  pointsContributed: integer("points_contributed").notNull(),
  remainingPoints: integer("remaining_points").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // partial redemption expiry
  reservationId: varchar("reservation_id", { length: 50 }), // unique reservation identifier
  status: varchar("status", { 
    enum: ["Active", "Completed", "Expired", "Cancelled"] 
  }).default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User reward recommendations based on behavior and preferences
export const rewardRecommendations = pgTable("reward_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  recommendationType: varchar("recommendation_type", { 
    enum: ["Behavioral", "Collaborative", "Content-Based", "Trending", "Seasonal", "Personalized"] 
  }).notNull(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00-1.00
  reasoning: text("reasoning"), // why this reward was recommended
  userBehaviorData: jsonb("user_behavior_data"), // behavioral patterns used
  isViewed: boolean("is_viewed").default(false),
  isClicked: boolean("is_clicked").default(false),
  isRedeemed: boolean("is_redeemed").default(false),
  viewedAt: timestamp("viewed_at"),
  clickedAt: timestamp("clicked_at"),
  redeemedAt: timestamp("redeemed_at"),
  rank: integer("rank"), // recommendation ranking for this user
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // recommendations expire to stay fresh
});

// Reward inventory and availability tracking
export const rewardInventory = pgTable("reward_inventory", {
  id: serial("id").primaryKey(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull().unique(),
  totalStock: integer("total_stock"), // null = unlimited
  availableStock: integer("available_stock"), // current available count
  reservedStock: integer("reserved_stock").default(0), // temporarily reserved
  lowStockThreshold: integer("low_stock_threshold").default(10),
  isOutOfStock: boolean("is_out_of_stock").default(false),
  autoRestock: boolean("auto_restock").default(false),
  restockLevel: integer("restock_level"), // auto restock to this level
  lastRestocked: timestamp("last_restocked"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward recommendation algorithms and ML model tracking
export const recommendationModels = pgTable("recommendation_models", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  modelType: varchar("model_type", { 
    enum: ["Collaborative Filtering", "Content-Based", "Hybrid", "Deep Learning", "Matrix Factorization"] 
  }).notNull(),
  version: varchar("version", { length: 20 }).default("1.0"),
  isActive: boolean("is_active").default(false),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // model accuracy score
  precision: decimal("precision", { precision: 5, scale: 4 }),
  recall: decimal("recall", { precision: 5, scale: 4 }),
  trainingData: jsonb("training_data"), // metadata about training dataset
  hyperparameters: jsonb("hyperparameters"),
  trainingStarted: timestamp("training_started"),
  trainingCompleted: timestamp("training_completed"),
  lastPrediction: timestamp("last_prediction"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reward interaction tracking for ML models
export const rewardInteractions = pgTable("reward_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  interactionType: varchar("interaction_type", { 
    enum: ["View", "Click", "Add to Wishlist", "Share", "Compare", "Review", "Redeem", "Partial Redeem"] 
  }).notNull(),
  sessionId: varchar("session_id", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }),
  userAgent: varchar("user_agent", { length: 500 }),
  referrerSource: varchar("referrer_source", { length: 200 }),
  timeSpent: integer("time_spent"), // seconds spent on reward page
  pageDepth: integer("page_depth"), // how many pages deep in session
  interactionMetadata: jsonb("interaction_metadata"), // additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Reward notifications and alerts system
export const rewardNotifications = pgTable("reward_notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id),
  notificationType: varchar("notification_type", { 
    enum: ["Price Drop", "Back in Stock", "Wishlist Goal Reached", "Limited Time Offer", "Recommendation", "Expiring Soon"] 
  }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }),
  priority: varchar("priority", { 
    enum: ["Low", "Medium", "High", "Urgent"] 
  }).default("Medium"),
  isRead: boolean("is_read").default(false),
  isActionTaken: boolean("is_action_taken").default(false),
  deliveryMethod: varchar("delivery_method", { 
    enum: ["In-App", "Email", "SMS", "Push"] 
  }).default("In-App"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  actionTakenAt: timestamp("action_taken_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Advanced redemption options types
export type RewardWishlist = typeof rewardWishlists.$inferSelect;
export type InsertRewardWishlist = typeof rewardWishlists.$inferInsert;
export type RewardPricingHistory = typeof rewardPricingHistory.$inferSelect;
export type InsertRewardPricingHistory = typeof rewardPricingHistory.$inferInsert;
export type PartialRedemption = typeof partialRedemptions.$inferSelect;
export type InsertPartialRedemption = typeof partialRedemptions.$inferInsert;
export type RewardRecommendation = typeof rewardRecommendations.$inferSelect;
export type InsertRewardRecommendation = typeof rewardRecommendations.$inferInsert;
export type RewardInventory = typeof rewardInventory.$inferSelect;
export type InsertRewardInventory = typeof rewardInventory.$inferInsert;
export type RecommendationModel = typeof recommendationModels.$inferSelect;
export type InsertRecommendationModel = typeof recommendationModels.$inferInsert;
export type RewardInteraction = typeof rewardInteractions.$inferSelect;
export type InsertRewardInteraction = typeof rewardInteractions.$inferInsert;
export type RewardNotification = typeof rewardNotifications.$inferSelect;
export type InsertRewardNotification = typeof rewardNotifications.$inferInsert;


export type InsertInsuranceType = typeof insuranceTypes.$inferInsert;
export type InsuranceType = typeof insuranceTypes.$inferSelect;

export type InsertInsuranceProvider = typeof insuranceProviders.$inferInsert;
export type InsuranceProvider = typeof insuranceProviders.$inferSelect;

export type InsertInsuranceQuote = typeof insuranceQuotes.$inferInsert;
export type InsuranceQuote = typeof insuranceQuotes.$inferSelect;

export type InsertSelectedQuote = typeof selectedQuotes.$inferInsert;
export type SelectedQuote = typeof selectedQuotes.$inferSelect;

export type InsertWishlist = typeof wishlist.$inferInsert;
export type Wishlist = typeof wishlist.$inferSelect;

export type InsertPolicy = typeof policies.$inferInsert;
export type Policy = typeof policies.$inferSelect;

export type InsertClaim = typeof claims.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type ClaimCommunication = typeof claimCommunications.$inferSelect;
export type InsertClaimCommunication = z.infer<typeof insertClaimCommunicationSchema>;
export type ClaimWorkflowStep = typeof claimWorkflowSteps.$inferSelect;
export type InsertClaimWorkflowStep = z.infer<typeof insertClaimWorkflowStepSchema>;

export type InsertClaimDocument = typeof claimDocuments.$inferInsert;
export type ClaimDocument = typeof claimDocuments.$inferSelect;

export type InsertDependent = typeof dependents.$inferInsert;
export type Dependent = typeof dependents.$inferSelect;

export type InsertPolicyDocument = z.infer<typeof insertPolicyDocumentSchema>;
export type PolicyDocument = typeof policyDocuments.$inferSelect;

export type InsertPremiumPayment = z.infer<typeof insertPremiumPaymentSchema>;
export type PremiumPayment = typeof premiumPayments.$inferSelect;

export type InsertPolicyAmendment = z.infer<typeof insertPolicyAmendmentSchema>;
export type PolicyAmendment = typeof policyAmendments.$inferSelect;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.string().optional(),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["Admin", "Agent", "Member", "Guest", "Visitor"]).optional(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Member Profile Schema for updates (excluding sensitive fields)
export const memberProfileSchema = insertMemberSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  dateOfBirth: true,
  profileImageUrl: true,
  avatarType: true,
  avatarColor: true,
  bio: true,
  emergencyContact: true,
  preferences: true,
}).partial();

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Points system Zod schemas
export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPointsSummarySchema = createInsertSchema(pointsSummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPointsRuleSchema = createInsertSchema(pointsRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertInsuranceQuoteSchema = createInsertSchema(insuranceQuotes).omit({
  id: true,
  createdAt: true,
});

export const insertSelectedQuoteSchema = createInsertSchema(selectedQuotes).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  createdAt: true,
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
});

export const insertPolicyDocumentSchema = createInsertSchema(policyDocuments).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
});

export const insertPremiumPaymentSchema = createInsertSchema(premiumPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicyAmendmentSchema = createInsertSchema(policyAmendments).omit({
  id: true,
  requestedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClaimDocumentSchema = createInsertSchema(claimDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertClaimCommunicationSchema = createInsertSchema(claimCommunications).omit({
  id: true,
  createdAt: true,
});

export const insertClaimWorkflowStepSchema = createInsertSchema(claimWorkflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDependentSchema = createInsertSchema(dependents).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationInvitationSchema = createInsertSchema(organizationInvitations).omit({
  id: true,
  invitationToken: true,
  acceptedAt: true,
  acceptedBy: true,
  status: true,
  createdAt: true,
});

export const insertExternalQuoteRequestSchema = createInsertSchema(externalQuoteRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced quote schema that includes external provider fields
export const insertQuoteSchema = createInsertSchema(insuranceQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type ExternalQuoteRequest = typeof externalQuoteRequests.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type AgentOrganization = typeof agentOrganizations.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertExternalQuoteRequest = z.infer<typeof insertExternalQuoteRequestSchema>;
export type InsertOrganizationInvitation = z.infer<typeof insertOrganizationInvitationSchema>;
export type InsertAgentOrganization = typeof agentOrganizations.$inferInsert;

// Role-based authorization types
export type UserRole = "SuperAdmin" | "TenantAdmin" | "Agent" | "Member" | "Guest" | "Visitor";

// Role privilege levels (0=highest privilege, 5=lowest)
export const ROLE_PRIVILEGE_LEVELS = {
  SuperAdmin: 0,
  TenantAdmin: 1,
  Agent: 2,
  Member: 3,
  Guest: 4,
  Visitor: 5
} as const;

export const ROLE_PERMISSIONS = {
  SuperAdmin: {
    privileges: ["read", "write", "delete", "manage_users", "manage_system", "manage_roles", "view_all", "edit_all", "manage_organizations", "access_all_tenants"] as const,
    resources: ["all"] as const
  },
  TenantAdmin: {
    privileges: ["read", "write", "delete", "manage_users", "manage_system", "manage_roles", "view_all", "edit_all"] as const,
    resources: ["all"] as const
  },
  Agent: {
    privileges: ["read", "write", "delete", "manage_claims", "view_customer_data"] as const,
    resources: ["claims", "policies", "contacts", "quotes", "members"] as const
  },
  Member: {
    privileges: ["read", "write_own", "view_own_data"] as const,
    resources: ["own_policies", "own_claims", "own_quotes", "own_profile", "dependents"] as const
  },
  Guest: {
    privileges: ["read_limited", "create_account", "view_public"] as const,
    resources: ["public_content", "insurance_types", "quotes_request"] as const
  },
  Visitor: {
    privileges: ["read_public"] as const,
    resources: ["public_content", "insurance_types"] as const
  }
} as const;

// Person-related exports and types
export type Person = typeof persons.$inferSelect;
export type PersonUser = typeof personUsers.$inferSelect;
export type PersonMember = typeof personMembers.$inferSelect;
export type PersonContact = typeof personContacts.$inferSelect;

export const insertPersonSchema = createInsertSchema(persons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonUserSchema = createInsertSchema(personUsers).omit({
  id: true,
  createdAt: true,
});

export const insertPersonMemberSchema = createInsertSchema(personMembers).omit({
  id: true,
  createdAt: true,
});

export const insertPersonContactSchema = createInsertSchema(personContacts).omit({
  id: true,
  createdAt: true,
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertPersonUser = z.infer<typeof insertPersonUserSchema>;
export type InsertPersonMember = z.infer<typeof insertPersonMemberSchema>;
export type InsertPersonContact = z.infer<typeof insertPersonContactSchema>;

// ===== PHASE 2: ADVANCED ORGANIZATION MANAGEMENT SCHEMA =====

// Agent profiles for enhanced directory and collaboration
export const agentProfiles = pgTable("agent_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  specializations: jsonb("specializations"), // Array of specialization areas
  bio: text("bio"),
  licenseNumber: varchar("license_number", { length: 50 }),
  yearsExperience: integer("years_experience"),
  languagesSpoken: jsonb("languages_spoken"), // Array of languages
  certifications: jsonb("certifications"), // Array of certifications
  contactPreferences: jsonb("contact_preferences"), // Email, phone, SMS preferences
  availabilitySchedule: jsonb("availability_schedule"), // Weekly schedule
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  isPublicProfile: boolean("is_public_profile").default(true),
  isAcceptingClients: boolean("is_accepting_clients").default(true),
  maxClientLoad: integer("max_client_load").default(100),
  currentClientCount: integer("current_client_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_profiles_user_id").on(table.userId),
  index("idx_agent_profiles_organization_id").on(table.organizationId),
]);

// Client assignments for agent-client relationship management
export const clientAssignments = pgTable("client_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => members.id).notNull(), // Member as client
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  assignmentType: varchar("assignment_type", { 
    enum: ["Primary", "Secondary", "Temporary", "Shared"] 
  }).default("Primary"),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  priority: varchar("priority", { enum: ["Low", "Medium", "High", "Urgent"] }).default("Medium"),
  status: varchar("status", { 
    enum: ["Active", "Inactive", "Transferred", "Completed"] 
  }).default("Active"),
  transferReason: text("transfer_reason"),
  transferredTo: varchar("transferred_to").references(() => users.id),
  transferredAt: timestamp("transferred_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_client_assignments_client_id").on(table.clientId),
  index("idx_client_assignments_agent_id").on(table.agentId),
  index("idx_client_assignments_organization_id").on(table.organizationId),
]);

// Agent performance tracking for analytics and reporting
export const agentPerformance = pgTable("agent_performance", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  periodType: varchar("period_type", { enum: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  quotesGenerated: integer("quotes_generated").default(0),
  quotesConverted: integer("quotes_converted").default(0),
  policiesSold: integer("policies_sold").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  commissionsEarned: decimal("commissions_earned", { precision: 10, scale: 2 }).default("0.00"),
  clientsAdded: integer("clients_added").default(0),
  clientsLost: integer("clients_lost").default(0),
  activitiesLogged: integer("activities_logged").default(0),
  responseTimeAvg: integer("response_time_avg"), // Average response time in hours
  satisfactionScore: decimal("satisfaction_score", { precision: 3, scale: 2 }), // 1.00 to 5.00
  goalsAchieved: integer("goals_achieved").default(0),
  goalsTotal: integer("goals_total").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_performance_agent_id").on(table.agentId),
  index("idx_agent_performance_organization_id").on(table.organizationId),
  index("idx_agent_performance_period").on(table.periodStart, table.periodEnd),
]);

// Client activity tracking for interaction history
export const clientActivities = pgTable("client_activities", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => members.id).notNull(),
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  activityType: varchar("activity_type", { 
    enum: ["Call", "Email", "Meeting", "Quote", "Policy Review", "Claim Assistance", "Follow-up", "Consultation", "Document Review", "Other"] 
  }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description"),
  duration: integer("duration"), // Duration in minutes
  outcome: varchar("outcome", { 
    enum: ["Successful", "Follow-up Required", "No Response", "Not Interested", "Postponed", "Completed"] 
  }),
  nextActionRequired: boolean("next_action_required").default(false),
  nextActionDate: timestamp("next_action_date"),
  nextActionDescription: text("next_action_description"),
  priority: varchar("priority", { enum: ["Low", "Medium", "High", "Urgent"] }).default("Medium"),
  tags: jsonb("tags"), // Array of tags for categorization
  attachments: jsonb("attachments"), // Array of attachment URLs/references
  isPrivate: boolean("is_private").default(false),
  relatedQuoteId: integer("related_quote_id").references(() => quotes.id),
  relatedPolicyId: integer("related_policy_id").references(() => policies.id),
  relatedClaimId: integer("related_claim_id").references(() => claims.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_client_activities_client_id").on(table.clientId),
  index("idx_client_activities_agent_id").on(table.agentId),
  index("idx_client_activities_organization_id").on(table.organizationId),
  index("idx_client_activities_created_at").on(table.createdAt),
]);

// Organization analytics summary for dashboard metrics
export const organizationAnalytics = pgTable("organization_analytics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  periodType: varchar("period_type", { enum: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalAgents: integer("total_agents").default(0),
  activeAgents: integer("active_agents").default(0),
  totalMembers: integer("total_members").default(0),
  newMembers: integer("new_members").default(0),
  lostMembers: integer("lost_members").default(0),
  totalQuotes: integer("total_quotes").default(0),
  convertedQuotes: integer("converted_quotes").default(0),
  totalPolicies: integer("total_policies").default(0),
  activePolicies: integer("active_policies").default(0),
  totalClaims: integer("total_claims").default(0),
  processedClaims: integer("processed_claims").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).default("0.00"),
  averageQuoteValue: decimal("average_quote_value", { precision: 10, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0.0000"), // Percentage as decimal
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }), // 1.00 to 5.00
  avgResponseTime: integer("avg_response_time"), // Average response time in hours
  topPerformingAgent: varchar("top_performing_agent").references(() => users.id),
  growthRate: decimal("growth_rate", { precision: 6, scale: 4 }), // Growth rate as decimal
  churnRate: decimal("churn_rate", { precision: 6, scale: 4 }), // Churn rate as decimal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organization_analytics_org_id").on(table.organizationId),
  index("idx_organization_analytics_period").on(table.periodStart, table.periodEnd),
]);

// Agent collaboration and knowledge sharing
export const agentCollaborations = pgTable("agent_collaborations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  initiatorId: varchar("initiator_id").references(() => users.id).notNull(),
  collaboratorId: varchar("collaborator_id").references(() => users.id).notNull(),
  collaborationType: varchar("collaboration_type", { 
    enum: ["Referral", "Joint Meeting", "Knowledge Share", "Case Review", "Training", "Mentoring"] 
  }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { 
    enum: ["Pending", "In Progress", "Completed", "Cancelled"] 
  }).default("Pending"),
  priority: varchar("priority", { enum: ["Low", "Medium", "High", "Urgent"] }).default("Medium"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  outcome: text("outcome"),
  rating: integer("rating"), // 1-5 rating for collaboration quality
  isPublic: boolean("is_public").default(false), // Visible to other agents in organization
  tags: jsonb("tags"), // Array of tags for categorization
  attachments: jsonb("attachments"), // Array of attachment URLs/references
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_collaborations_organization_id").on(table.organizationId),
  index("idx_agent_collaborations_initiator_id").on(table.initiatorId),
  index("idx_agent_collaborations_collaborator_id").on(table.collaboratorId),
]);

// Organization knowledge base for shared resources
export const organizationKnowledgeBase = pgTable("organization_knowledge_base", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => agentOrganizations.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { 
    enum: ["Best Practices", "Procedures", "Templates", "Training", "FAQ", "Resources", "Policies", "Updates"] 
  }).notNull(),
  tags: jsonb("tags"), // Array of tags for categorization
  isPublic: boolean("is_public").default(true), // Visible to all agents in organization
  isPinned: boolean("is_pinned").default(false),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  version: integer("version").default(1),
  lastReviewedBy: varchar("last_reviewed_by").references(() => users.id),
  lastReviewedAt: timestamp("last_reviewed_at"),
  attachments: jsonb("attachments"), // Array of attachment URLs/references
  relatedArticles: jsonb("related_articles"), // Array of related article IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_knowledge_base_organization_id").on(table.organizationId),
  index("idx_org_knowledge_base_author_id").on(table.authorId),
  index("idx_org_knowledge_base_category").on(table.category),
]);

// Phase 2 schema types and exports
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type InsertAgentProfile = typeof agentProfiles.$inferInsert;
export type ClientAssignment = typeof clientAssignments.$inferSelect;
export type InsertClientAssignment = typeof clientAssignments.$inferInsert;
export type AgentPerformance = typeof agentPerformance.$inferSelect;
export type InsertAgentPerformance = typeof agentPerformance.$inferInsert;
export type ClientActivity = typeof clientActivities.$inferSelect;
export type InsertClientActivity = typeof clientActivities.$inferInsert;
export type OrganizationAnalytics = typeof organizationAnalytics.$inferSelect;
export type InsertOrganizationAnalytics = typeof organizationAnalytics.$inferInsert;
export type AgentCollaboration = typeof agentCollaborations.$inferSelect;
export type InsertAgentCollaboration = typeof agentCollaborations.$inferInsert;
export type OrganizationKnowledgeBase = typeof organizationKnowledgeBase.$inferSelect;
export type InsertOrganizationKnowledgeBase = typeof organizationKnowledgeBase.$inferInsert;

// Phase 2 insert schemas
export const insertAgentProfileSchema = createInsertSchema(agentProfiles).omit({
  id: true,
  currentClientCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientAssignmentSchema = createInsertSchema(clientAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentPerformanceSchema = createInsertSchema(agentPerformance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientActivitySchema = createInsertSchema(clientActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationAnalyticsSchema = createInsertSchema(organizationAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentCollaborationSchema = createInsertSchema(agentCollaborations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationKnowledgeBaseSchema = createInsertSchema(organizationKnowledgeBase).omit({
  id: true,
  viewCount: true,
  likeCount: true,
  version: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentProfileInput = z.infer<typeof insertAgentProfileSchema>;
export type InsertClientAssignmentInput = z.infer<typeof insertClientAssignmentSchema>;
export type InsertAgentPerformanceInput = z.infer<typeof insertAgentPerformanceSchema>;
export type InsertClientActivityInput = z.infer<typeof insertClientActivitySchema>;
export type InsertOrganizationAnalyticsInput = z.infer<typeof insertOrganizationAnalyticsSchema>;
export type InsertAgentCollaborationInput = z.infer<typeof insertAgentCollaborationSchema>;
export type InsertOrganizationKnowledgeBaseInput = z.infer<typeof insertOrganizationKnowledgeBaseSchema>;
