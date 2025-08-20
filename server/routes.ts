import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createSessionConfig } from "./replitAuth";
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
  loginSchema,
  signupSchema,
  memberProfileSchema,
} from "@shared/schema";
import { z } from "zod";

// Helper function to get privilege level for role
function getPrivilegeLevelForRole(role: string): number {
  const privilegeLevels: Record<string, number> = {
    SuperAdmin: 0,
    TenantAdmin: 1,
    Agent: 2,
    Member: 3,
    Guest: 4,
    Visitor: 5
  };
  return privilegeLevels[role] || 5;
}

// Helper functions for organization ID obfuscation
function obfuscateOrgId(id: number): string {
  // Simple obfuscation using base64 encoding with salt
  const salted = `org_${id}_salt`;
  return Buffer.from(salted).toString('base64');
}

function deobfuscateOrgId(obfuscated: string): number | null {
  try {
    const decoded = Buffer.from(obfuscated, 'base64').toString('utf8');
    const match = decoded.match(/^org_(\d+)_salt$/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware (no Replit auth)
  const sessionMiddleware = createSessionConfig(process.env.DATABASE_URL!);
  app.use(sessionMiddleware);

  // Authentication middleware for traditional login only
  const auth = async (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      req.user = { claims: { sub: req.session.userId } };
      return next();
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.get('/api/auth/user', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Fetching user for ID:', userId);
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found for ID:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('Returning user:', { id: user.id, email: user.email, role: user.role, privilegeLevel: user.privilegeLevel });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public endpoint to get organizations for login
  app.get('/api/public/organizations', async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      const publicOrgs = organizations.map(org => ({
        id: obfuscateOrgId(org.id),
        displayName: org.displayName,
        description: org.description,
        logoUrl: org.logoUrl,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor
      }));
      res.json(publicOrgs);
    } catch (error) {
      console.error("Error fetching public organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Traditional login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password, organizationId } = validatedData;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      if (!user.password) {
        return res.status(401).json({ message: "This account uses OAuth login. Please use the OAuth login option." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive. Please contact support." });
      }

      // Validate organization selection if provided
      if (organizationId) {
        const realOrgId = deobfuscateOrgId(organizationId);
        if (!realOrgId) {
          return res.status(400).json({ message: "Invalid organization selection" });
        }

        // Check if user belongs to this organization (except SuperAdmin)
        if (user.privilegeLevel > 0 && user.organizationId !== realOrgId) {
          return res.status(403).json({ message: "You are not authorized to access this organization" });
        }

        // Store selected organization in session for SuperAdmin
        if (user.privilegeLevel === 0) {
          (req.session as any).selectedOrganizationId = realOrgId;
        }
      }

      // Set session
      (req.session as any).userId = user.id;
      
      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          privilegeLevel: user.privilegeLevel,
          organizationId: user.organizationId,
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Traditional signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { email, password, firstName, lastName, phone, role } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || "Member",
        privilegeLevel: role === "Admin" ? 1 : role === "Agent" ? 2 : 3,
        isActive: true,
      });

      // Set session
      (req.session as any).userId = newUser.id;

      res.status(201).json({ 
        message: "Signup successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          privilegeLevel: newUser.privilegeLevel,
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Logout endpoint (POST - proper API call)
  app.post('/api/logout', (req: any, res) => {
    console.log('Logout request received');
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        console.log('Logout successful - session destroyed');
        res.json({ message: "Logout successful" });
      });
    } else {
      console.log('No active session to destroy');
      res.json({ message: "No active session" });
    }
  });

  // Logout endpoint (GET - for backwards compatibility, redirects to landing page)
  app.get('/api/logout', (req: any, res) => {
    console.log('Logout GET request received (redirecting)');
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie('connect.sid');
        console.log('Logout successful - session destroyed, redirecting to landing page');
        res.redirect('/');
      });
    } else {
      console.log('No active session to destroy, redirecting to landing page');
      res.redirect('/');
    }
  });

  // Change password route
  app.post('/api/auth/change-password', auth, async (req: any, res) => {
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

  app.put('/api/auth/profile', auth, async (req: any, res) => {
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
  app.get('/api/selected-quotes', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const selectedQuotes = await storage.getUserSelectedQuotes(userId);
      res.json(selectedQuotes);
    } catch (error) {
      console.error("Error fetching selected quotes:", error);
      res.status(500).json({ message: "Failed to fetch selected quotes" });
    }
  });

  app.post('/api/selected-quotes', auth, async (req: any, res) => {
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

  app.delete('/api/selected-quotes/:quoteId', auth, async (req: any, res) => {
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
  app.get('/api/wishlist', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist', auth, async (req: any, res) => {
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

  app.delete('/api/wishlist/:quoteId', auth, async (req: any, res) => {
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
  app.get('/api/policies', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const policies = await storage.getUserPolicies(userId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.post('/api/policies', auth, async (req: any, res) => {
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
  app.get('/api/claims', auth, async (req: any, res) => {
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

  app.get('/api/claims/:id', auth, async (req: any, res) => {
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

  app.post('/api/claims', auth, async (req: any, res) => {
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

  app.put('/api/claims/:id', auth, async (req: any, res) => {
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
  app.get('/api/claims/:id/documents', auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const documents = await storage.getClaimDocuments(parseInt(id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching claim documents:", error);
      res.status(500).json({ message: "Failed to fetch claim documents" });
    }
  });

  app.post('/api/claims/:id/documents', auth, async (req: any, res) => {
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

  app.delete('/api/claim-documents/:id', auth, async (req: any, res) => {
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
  app.get('/api/claims/:id/communications', auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const communications = await storage.getClaimCommunications(parseInt(id));
      res.json(communications);
    } catch (error) {
      console.error("Error fetching claim communications:", error);
      res.status(500).json({ message: "Failed to fetch claim communications" });
    }
  });

  app.post('/api/claims/:id/communications', auth, async (req: any, res) => {
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
  app.get('/api/claims/:id/workflow', auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const steps = await storage.getClaimWorkflowSteps(parseInt(id));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.put('/api/workflow-steps/:id', auth, async (req: any, res) => {
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
  app.get('/api/dependents', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dependents = await storage.getUserDependents(userId);
      res.json(dependents);
    } catch (error) {
      console.error("Error fetching dependents:", error);
      res.status(500).json({ message: "Failed to fetch dependents" });
    }
  });

  app.post('/api/dependents', auth, async (req: any, res) => {
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

  app.delete('/api/dependents/:id', auth, async (req, res) => {
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
  app.get('/api/members', auth, async (req: any, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post('/api/members', auth, async (req: any, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(400).json({ message: "Failed to create member" });
    }
  });

  app.put('/api/members/:id', auth, async (req: any, res) => {
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

  app.delete('/api/members/:id', auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMember(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Member profile routes (for individual members to manage their own profiles)
  app.get('/api/member-profile', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      
      if (!member) {
        // Return basic profile structure for members without profiles yet
        return res.json({
          userId,
          firstName: null,
          lastName: null,
          email: null,
          memberNumber: null,
          avatarType: 'initials',
          avatarColor: '#0EA5E9',
          profileImageUrl: null,
          bio: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          dateOfBirth: null,
          emergencyContact: null,
          preferences: {},
          membershipStatus: 'Active',
        });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching member profile:", error);
      res.status(500).json({ message: "Failed to fetch member profile" });
    }
  });

  app.put('/api/member-profile', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = memberProfileSchema.parse(req.body);
      
      const member = await storage.upsertMemberProfile(userId, profileData);
      res.json(member);
    } catch (error) {
      console.error("Error updating member profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update member profile" });
    }
  });

  // Contacts routes
  app.get('/api/contacts', auth, async (req: any, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', auth, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', auth, async (req: any, res) => {
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

  app.delete('/api/contacts/:id', auth, async (req: any, res) => {
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
  app.get('/api/applications', auth, async (req: any, res) => {
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

  app.post('/api/applications', auth, async (req: any, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ message: "Failed to create application" });
    }
  });

  app.put('/api/applications/:id', auth, async (req: any, res) => {
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

  app.delete('/api/applications/:id', auth, async (req: any, res) => {
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
  app.get('/api/points/transactions', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserPointsTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points transactions:", error);
      res.status(500).json({ message: "Failed to fetch points transactions" });
    }
  });

  app.post('/api/points/transactions', auth, async (req: any, res) => {
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
  app.get('/api/points/summary', auth, async (req: any, res) => {
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
  app.post('/api/points/award', auth, async (req: any, res) => {
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
  app.get('/api/rewards', auth, async (req: any, res) => {
    try {
      const rewards = await storage.getActiveRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get('/api/rewards/all', auth, async (req: any, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching all rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards', auth, async (req: any, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(400).json({ message: "Failed to create reward" });
    }
  });

  app.put('/api/rewards/:id', auth, async (req: any, res) => {
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

  app.delete('/api/rewards/:id', auth, async (req: any, res) => {
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
  app.get('/api/redemptions', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptions = await storage.getUserRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  app.post('/api/redemptions', auth, async (req: any, res) => {
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
  app.get('/api/points/rules', auth, async (req: any, res) => {
    try {
      const rules = await storage.getActivePointsRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching points rules:", error);
      res.status(500).json({ message: "Failed to fetch points rules" });
    }
  });

  app.post('/api/points/rules', auth, async (req: any, res) => {
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
  app.get('/api/applicants', auth, async (req: any, res) => {
    try {
      const applicants = await storage.getApplicants();
      res.json(applicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).json({ message: "Failed to fetch applicants" });
    }
  });

  app.post('/api/applicants', auth, async (req: any, res) => {
    try {
      const applicantData = insertApplicantSchema.parse(req.body);
      const applicant = await storage.createApplicant(applicantData);
      res.status(201).json(applicant);
    } catch (error) {
      console.error("Error creating applicant:", error);
      res.status(400).json({ message: "Failed to create applicant" });
    }
  });

  app.put('/api/applicants/:id', auth, async (req: any, res) => {
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

  app.delete('/api/applicants/:id', auth, async (req: any, res) => {
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
  app.get('/api/applicant-dependents', auth, async (req: any, res) => {
    try {
      const dependents = await storage.getApplicantDependents();
      res.json(dependents);
    } catch (error) {
      console.error("Error fetching applicant dependents:", error);
      res.status(500).json({ message: "Failed to fetch applicant dependents" });
    }
  });

  app.post('/api/applicant-dependents', auth, async (req: any, res) => {
    try {
      const dependentData = insertApplicantDependentSchema.parse(req.body);
      const dependent = await storage.createApplicantDependent(dependentData);
      res.status(201).json(dependent);
    } catch (error) {
      console.error("Error creating applicant dependent:", error);
      res.status(400).json({ message: "Failed to create applicant dependent" });
    }
  });

  app.put('/api/applicant-dependents/:id', auth, async (req: any, res) => {
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

  app.delete('/api/applicant-dependents/:id', auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApplicantDependent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting applicant dependent:", error);
      res.status(500).json({ message: "Failed to delete applicant dependent" });
    }
  });

  // Agent Organization endpoints
  // User Management routes (Admin only)
  app.get('/api/users', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      
      // If TenantAdmin, filter to only their organization users
      if (currentUser.privilegeLevel === 1 && currentUser.organizationId) {
        const filteredUsers = users.filter(user => user.organizationId === currentUser.organizationId);
        return res.json(filteredUsers);
      }
      
      // SuperAdmin sees all users
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/stats', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      
      // Filter users if TenantAdmin
      let filteredUsers = users;
      if (currentUser.privilegeLevel === 1 && currentUser.organizationId) {
        filteredUsers = users.filter(user => user.organizationId === currentUser.organizationId);
      }
      
      const stats = {
        total: filteredUsers.length,
        active: filteredUsers.filter(u => u.isActive).length,
        admins: filteredUsers.filter(u => ["SuperAdmin", "TenantAdmin"].includes(u.role)).length,
        recentLogins: filteredUsers.filter(u => {
          if (!u.lastLoginAt) return false;
          const daysSinceLogin = (Date.now() - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLogin <= 7;
        }).length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post('/api/users', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const userData = {
        ...req.body,
        privilegeLevel: getPrivilegeLevelForRole(req.body.role)
      };

      // TenantAdmin can only create users in their organization
      if (currentUser.privilegeLevel === 1) {
        userData.organizationId = currentUser.organizationId;
        
        // TenantAdmin cannot create SuperAdmin or other TenantAdmin users
        if (["SuperAdmin", "TenantAdmin"].includes(req.body.role)) {
          return res.status(403).json({ message: "Insufficient privileges to create this role" });
        }
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // TenantAdmin can only edit users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // TenantAdmin cannot edit SuperAdmin or other TenantAdmin users
        if (["SuperAdmin", "TenantAdmin"].includes(targetUser.role) && targetUser.id !== currentUser.id) {
          return res.status(403).json({ message: "Insufficient privileges to edit this user" });
        }
      }

      const updateData = { ...req.body };
      if (updateData.role) {
        updateData.privilegeLevel = getPrivilegeLevelForRole(updateData.role);
      }

      const updatedUser = await storage.updateUser(targetUserId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/users/:id/status', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // TenantAdmin can only edit users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const updatedUser = await storage.updateUser(targetUserId, { isActive: req.body.isActive });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.delete('/api/users/:id', auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;
      
      if (!currentUser || (currentUser.privilegeLevel > 1)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting self
      if (targetUserId === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // TenantAdmin can only delete users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // TenantAdmin cannot delete SuperAdmin or other TenantAdmin users
        if (["SuperAdmin", "TenantAdmin"].includes(targetUser.role)) {
          return res.status(403).json({ message: "Insufficient privileges to delete this user" });
        }
      }

      await storage.deleteUser(targetUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Organizations
  app.get("/api/organizations", auth, async (req: any, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", auth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", auth, async (req: any, res) => {
    try {
      const organization = await storage.createOrganization(req.body);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.put("/api/organizations/:id", auth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateOrganization(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", auth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrganization(id);
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  app.get("/api/organizations/:id/users", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const users = await storage.getOrganizationUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  app.get("/api/organizations/:id/members", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const members = await storage.getOrganizationMembers(organizationId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching organization members:", error);
      res.status(500).json({ message: "Failed to fetch organization members" });
    }
  });

  // Seeding endpoint (for development only)
  app.post('/api/seed-users', async (req: any, res) => {
    try {
      console.log('Starting user seeding...');
      
      // Import seeding function dynamically
      const { seedUsers } = await import('./seed-users');
      await seedUsers();
      
      res.json({ message: 'Users seeded successfully!' });
    } catch (error) {
      console.error('Error seeding users:', error);
      res.status(500).json({ message: 'Failed to seed users', error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
