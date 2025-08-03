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

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(insuranceQuotes),
  selectedQuotes: many(selectedQuotes),
  wishlist: many(wishlist),
  policies: many(policies),
  claims: many(claims),
  dependents: many(dependents),
}));

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

export const claimsRelations = relations(claims, ({ one }) => ({
  user: one(users, {
    fields: [claims.userId],
    references: [users.id],
  }),
  policy: one(policies, {
    fields: [claims.policyId],
    references: [policies.id],
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
export type User = typeof users.$inferSelect;

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

export type InsertDependent = typeof dependents.$inferInsert;
export type Dependent = typeof dependents.$inferSelect;

// Zod schemas
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
  submittedAt: true,
});

export const insertDependentSchema = createInsertSchema(dependents).omit({
  id: true,
  createdAt: true,
});
