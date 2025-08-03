import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcryptjs";
import {
  insertInsuranceQuoteSchema,
  insertSelectedQuoteSchema,
  insertWishlistSchema,
  insertPolicySchema,
  insertClaimSchema,
  insertDependentSchema,
  insertMemberSchema,
  insertContactSchema,
  insertApplicationSchema,
  insertPointsTransactionSchema,
  insertPointsSummarySchema,
  insertRewardSchema,
  insertRewardRedemptionSchema,
  insertPointsRuleSchema,
  insertApplicantSchema,
  insertApplicantDependentSchema,
  insertClaimDocumentSchema,
  insertClaimCommunicationSchema,
  insertClaimWorkflowStepSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Change password route
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For users without existing passwords (OAuth users), skip current password check
      if (user.password) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUserPassword(userId, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Initialize default admin user
  app.post('/api/initialize-admin', async (req, res) => {
    try {
      const adminUser = await storage.createDefaultAdminUser();
      if (adminUser) {
        res.json({ 
          message: "Default admin user created successfully",
          email: "admin@insurescope.com",
          password: "Admin#pass1" 
        });
      } else {
        res.json({ message: "Admin user already exists" });
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Initialize default admin user on startup
  app.post('/api/admin/init', async (req, res) => {
    try {
      const adminUser = await storage.createDefaultAdminUser();
      if (adminUser) {
        res.json({ message: "Default admin user created", user: adminUser });
      } else {
        res.json({ message: "Default admin user already exists" });
      }
    } catch (error) {
      console.error("Error creating default admin user:", error);
      res.status(500).json({ message: "Failed to create default admin user" });
    }
  });

  // Insurance types
  app.get('/api/insurance-types', async (req, res) => {
    try {
      const types = await storage.getInsuranceTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching insurance types:", error);
      res.status(500).json({ message: "Failed to fetch insurance types" });
    }
  });

  // Insurance providers
  app.get('/api/insurance-providers', async (req, res) => {
    try {
      const providers = await storage.getInsuranceProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching insurance providers:", error);
      res.status(500).json({ message: "Failed to fetch insurance providers" });
    }
  });

  // Quote search
  app.get('/api/quotes/search', async (req, res) => {
    try {
      const { typeId, ageRange, zipCode, coverageAmount } = req.query;
      const quotes = await storage.searchQuotes({
        typeId: typeId ? parseInt(typeId as string) : undefined,
        ageRange: ageRange as string,
        zipCode: zipCode as string,
        coverageAmount: coverageAmount as string,
      });
      res.json(quotes);
    } catch (error) {
      console.error("Error searching quotes:", error);
      res.status(500).json({ message: "Failed to search quotes" });
    }
  });

  // Get quote by ID
  app.get('/api/quotes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuoteById(parseInt(id));
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  // Selected quotes - protected routes
  app.get('/api/selected-quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const selectedQuotes = await storage.getUserSelectedQuotes(userId);
      res.json(selectedQuotes);
    } catch (error) {
      console.error("Error fetching selected quotes:", error);
      res.status(500).json({ message: "Failed to fetch selected quotes" });
    }
  });

  app.post('/api/selected-quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSelectedQuoteSchema.parse({
        ...req.body,
        userId,
      });
      const selectedQuote = await storage.addToSelectedQuotes(validatedData);
      res.status(201).json(selectedQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to selected quotes:", error);
      res.status(500).json({ message: "Failed to add to selected quotes" });
    }
  });

  app.delete('/api/selected-quotes/:quoteId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quoteId } = req.params;
      await storage.removeFromSelectedQuotes(userId, parseInt(quoteId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from selected quotes:", error);
      res.status(500).json({ message: "Failed to remove from selected quotes" });
    }
  });

  // Wishlist - protected routes
  app.get('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWishlistSchema.parse({
        ...req.body,
        userId,
      });
      const wishlistItem = await storage.addToWishlist(validatedData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:quoteId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quoteId } = req.params;
      await storage.removeFromWishlist(userId, parseInt(quoteId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Policies - protected routes
  app.get('/api/policies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const policies = await storage.getUserPolicies(userId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.post('/api/policies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPolicySchema.parse({
        ...req.body,
        userId,
      });
      const policy = await storage.createPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating policy:", error);
      res.status(500).json({ message: "Failed to create policy" });
    }
  });

  // Claims - protected routes
  app.get('/api/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = req.user.role || "Member";
      
      let claims;
      if (userRole === "Admin" || userRole === "Agent") {
        claims = await storage.getAllClaims();
      } else {
        claims = await storage.getUserClaims(userId);
      }
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const claim = await storage.getClaim(parseInt(id));
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  app.post('/api/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertClaimSchema.parse({
        ...req.body,
        userId,
        claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      });
      
      const claim = await storage.createClaim(validatedData);
      
      // Initialize workflow steps for the claim
      if (claim.claimType) {
        await storage.initializeClaimWorkflow(claim.id, claim.claimType);
      }
      
      res.status(201).json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating claim:", error);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.put('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClaimSchema.partial().parse(req.body);
      const claim = await storage.updateClaim(parseInt(id), validatedData);
      res.json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Claim Documents
  app.get('/api/claims/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const documents = await storage.getClaimDocuments(parseInt(id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching claim documents:", error);
      res.status(500).json({ message: "Failed to fetch claim documents" });
    }
  });

  app.post('/api/claims/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = insertClaimDocumentSchema.parse({
        ...req.body,
        claimId: parseInt(id),
        uploadedBy: userId,
      });
      const document = await storage.uploadClaimDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete('/api/claim-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClaimDocument(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Claim Communications
  app.get('/api/claims/:id/communications', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const communications = await storage.getClaimCommunications(parseInt(id));
      res.json(communications);
    } catch (error) {
      console.error("Error fetching claim communications:", error);
      res.status(500).json({ message: "Failed to fetch claim communications" });
    }
  });

  app.post('/api/claims/:id/communications', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = insertClaimCommunicationSchema.parse({
        ...req.body,
        claimId: parseInt(id),
        userId,
      });
      const communication = await storage.addClaimCommunication(validatedData);
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding communication:", error);
      res.status(500).json({ message: "Failed to add communication" });
    }
  });

  // Claim Workflow Steps
  app.get('/api/claims/:id/workflow', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const steps = await storage.getClaimWorkflowSteps(parseInt(id));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.put('/api/workflow-steps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClaimWorkflowStepSchema.partial().parse(req.body);
      const step = await storage.updateWorkflowStep(parseInt(id), validatedData);
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating workflow step:", error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });

  // Dependents - protected routes
  app.get('/api/dependents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dependents = await storage.getUserDependents(userId);
      res.json(dependents);
    } catch (error) {
      console.error("Error fetching dependents:", error);
      res.status(500).json({ message: "Failed to fetch dependents" });
    }
  });

  app.post('/api/dependents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDependentSchema.parse({
        ...req.body,
        userId,
      });
      const dependent = await storage.createDependent(validatedData);
      res.status(201).json(dependent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating dependent:", error);
      res.status(500).json({ message: "Failed to create dependent" });
    }
  });

  app.delete('/api/dependents/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeDependent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing dependent:", error);
      res.status(500).json({ message: "Failed to remove dependent" });
    }
  });

  // Members routes
  app.get('/api/members', isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post('/api/members', isAuthenticated, async (req: any, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(400).json({ message: "Failed to create member" });
    }
  });

  app.put('/api/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const memberData = insertMemberSchema.partial().parse(req.body);
      const member = await storage.updateMember(parseInt(id), memberData);
      res.json(member);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(400).json({ message: "Failed to update member" });
    }
  });

  app.delete('/api/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMember(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Contacts routes
  app.get('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(parseInt(id), contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContact(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Applications routes
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = req.user.role || "Member";
      
      let applications;
      if (userRole === "Admin" || userRole === "Agent") {
        applications = await storage.getApplications();
      } else {
        applications = await storage.getUserApplications(userId);
      }
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ message: "Failed to create application" });
    }
  });

  app.put('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(parseInt(id), applicationData);
      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(400).json({ message: "Failed to update application" });
    }
  });

  app.delete('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApplication(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Points System Routes
  
  // Points Transactions
  app.get('/api/points/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserPointsTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points transactions:", error);
      res.status(500).json({ message: "Failed to fetch points transactions" });
    }
  });

  app.post('/api/points/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const transactionData = insertPointsTransactionSchema.parse(req.body);
      const transaction = await storage.createPointsTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating points transaction:", error);
      res.status(400).json({ message: "Failed to create points transaction" });
    }
  });

  // Points Summary
  app.get('/api/points/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let summary = await storage.getUserPointsSummary(userId);
      if (!summary) {
        summary = await storage.initializeUserPointsSummary(userId);
      }
      res.json(summary);
    } catch (error) {
      console.error("Error fetching points summary:", error);
      res.status(500).json({ message: "Failed to fetch points summary" });
    }
  });

  // Award points (for admin use)
  app.post('/api/points/award', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, points, category, description, referenceId, referenceType } = req.body;
      const transaction = await storage.awardPoints(userId, points, category, description, referenceId, referenceType);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(400).json({ message: "Failed to award points" });
    }
  });

  // Rewards
  app.get('/api/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const rewards = await storage.getActiveRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get('/api/rewards/all', isAuthenticated, async (req: any, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching all rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(400).json({ message: "Failed to create reward" });
    }
  });

  app.put('/api/rewards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const rewardData = insertRewardSchema.partial().parse(req.body);
      const reward = await storage.updateReward(parseInt(id), rewardData);
      res.json(reward);
    } catch (error) {
      console.error("Error updating reward:", error);
      res.status(400).json({ message: "Failed to update reward" });
    }
  });

  app.delete('/api/rewards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReward(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reward:", error);
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // Reward Redemptions
  app.get('/api/redemptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptions = await storage.getUserRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  app.post('/api/redemptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rewardId, pointsUsed } = req.body;
      
      // Validate reward exists and user has enough points
      const reward = await storage.getRewardById(rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }

      const summary = await storage.getUserPointsSummary(userId);
      if (!summary || summary.currentBalance < reward.pointsCost) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Create redemption transaction
      const pointsTransaction = await storage.redeemPoints(
        userId, 
        reward.pointsCost, 
        `Redeemed: ${reward.name}`, 
        reward.id
      );

      // Create redemption record
      const redemption = await storage.createRewardRedemption({
        userId,
        rewardId: reward.id,
        pointsTransactionId: pointsTransaction.id,
        pointsUsed: reward.pointsCost,
        status: "Pending",
        redemptionCode: `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });

      res.status(201).json(redemption);
    } catch (error) {
      console.error("Error creating redemption:", error);
      res.status(400).json({ message: "Failed to create redemption" });
    }
  });

  // Points Rules (Admin only)
  app.get('/api/points/rules', isAuthenticated, async (req: any, res) => {
    try {
      const rules = await storage.getActivePointsRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching points rules:", error);
      res.status(500).json({ message: "Failed to fetch points rules" });
    }
  });

  app.post('/api/points/rules', isAuthenticated, async (req: any, res) => {
    try {
      const ruleData = insertPointsRuleSchema.parse(req.body);
      const rule = await storage.createPointsRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating points rule:", error);
      res.status(400).json({ message: "Failed to create points rule" });
    }
  });

  // Applicants routes
  app.get('/api/applicants', isAuthenticated, async (req: any, res) => {
    try {
      const applicants = await storage.getApplicants();
      res.json(applicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).json({ message: "Failed to fetch applicants" });
    }
  });

  app.post('/api/applicants', isAuthenticated, async (req: any, res) => {
    try {
      const applicantData = insertApplicantSchema.parse(req.body);
      const applicant = await storage.createApplicant(applicantData);
      res.status(201).json(applicant);
    } catch (error) {
      console.error("Error creating applicant:", error);
      res.status(400).json({ message: "Failed to create applicant" });
    }
  });

  app.put('/api/applicants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const applicantData = insertApplicantSchema.partial().parse(req.body);
      const applicant = await storage.updateApplicant(parseInt(id), applicantData);
      res.json(applicant);
    } catch (error) {
      console.error("Error updating applicant:", error);
      res.status(400).json({ message: "Failed to update applicant" });
    }
  });

  app.delete('/api/applicants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApplicant(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting applicant:", error);
      res.status(500).json({ message: "Failed to delete applicant" });
    }
  });

  // Applicant Dependents routes
  app.get('/api/applicant-dependents', isAuthenticated, async (req: any, res) => {
    try {
      const dependents = await storage.getApplicantDependents();
      res.json(dependents);
    } catch (error) {
      console.error("Error fetching applicant dependents:", error);
      res.status(500).json({ message: "Failed to fetch applicant dependents" });
    }
  });

  app.post('/api/applicant-dependents', isAuthenticated, async (req: any, res) => {
    try {
      const dependentData = insertApplicantDependentSchema.parse(req.body);
      const dependent = await storage.createApplicantDependent(dependentData);
      res.status(201).json(dependent);
    } catch (error) {
      console.error("Error creating applicant dependent:", error);
      res.status(400).json({ message: "Failed to create applicant dependent" });
    }
  });

  app.put('/api/applicant-dependents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const dependentData = insertApplicantDependentSchema.partial().parse(req.body);
      const dependent = await storage.updateApplicantDependent(parseInt(id), dependentData);
      res.json(dependent);
    } catch (error) {
      console.error("Error updating applicant dependent:", error);
      res.status(400).json({ message: "Failed to update applicant dependent" });
    }
  });

  app.delete('/api/applicant-dependents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApplicantDependent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting applicant dependent:", error);
      res.status(500).json({ message: "Failed to delete applicant dependent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
