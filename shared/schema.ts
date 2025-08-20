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
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password", { length: 255 }), // Hashed password
  role: varchar("role", { enum: ["Admin", "Agent", "Member", "Guest", "Visitor"] }).default("Guest"),
  privilegeLevel: integer("privilege_level").default(4), // 1=Admin, 2=Agent, 3=Member, 4=Guest, 5=Visitor
  isActive: boolean("is_active").default(true),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  dateOfBirth: timestamp("date_of_birth"),
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

// Insurance quotes
export const insuranceQuotes = pgTable("insurance_quotes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  typeId: integer("type_id").references(() => insuranceTypes.id),
  providerId: integer("provider_id").references(() => insuranceProviders.id),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }).notNull(),
  coverageAmount: decimal("coverage_amount", { precision: 12, scale: 2 }),
  termLength: integer("term_length"), // in years
  deductible: decimal("deductible", { precision: 10, scale: 2 }),
  medicalExamRequired: boolean("medical_exam_required").default(false),
  conversionOption: boolean("conversion_option").default(false),
  features: jsonb("features"), // array of features
  createdAt: timestamp("created_at").defaultNow(),
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

// User policies
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  quoteId: integer("quote_id").references(() => insuranceQuotes.id),
  policyNumber: varchar("policy_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
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
  userId: varchar("user_id").unique().references(() => users.id),
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

// Contacts - general contact information
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
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

// Applications - insurance applications
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicationNumber: varchar("application_number", { length: 30 }).unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  insuranceTypeId: integer("insurance_type_id").references(() => insuranceTypes.id),
  status: varchar("status", { enum: ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Withdrawn"] }).default("Draft"),
  applicationData: jsonb("application_data"), // stores form data
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
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

// Applicants - individuals applying for insurance
export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  isPrimary: boolean("is_primary").default(true),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender", { enum: ["Male", "Female", "Other"] }),
  ssn: varchar("ssn", { length: 11 }), // encrypted
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  occupation: varchar("occupation", { length: 100 }),
  annualIncome: decimal("annual_income", { precision: 12, scale: 2 }),
  healthStatus: varchar("health_status", { enum: ["Excellent", "Good", "Fair", "Poor"] }),
  smoker: boolean("smoker").default(false),
  medicalHistory: jsonb("medical_history"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applicant Dependents - dependents on applications
export const applicantDependents = pgTable("applicant_dependents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  applicantId: integer("applicant_id").references(() => applicants.id),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender", { enum: ["Male", "Female", "Other"] }),
  relationship: varchar("relationship", { length: 30 }).notNull(),
  ssn: varchar("ssn", { length: 11 }), // encrypted
  healthStatus: varchar("health_status", { enum: ["Excellent", "Good", "Fair", "Poor"] }),
  smoker: boolean("smoker").default(false),
  medicalHistory: jsonb("medical_history"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  member: one(members),
  quotes: many(insuranceQuotes),
  selectedQuotes: many(selectedQuotes),
  wishlist: many(wishlist),
  policies: many(policies),
  claims: many(claims),
  dependents: many(dependents),
  applications: many(applications),
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
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [applications.contactId],
    references: [contacts.id],
  }),
  insuranceType: one(insuranceTypes, {
    fields: [applications.insuranceTypeId],
    references: [insuranceTypes.id],
  }),
  reviewer: one(users, {
    fields: [applications.reviewedBy],
    references: [users.id],
  }),
  applicants: many(applicants),
  applicantDependents: many(applicantDependents),
}));

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
  application: one(applications, {
    fields: [applicants.applicationId],
    references: [applications.id],
  }),
  dependents: many(applicantDependents),
}));

export const applicantDependentsRelations = relations(applicantDependents, ({ one }) => ({
  application: one(applications, {
    fields: [applicantDependents.applicationId],
    references: [applications.id],
  }),
  applicant: one(applicants, {
    fields: [applicantDependents.applicantId],
    references: [applicants.id],
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
  quote: one(insuranceQuotes, {
    fields: [policies.quoteId],
    references: [insuranceQuotes.id],
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

export type InsertApplication = typeof applications.$inferInsert;
export type Application = typeof applications.$inferSelect;

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

export type InsertApplicant = typeof applicants.$inferInsert;
export type Applicant = typeof applicants.$inferSelect;

export type InsertApplicantDependent = typeof applicantDependents.$inferInsert;
export type ApplicantDependent = typeof applicantDependents.$inferSelect;

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

export type InsertClaimDocument = typeof claimDocuments.$inferInsert;
export type ClaimDocument = typeof claimDocuments.$inferSelect;

export type InsertClaimCommunication = typeof claimCommunications.$inferInsert;
export type ClaimCommunication = typeof claimCommunications.$inferSelect;

export type InsertClaimWorkflowStep = typeof claimWorkflowSteps.$inferInsert;
export type ClaimWorkflowStep = typeof claimWorkflowSteps.$inferSelect;

export type InsertDependent = typeof dependents.$inferInsert;
export type Dependent = typeof dependents.$inferSelect;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export const insertApplicationSchema = createInsertSchema(applications).omit({
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

export const insertApplicantSchema = createInsertSchema(applicants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicantDependentSchema = createInsertSchema(applicantDependents).omit({
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

// Types
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Role-based authorization types
export type UserRole = "Admin" | "Agent" | "Member" | "Guest" | "Visitor";

// Role privilege levels (1=highest privilege, 5=lowest)
export const ROLE_PRIVILEGE_LEVELS = {
  Admin: 1,
  Agent: 2,
  Member: 3,
  Guest: 4,
  Visitor: 5
} as const;

export const ROLE_PERMISSIONS = {
  Admin: {
    privileges: ["read", "write", "delete", "manage_users", "manage_system", "manage_roles", "view_all", "edit_all"] as const,
    resources: ["all"] as const
  },
  Agent: {
    privileges: ["read", "write", "delete", "manage_claims", "manage_applications", "view_customer_data"] as const,
    resources: ["applications", "claims", "policies", "contacts", "quotes", "members"] as const
  },
  Member: {
    privileges: ["read", "write_own", "create_applications", "view_own_data"] as const,
    resources: ["own_policies", "own_applications", "own_claims", "own_quotes", "own_profile", "dependents"] as const
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
