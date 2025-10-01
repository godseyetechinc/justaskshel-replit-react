import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DataIntegrityService } from "./data-integrity";
import { createSessionConfig } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import bcrypt from "bcryptjs";
// Removed unused imports after provider orchestrator integration
import { QuoteRequest } from "./insuranceProviderConfig";
import { providerOrchestrator } from "./providerOrchestrator";
import {
  initializeQuoteWebSocket,
  quoteWebSocketServer,
} from "./websocketServer";
import { pointsService } from "./services/pointsService";
import { AchievementService } from "./services/achievementService";
import { seasonalCampaignsService } from "./services/seasonalCampaignsService";
import { socialFeaturesService } from "./services/socialFeaturesService";
import { advancedRedemptionService } from "./services/advancedRedemptionService";
import { NotificationService } from "./services/notificationService";
import { ReferralService } from "./services/referralService";
import { PointsRulesManagementService } from "./services/pointsRulesManagementService";
import { RedemptionManagementService } from "./services/redemptionManagementService";
import { BulkOperationsService } from "./services/bulkOperationsService";
import { AnalyticsService } from "./services/analyticsService";
import {
  insertInsuranceQuoteSchema,
  insertSelectedQuoteSchema,
  insertWishlistSchema,
  insertPolicySchema,
  insertClaimSchema,
  insertDependentSchema,
  insertMemberSchema,
  insertContactSchema,
  insertPointsTransactionSchema,
  insertPointsSummarySchema,
  insertRewardSchema,
  insertRewardRedemptionSchema,
  insertPointsRuleSchema,
  insertClaimDocumentSchema,
  insertClaimCommunicationSchema,
  insertClaimWorkflowStepSchema,
  insertPolicyDocumentSchema,
  insertPremiumPaymentSchema,
  insertPolicyAmendmentSchema,
  insertExternalQuoteRequestSchema,
  loginSchema,
  signupSchema,
  memberProfileSchema,
} from "@shared/schema";
import { z } from "zod";

// Helper function to get privilege level for role
function getPrivilegeLevelForRole(role: string): number {
  const privilegeLevels: Record<string, number> = {
    SuperAdmin: 0,
    LandlordAdmin: 1,
    Agent: 2,
    Member: 3,
    Guest: 4,
    Visitor: 5,
  };
  return privilegeLevels[role] || 5;
}

// Helper functions for organization ID obfuscation
function obfuscateOrgId(id: number): string {
  // Simple obfuscation using base64 encoding with salt
  const salted = `org_${id}_salt`;
  return Buffer.from(salted).toString("base64");
}

function deobfuscateOrgId(obfuscated: string): number | null {
  try {
    const decoded = Buffer.from(obfuscated, "base64").toString("utf8");
    const match = decoded.match(/^org_(\d+)_salt$/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    return null;
  }
}

// Phase 2: Agent Determination Logic Helper Functions
async function determineSellingAgent(reqBody: any, currentUser: any): Promise<string | null> {
  // Priority order:
  // 1. Explicitly specified in request (admin override - restricted to SuperAdmin/TenantAdmin)
  if (reqBody.sellingAgentId) {
    // Only SuperAdmin (privilege 0) and TenantAdmin (privilege 1) can override agent assignment
    if (currentUser.privilegeLevel <= 1) {
      // Verify the agent exists and is accessible
      const agentsResult = await storage.getAgents(currentUser);
      const targetAgent = agentsResult.agents.find((a: any) => a.id === reqBody.sellingAgentId);
      
      if (targetAgent) {
        // SuperAdmin can assign any agent; TenantAdmin only within their organization
        if (currentUser.privilegeLevel === 0 || 
            targetAgent.organizationId === currentUser.organizationId) {
          return reqBody.sellingAgentId;
        }
      }
    }
    // If not authorized or agent not found, fall through to automatic assignment
  }
  
  // 2. Current user if they're an agent
  if (currentUser.role === 'Agent') {
    return currentUser.id;
  }
  
  // 3. Member's assigned agent from client_assignments
  if (currentUser.role === 'Member') {
    // Get member record to find client assignment
    const members = await storage.getMembers();
    const member = members.find(m => m.userId === currentUser.id);
    
    if (member) {
      const assignment = await storage.getActiveClientAssignment(member.id);
      if (assignment) {
        return assignment.agentId;
      }
    }
  }
  
  // 4. Organization default agent
  if (currentUser.organizationId) {
    const orgDefaultAgent = await storage.getOrganizationDefaultAgent(
      currentUser.organizationId
    );
    if (orgDefaultAgent) {
      return orgDefaultAgent.id;
    }
  }
  
  return null;
}

async function determineServicingAgent(reqBody: any, currentUser: any, sellingAgentId: string | null): Promise<string | null> {
  // Priority order for servicing agent:
  // 1. Explicitly specified in request (admin override - restricted to SuperAdmin/TenantAdmin)
  if (reqBody.servicingAgentId) {
    // Only SuperAdmin (privilege 0) and TenantAdmin (privilege 1) can override agent assignment
    if (currentUser.privilegeLevel <= 1) {
      // Verify the agent exists and is accessible
      const agentsResult = await storage.getAgents(currentUser);
      const targetAgent = agentsResult.agents.find((a: any) => a.id === reqBody.servicingAgentId);
      
      if (targetAgent) {
        // SuperAdmin can assign any agent; TenantAdmin only within their organization
        if (currentUser.privilegeLevel === 0 || 
            targetAgent.organizationId === currentUser.organizationId) {
          return reqBody.servicingAgentId;
        }
      }
    }
    // If not authorized or agent not found, fall through to automatic assignment
  }
  
  // 2. Default to selling agent if not explicitly set
  return sellingAgentId;
}

function determinePolicySource(reqBody: any, currentUser: any): string {
  // Logic to determine policy source
  if (reqBody.isRenewal) return 'renewal';
  if (reqBody.referralCode || reqBody.referralSource) return 'referral';
  if (currentUser.role === 'Agent') return 'agent_direct';
  return 'web_application';
}

// Initialize Phase 2 services
const achievementService = new AchievementService();
const notificationService = new NotificationService();
const referralService = new ReferralService();

// Initialize Phase 3 services
const pointsRulesManagementService = new PointsRulesManagementService();
const redemptionManagementService = new RedemptionManagementService();
const bulkOperationsService = new BulkOperationsService();

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
  app.get("/api/auth/user", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Fetching user for ID:", userId);
      const user = await storage.getUser(userId);
      if (!user) {
        console.log("User not found for ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Returning user:", {
        id: user.id,
        email: user.email,
        role: user.role,
        privilegeLevel: user.privilegeLevel,
      });
      
      // Award daily login points for authenticated users
      try {
        await pointsService.awardDailyLoginPoints(userId);
      } catch (error) {
        console.error("Error awarding daily login points:", error);
        // Don't fail the auth request if points fail
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public endpoint to get organizations for login
  app.get("/api/public/organizations", async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      const publicOrgs = organizations.map((org) => ({
        id: obfuscateOrgId(org.id),
        displayName: org.displayName,
        description: org.description,
        logoUrl: org.logoUrl,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
      }));
      res.json(publicOrgs);
    } catch (error) {
      console.error("Error fetching public organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Traditional login endpoint
  app.post("/api/auth/login", async (req, res) => {
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
        return res
          .status(401)
          .json({
            message:
              "This account uses OAuth login. Please use the OAuth login option.",
          });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res
          .status(401)
          .json({ message: "Account is inactive. Please contact support." });
      }

      // Validate organization selection requirements
      const requiresOrganization = user.privilegeLevel <= 2; // SuperAdmin, TenantAdmin, Agent
      
      if (requiresOrganization && !organizationId) {
        return res
          .status(400)
          .json({ 
            message: "Organization selection is required for your role", 
            requiresOrganization: true,
            userRole: user.role
          });
      }

      // Validate organization selection if provided
      if (organizationId) {
        const realOrgId = deobfuscateOrgId(organizationId);
        if (!realOrgId) {
          return res
            .status(400)
            .json({ message: "Invalid organization selection" });
        }

        // Check if user belongs to this organization (except SuperAdmin)
        if (user.privilegeLevel > 0 && user.organizationId !== realOrgId) {
          return res
            .status(403)
            .json({
              message: "You are not authorized to access this organization",
            });
        }

        // Store selected organization in session for SuperAdmin
        if (user.privilegeLevel === 0) {
          (req.session as any).selectedOrganizationId = realOrgId;
        }
      }

      // Set session
      (req.session as any).userId = user.id;

      // Award daily login points for successful login
      try {
        await pointsService.awardDailyLoginPoints(user.id);
      } catch (error) {
        console.error("Error awarding daily login points:", error);
        // Don't fail the login request if points fail
      }

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
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Traditional signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { 
        email, password, firstName, lastName, phone, role, referralCode,
        organizationName, organizationDisplayName, organizationDescription,
        organizationPhone, organizationEmail, organizationWebsite
      } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      let organizationId: number | undefined;
      let finalRole = role || "Member";
      let finalPrivilegeLevel = role === "Admin" ? 1 : role === "Agent" ? 2 : 3;

      // Handle agent organization creation
      if (role === "Agent") {
        if (!organizationName || !organizationDisplayName) {
          return res.status(400).json({ 
            message: "Organization name and display name are required for agents" 
          });
        }

        try {
          // Create the organization
          const newOrganization = await storage.createOrganization({
            name: organizationName,
            displayName: organizationDisplayName,
            description: organizationDescription || null,
            phone: organizationPhone || null,
            email: organizationEmail || email, // Fallback to user email
            website: organizationWebsite || null,
            status: "Active",
            subscriptionPlan: "Basic",
            subscriptionStatus: "Trial",
            maxAgents: 5,
            maxMembers: 100,
            primaryColor: "#0EA5E9",
            secondaryColor: "#64748B",
          });

          organizationId = newOrganization.id;
          // Agent who creates organization becomes TenantAdmin
          finalRole = "TenantAdmin";
          finalPrivilegeLevel = 1;
        } catch (orgError) {
          console.error("Error creating organization:", orgError);
          return res.status(500).json({ 
            message: "Failed to create organization" 
          });
        }
      }

      // Create user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: finalRole,
        privilegeLevel: finalPrivilegeLevel,
        organizationId,
        isActive: true,
      });

      // Phase 2: Process referral if provided
      if (referralCode) {
        try {
          await referralService.processReferralSignup(referralCode, newUser.id);
        } catch (referralError) {
          console.error("Error processing referral signup:", referralError);
          // Don't fail registration if referral processing fails
        }
      }

      // Award welcome bonus for new user
      try {
        await pointsService.awardWelcomeBonus(newUser.id);
      } catch (pointsError) {
        console.error("Error awarding welcome bonus:", pointsError);
        // Don't fail user registration if points awarding fails
      }

      // Phase 2: Check for achievements after welcome bonus
      try {
        const newAchievements = await achievementService.checkUserAchievements(newUser.id);
        
        // Send notifications for any unlocked achievements
        for (const achievement of newAchievements) {
          await notificationService.notifyAchievementUnlocked(
            newUser.id,
            achievement.achievement.name,
            achievement.pointsAwarded,
            achievement.achievement.description
          );
        }
      } catch (achievementError) {
        console.error("Error checking initial achievements:", achievementError);
        // Don't fail registration if achievement checking fails
      }

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
          organizationId: newUser.organizationId,
        },
        ...(organizationId && { organizationCreated: true }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint (POST - proper API call)
  app.post("/api/logout", (req: any, res) => {
    console.log("Logout request received");
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid"); // Clear the session cookie
        console.log("Logout successful - session destroyed");
        res.json({ message: "Logout successful" });
      });
    } else {
      console.log("No active session to destroy");
      res.json({ message: "No active session" });
    }
  });

  // Logout endpoint (GET - for backwards compatibility, redirects to landing page)
  app.get("/api/logout", (req: any, res) => {
    console.log("Logout GET request received (redirecting)");
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("connect.sid");
        console.log(
          "Logout successful - session destroyed, redirecting to landing page",
        );
        res.redirect("/");
      });
    } else {
      console.log("No active session to destroy, redirecting to landing page");
      res.redirect("/");
    }
  });

  // Change password route
  app.post("/api/auth/change-password", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For users without existing passwords (OAuth users), skip current password check
      if (user.password) {
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          user.password,
        );
        if (!isValidPassword) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
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
  app.post("/api/initialize-admin", async (req, res) => {
    try {
      const adminUser = await storage.createDefaultAdminUser();
      if (adminUser) {
        res.json({
          message: "Default admin user created successfully",
          email: "admin@insurescope.com",
          password: "Admin#pass1",
        });
      } else {
        res.json({ message: "Admin user already exists" });
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  app.put("/api/auth/profile", auth, async (req: any, res) => {
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
  app.post("/api/admin/init", async (req, res) => {
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

  // Temporary migration endpoint for Unified Person Entity Model
  app.post("/api/admin/migrate-persons", auth, async (req: any, res) => {
    try {
      // Check if user has sufficient privileges (SuperAdmin only)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "Insufficient privileges. SuperAdmin access required." });
      }

      console.log("Starting person data migration...");
      const migrationResult = await storage.migrateDataToPersons();
      
      console.log("Migration completed successfully:", migrationResult);
      res.json({
        message: "Person data migration completed successfully",
        result: migrationResult
      });
    } catch (error) {
      console.error("Error during person migration:", error);
      res.status(500).json({ 
        message: "Failed to migrate person data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===== DATA INTEGRITY ENDPOINTS =====
  
  // Check data integrity (SuperAdmin only)
  app.get("/api/admin/integrity/check", auth, async (req: any, res) => {
    try {
      // Check if user has sufficient privileges (SuperAdmin only)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "Insufficient privileges. SuperAdmin access required." });
      }

      console.log("Running data integrity check...");
      const integrityService = new DataIntegrityService(storage);
      const checkResult = await integrityService.runIntegrityCheck();
      
      res.json({
        message: "Data integrity check completed",
        result: checkResult
      });
    } catch (error) {
      console.error("Error during integrity check:", error);
      res.status(500).json({ 
        message: "Failed to run integrity check",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Fix data integrity issues (SuperAdmin only)
  app.post("/api/admin/integrity/fix", auth, async (req: any, res) => {
    try {
      // Check if user has sufficient privileges (SuperAdmin only)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "Insufficient privileges. SuperAdmin access required." });
      }

      console.log("Fixing data integrity issues...");
      const integrityService = new DataIntegrityService(storage);
      const fixResult = await integrityService.fixIntegrityIssues();
      
      res.json({
        message: "Data integrity fixes completed",
        result: fixResult
      });
    } catch (error) {
      console.error("Error during integrity fixes:", error);
      res.status(500).json({ 
        message: "Failed to fix integrity issues",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate integrity report (SuperAdmin only)
  app.get("/api/admin/integrity/report", auth, async (req: any, res) => {
    try {
      // Check if user has sufficient privileges (SuperAdmin only)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "Insufficient privileges. SuperAdmin access required." });
      }

      console.log("Generating integrity report...");
      const integrityService = new DataIntegrityService(storage);
      const report = await integrityService.generateIntegrityReport();
      
      res.json({
        message: "Integrity report generated",
        report: report
      });
    } catch (error) {
      console.error("Error generating integrity report:", error);
      res.status(500).json({ 
        message: "Failed to generate integrity report",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===== END DATA INTEGRITY ENDPOINTS =====

  // Insurance types
  app.get("/api/insurance-types", async (req, res) => {
    try {
      const types = await storage.getInsuranceTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching insurance types:", error);
      res.status(500).json({ message: "Failed to fetch insurance types" });
    }
  });

  // Insurance providers
  app.get("/api/insurance-providers", async (req, res) => {
    try {
      const providers = await storage.getInsuranceProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching insurance providers:", error);
      res.status(500).json({ message: "Failed to fetch insurance providers" });
    }
  });

  // Enhanced quote search with multi-tenant provider integration
  app.get("/api/quotes/search", async (req: any, res) => {
    try {
      const {
        typeId,
        ageRange,
        zipCode,
        coverageAmount,
        includeExternal = "true",
        userId,
      } = req.query;

      // Get user information and organization context
      const user = req.user?.claims?.sub ? req.user.claims.sub : userId;
      let organizationId: number | undefined = undefined;
      let userRole: string | undefined = undefined;

      if (user) {
        try {
          const userInfo = await storage.getUserById(user);
          organizationId = userInfo?.organizationId || undefined;
          userRole = userInfo?.role;
        } catch (error) {
          console.warn("Could not fetch user organization:", error);
        }
      }

      // Get internal quotes first
      const internalQuotes = await storage.searchQuotes({
        typeId: typeId ? parseInt(typeId as string) : undefined,
        ageRange: ageRange as string,
        zipCode: zipCode as string,
        coverageAmount: coverageAmount as string,
      });

      // If external quotes are not requested, return only internal
      if (includeExternal !== "true") {
        return res.json({
          quotes: internalQuotes,
          providers: { total: 0, successful: 0, failed: 0, errors: [] },
          requestId: null,
          source: "internal_only",
          organizationId,
        });
      }

      // Prepare external API request
      const coverageTypeName = typeId
        ? await storage.getInsuranceTypeName(parseInt(typeId as string))
        : "Life Insurance";

      // Parse age from ageRange (e.g., "25-35" -> 30, "35+" -> 35)
      let applicantAge = 30; // default
      if (ageRange) {
        const ageMatch = ageRange.toString().match(/(\d+)/);
        if (ageMatch) {
          applicantAge = parseInt(ageMatch[1]);
        }
      }

      // Validate zip code format
      const zipCodeStr = zipCode?.toString() || "10001";
      const validZipCode = /^\d{5}$/.test(zipCodeStr) ? zipCodeStr : "10001";

      // Parse coverage amount
      const coverageAmountNum = coverageAmount
        ? parseFloat(coverageAmount.toString().replace(/[,$]/g, ""))
        : 100000;

      const externalRequest: QuoteRequest = {
        coverageType: coverageTypeName.toLowerCase(),
        applicantAge,
        zipCode: validZipCode,
        coverageAmount: coverageAmountNum,
        termLength: 20,
        paymentFrequency: "monthly",
      };

      // Extract custom headers from request headers (X-Custom-* prefix) for request-level headers
      const requestHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase().startsWith('x-custom-') && typeof value === 'string') {
          // Remove the x-custom- prefix and use the rest as the header name
          const headerName = key.substring(9); // Remove 'x-custom-' (9 characters)
          // Skip if header name is empty after removing prefix
          if (headerName.length > 0) {
            requestHeaders[headerName] = value;
          }
        }
      }

      // Validate request-level headers and return errors if invalid
      if (Object.keys(requestHeaders).length > 0) {
        const { validateCustomHeaders } = await import('./insuranceProviderConfig');
        const validation = validateCustomHeaders(requestHeaders, ['content-type', 'user-agent', 'authorization', 'x-api-key', 'x-auth-token']);
        if (!validation.valid) {
          return res.status(400).json({
            message: 'Invalid custom headers provided',
            errors: validation.errors
          });
        }
      }

      // Use the new provider orchestrator for multi-tenant quote aggregation
      const result = await providerOrchestrator.getQuotesForOrganization(
        externalRequest,
        organizationId,
        userRole,
        Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined
      );

      // Combine internal and external quotes
      //const allQuotes = [...internalQuotes, ...result.quotes];
      const allQuotes = [...result.quotes];

      // Send WebSocket updates if available
      if (quoteWebSocketServer && result.requestId) {
        quoteWebSocketServer.sendQuoteCompletion(
          result.requestId,
          organizationId,
          allQuotes.length,
        );
      }

      // Log request for tracking
      try {
        await storage.createExternalQuoteRequest({
          requestId: result.requestId,
          userId: user || null,
          coverageType: coverageTypeName,
          applicantAge,
          zipCode: validZipCode,
          coverageAmount: coverageAmountNum.toString(),
          termLength: 20,
          paymentFrequency: "monthly",
          requestData: externalRequest,
          status: "completed",
          processingStartedAt: new Date(),
          completedAt: new Date(),
          totalQuotesReceived: result.quotes.length,
          successfulProviders: result.providers.successful,
          failedProviders: result.providers.failed,
          errors: result.providers.errors,
        });
      } catch (error) {
        console.warn("Could not create external quote request record:", error);
      }

      return res.json({
        quotes: allQuotes,
        providers: result.providers,
        requestId: result.requestId,
        source: result.cached ? "cached" : "live",
        organizationId,
      });
    } catch (error) {
      console.error("Error searching quotes:", error);
      res.status(500).json({ message: "Failed to search quotes" });
    }
  });

  // Get quote by ID
  app.get("/api/quotes/:id", async (req, res) => {
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
  app.get("/api/selected-quotes", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const selectedQuotes = await storage.getUserSelectedQuotes(userId);
      res.json(selectedQuotes);
    } catch (error) {
      console.error("Error fetching selected quotes:", error);
      res.status(500).json({ message: "Failed to fetch selected quotes" });
    }
  });

  app.post("/api/selected-quotes", auth, async (req: any, res) => {
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to selected quotes:", error);
      res.status(500).json({ message: "Failed to add to selected quotes" });
    }
  });

  app.delete("/api/selected-quotes/:quoteId", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quoteId } = req.params;
      await storage.removeFromSelectedQuotes(userId, parseInt(quoteId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from selected quotes:", error);
      res
        .status(500)
        .json({ message: "Failed to remove from selected quotes" });
    }
  });

  // Wishlist - protected routes
  app.get("/api/wishlist", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", auth, async (req: any, res) => {
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:quoteId", auth, async (req: any, res) => {
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
  app.get("/api/policies", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // If user is Agent or higher privilege, show all policies for testing
      if (user && user.privilegeLevel <= 2) {
        const policies = await storage.getAllPolicies();
        res.json(policies);
      } else {
        const policies = await storage.getUserPolicies(userId);
        res.json(policies);
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.post("/api/policies", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // Phase 2: Auto-assign agent based on context
      const sellingAgentId = await determineSellingAgent(req.body, currentUser);
      const servicingAgentId = await determineServicingAgent(req.body, currentUser, sellingAgentId);
      const policySource = determinePolicySource(req.body, currentUser);
      
      const validatedData = insertPolicySchema.parse({
        ...req.body,
        userId,
        // Phase 2: Add agent associations
        sellingAgentId,
        servicingAgentId,
        organizationId: currentUser.organizationId || null,
        agentAssignedAt: sellingAgentId ? new Date() : null,
        policySource,
        referralSource: req.body.referralSource || null,
      });
      const policy = await storage.createPolicy(validatedData);
      
      // Award points for policy purchase
      try {
        await pointsService.awardPointsForActivity(
          userId, 
          "POLICY_PURCHASE", 
          policy.id?.toString(), 
          "policy"
        );
      } catch (pointsError) {
        console.error("Error awarding points for policy purchase:", pointsError);
        // Don't fail the policy creation if points awarding fails
      }
      
      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating policy:", error);
      res.status(500).json({ message: "Failed to create policy" });
    }
  });

  // Enhanced Policy Management Routes
  app.get("/api/policies/all", auth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }
      const policies = await storage.getAllPolicies();
      res.json(policies);
    } catch (error) {
      console.error("Error fetching all policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get("/api/policies/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access - users can only see their own policies unless admin/agent
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ message: "Failed to fetch policy" });
    }
  });

  app.put("/api/policies/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access - users can only edit their own policies unless admin/agent
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPolicySchema.partial().parse(req.body);
      const updatedPolicy = await storage.updatePolicy(
        parseInt(id),
        validatedData,
      );
      res.json(updatedPolicy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating policy:", error);
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  // Policy Documents Routes
  app.get("/api/policies/:id/documents", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const documents = await storage.getPolicyDocuments(parseInt(id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching policy documents:", error);
      res.status(500).json({ message: "Failed to fetch policy documents" });
    }
  });

  app.post("/api/policies/:id/documents", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPolicyDocumentSchema.parse({
        ...req.body,
        policyId: parseInt(id),
        uploadedBy: userId,
      });
      const document = await storage.createPolicyDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating policy document:", error);
      res.status(500).json({ message: "Failed to create policy document" });
    }
  });

  app.delete("/api/policies/documents/:docId", auth, async (req: any, res) => {
    try {
      const { docId } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      await storage.deletePolicyDocument(parseInt(docId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting policy document:", error);
      res.status(500).json({ message: "Failed to delete policy document" });
    }
  });

  // Premium Payments Routes
  app.get("/api/policies/:id/payments", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const payments = await storage.getPolicyPayments(parseInt(id));
      res.json(payments);
    } catch (error) {
      console.error("Error fetching policy payments:", error);
      res.status(500).json({ message: "Failed to fetch policy payments" });
    }
  });

  app.post("/api/policies/:id/payments", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      const validatedData = insertPremiumPaymentSchema.parse({
        ...req.body,
        policyId: parseInt(id),
        processedBy: req.user.claims.sub,
      });
      const payment = await storage.createPremiumPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating premium payment:", error);
      res.status(500).json({ message: "Failed to create premium payment" });
    }
  });

  app.put("/api/payments/:paymentId", auth, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      const validatedData = insertPremiumPaymentSchema
        .partial()
        .parse(req.body);
      const updatedPayment = await storage.updatePremiumPayment(
        parseInt(paymentId),
        validatedData,
      );
      res.json(updatedPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating premium payment:", error);
      res.status(500).json({ message: "Failed to update premium payment" });
    }
  });

  // Policy Amendments Routes
  app.get("/api/policies/:id/amendments", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const amendments = await storage.getPolicyAmendments(parseInt(id));
      res.json(amendments);
    } catch (error) {
      console.error("Error fetching policy amendments:", error);
      res.status(500).json({ message: "Failed to fetch policy amendments" });
    }
  });

  app.post("/api/policies/:id/amendments", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Check access
      const user = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      if (policy.userId !== userId && (user?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPolicyAmendmentSchema.parse({
        ...req.body,
        policyId: parseInt(id),
        requestedBy: userId,
      });
      const amendment = await storage.createPolicyAmendment(validatedData);
      res.status(201).json(amendment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating policy amendment:", error);
      res.status(500).json({ message: "Failed to create policy amendment" });
    }
  });

  app.put("/api/amendments/:amendmentId", auth, async (req: any, res) => {
    try {
      const { amendmentId } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      const validatedData = insertPolicyAmendmentSchema
        .partial()
        .parse(req.body);
      const updatedAmendment = await storage.updatePolicyAmendment(
        parseInt(amendmentId),
        validatedData,
      );
      res.json(updatedAmendment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating policy amendment:", error);
      res.status(500).json({ message: "Failed to update policy amendment" });
    }
  });

  // Phase 2: Agent-Policy Association Routes
  app.get("/api/agents/:agentId/policies", auth, async (req: any, res) => {
    try {
      const { agentId } = req.params;
      const { type = 'servicing' } = req.query; // 'selling' or 'servicing'
      
      // Only agents and admins can query agent policies
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.privilegeLevel > 2) {
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      // Validate type parameter
      if (type !== 'selling' && type !== 'servicing') {
        return res.status(400).json({ message: "Invalid type. Use 'selling' or 'servicing'" });
      }

      const policies = await storage.getAgentPolicies(agentId, type as 'selling' | 'servicing');
      res.json(policies);
    } catch (error) {
      console.error("Error fetching agent policies:", error);
      res.status(500).json({ message: "Failed to fetch agent policies" });
    }
  });

  app.get("/api/organizations/:orgId/policies", auth, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      
      // Check authorization
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // SuperAdmin can access all org policies, others can only see their own org
      if (currentUser.privilegeLevel > 0 && currentUser.organizationId !== parseInt(orgId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const policies = await storage.getOrganizationPolicies(parseInt(orgId));
      res.json(policies);
    } catch (error) {
      console.error("Error fetching organization policies:", error);
      res.status(500).json({ message: "Failed to fetch organization policies" });
    }
  });

  app.get("/api/policies/:id/agent-details", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if policy exists and user has access
      const policy = await storage.getPolicy(parseInt(id));
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      const currentUser = await storage.getUser(req.user.claims.sub);
      const userId = req.user.claims.sub;
      
      // Users can only see their own policy details unless they're admin/agent
      if (policy.userId !== userId && (currentUser?.privilegeLevel ?? 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const policyWithAgents = await storage.getPolicyWithAgentDetails(parseInt(id));
      if (!policyWithAgents) {
        return res.status(404).json({ message: "Policy not found" });
      }

      res.json(policyWithAgents);
    } catch (error) {
      console.error("Error fetching policy agent details:", error);
      res.status(500).json({ message: "Failed to fetch policy agent details" });
    }
  });

  // Claims - protected routes
  app.get("/api/claims", auth, async (req: any, res) => {
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

  app.post("/api/claims", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert incidentDate string to Date object before validation
      const dataToValidate = {
        ...req.body,
        userId,
        claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      };
      
      // Parse incidentDate string to Date object if provided
      if (dataToValidate.incidentDate && typeof dataToValidate.incidentDate === 'string') {
        dataToValidate.incidentDate = new Date(dataToValidate.incidentDate);
      }
      
      const validatedData = insertClaimSchema.parse(dataToValidate);

      const claim = await storage.createClaim(validatedData);

      // Initialize workflow steps for the claim
      if (claim.claimType) {
        await storage.initializeClaimWorkflow(claim.id, claim.claimType);
      }

      // Award points for claim submission
      try {
        await pointsService.awardPointsForActivity(
          userId, 
          "CLAIM_SUBMISSION", 
          claim.id?.toString(), 
          "claim"
        );
      } catch (pointsError) {
        console.error("Error awarding points for claim submission:", pointsError);
        // Don't fail the claim creation if points awarding fails
      }

      res.status(201).json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating claim:", error);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.put("/api/claims/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClaimSchema.partial().parse(req.body);
      const claim = await storage.updateClaim(parseInt(id), validatedData);
      res.json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Claim Documents
  app.get("/api/claims/:id/documents", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const documents = await storage.getClaimDocuments(parseInt(id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching claim documents:", error);
      res.status(500).json({ message: "Failed to fetch claim documents" });
    }
  });

  app.post("/api/claims/:id/documents", auth, async (req: any, res) => {
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/claim-documents/:id", auth, async (req: any, res) => {
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
  app.get("/api/claims/:id/communications", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const communications = await storage.getClaimCommunications(parseInt(id));
      res.json(communications);
    } catch (error) {
      console.error("Error fetching claim communications:", error);
      res.status(500).json({ message: "Failed to fetch claim communications" });
    }
  });

  app.post("/api/claims/:id/communications", auth, async (req: any, res) => {
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding communication:", error);
      res.status(500).json({ message: "Failed to add communication" });
    }
  });

  // Claim Workflow Steps
  app.get("/api/claims/:id/workflow", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const steps = await storage.getClaimWorkflowSteps(parseInt(id));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.put("/api/workflow-steps/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClaimWorkflowStepSchema
        .partial()
        .parse(req.body);
      const step = await storage.updateWorkflowStep(
        parseInt(id),
        validatedData,
      );
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating workflow step:", error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });

  // Dependents - protected routes
  app.get("/api/dependents", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dependents = await storage.getUserDependents(userId);
      res.json(dependents);
    } catch (error) {
      console.error("Error fetching dependents:", error);
      res.status(500).json({ message: "Failed to fetch dependents" });
    }
  });

  app.post("/api/dependents", auth, async (req: any, res) => {
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating dependent:", error);
      res.status(500).json({ message: "Failed to create dependent" });
    }
  });

  app.delete("/api/dependents/:id", auth, async (req, res) => {
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
  app.get("/api/members", auth, async (req: any, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/members", auth, async (req: any, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(400).json({ message: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", auth, async (req: any, res) => {
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

  app.delete("/api/members/:id", auth, async (req: any, res) => {
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
  app.get("/api/member-profile", auth, async (req: any, res) => {
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
          avatarType: "initials",
          avatarColor: "#0EA5E9",
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
          membershipStatus: "Active",
        });
      }

      res.json(member);
    } catch (error) {
      console.error("Error fetching member profile:", error);
      res.status(500).json({ message: "Failed to fetch member profile" });
    }
  });

  app.put("/api/member-profile", auth, async (req: any, res) => {
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
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to update member profile" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", auth, async (req: any, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", auth, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", auth, async (req: any, res) => {
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

  app.delete("/api/contacts/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContact(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });


  // Points System Routes

  // Points Transactions
  app.get("/api/points/transactions", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserPointsTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points transactions:", error);
      res.status(500).json({ message: "Failed to fetch points transactions" });
    }
  });

  app.post("/api/points/transactions", auth, async (req: any, res) => {
    try {
      const transactionData = insertPointsTransactionSchema.parse(req.body);
      const transaction =
        await storage.createPointsTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating points transaction:", error);
      res.status(400).json({ message: "Failed to create points transaction" });
    }
  });

  // Points Summary
  app.get("/api/points/summary", auth, async (req: any, res) => {
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
  app.post("/api/points/award", auth, async (req: any, res) => {
    try {
      const {
        userId,
        points,
        category,
        description,
        referenceId,
        referenceType,
      } = req.body;
      const transaction = await storage.awardPoints(
        userId,
        points,
        category,
        description,
        referenceId,
        referenceType,
      );
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(400).json({ message: "Failed to award points" });
    }
  });

  // Rewards
  app.get("/api/rewards", auth, async (req: any, res) => {
    try {
      const rewards = await storage.getActiveRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get("/api/rewards/all", auth, async (req: any, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching all rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards", auth, async (req: any, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(400).json({ message: "Failed to create reward" });
    }
  });

  app.put("/api/rewards/:id", auth, async (req: any, res) => {
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

  app.delete("/api/rewards/:id", auth, async (req: any, res) => {
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
  app.get("/api/redemptions", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptions = await storage.getUserRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  app.post("/api/redemptions", auth, async (req: any, res) => {
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
        reward.id,
      );

      // Create redemption record
      const redemption = await storage.createRewardRedemption({
        userId,
        rewardId: reward.id,
        pointsTransactionId: pointsTransaction.id,
        pointsUsed: reward.pointsCost,
        status: "Pending",
        redemptionCode: `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      });

      res.status(201).json(redemption);
    } catch (error) {
      console.error("Error creating redemption:", error);
      res.status(400).json({ message: "Failed to create redemption" });
    }
  });

  // Points Rules (Admin only)
  app.get("/api/points/rules", auth, async (req: any, res) => {
    try {
      const rules = await storage.getActivePointsRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching points rules:", error);
      res.status(500).json({ message: "Failed to fetch points rules" });
    }
  });

  app.post("/api/points/rules", auth, async (req: any, res) => {
    try {
      const ruleData = insertPointsRuleSchema.parse(req.body);
      const rule = await storage.createPointsRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating points rule:", error);
      res.status(400).json({ message: "Failed to create points rule" });
    }
  });


  // Agent Organization endpoints
  // User Management routes (Admin only)
  app.get("/api/users", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();

      // If LandlordAdmin, filter to only their organization users
      if (currentUser.privilegeLevel === 1 && currentUser.organizationId) {
        const filteredUsers = users.filter(
          (user) => user.organizationId === currentUser.organizationId,
        );
        return res.json(filteredUsers);
      }

      // SuperAdmin sees all users
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/stats", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();

      // Filter users if LandlordAdmin
      let filteredUsers = users;
      if (currentUser.privilegeLevel === 1 && currentUser.organizationId) {
        filteredUsers = users.filter(
          (user) => user.organizationId === currentUser.organizationId,
        );
      }

      const stats = {
        total: filteredUsers.length,
        active: filteredUsers.filter((u) => u.isActive).length,
        admins: filteredUsers.filter((u) =>
          ["SuperAdmin", "LandlordAdmin"].includes(u.role),
        ).length,
        recentLogins: filteredUsers.filter((u) => {
          if (!u.lastLoginAt) return false;
          const daysSinceLogin =
            (Date.now() - new Date(u.lastLoginAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return daysSinceLogin <= 7;
        }).length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post("/api/users", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const userData = {
        ...req.body,
        privilegeLevel: getPrivilegeLevelForRole(req.body.role),
      };

      // LandlordAdmin can only create users in their organization
      if (currentUser.privilegeLevel === 1) {
        userData.organizationId = currentUser.organizationId;

        // LandlordAdmin cannot create SuperAdmin or other LandlordAdmin users
        if (["SuperAdmin", "LandlordAdmin"].includes(req.body.role)) {
          return res
            .status(403)
            .json({ message: "Insufficient privileges to create this role" });
        }
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // LandlordAdmin can only edit users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // LandlordAdmin cannot edit SuperAdmin or other LandlordAdmin users
        if (
          ["SuperAdmin", "LandlordAdmin"].includes(targetUser.role) &&
          targetUser.id !== currentUser.id
        ) {
          return res
            .status(403)
            .json({ message: "Insufficient privileges to edit this user" });
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

  app.patch("/api/users/:id/status", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // LandlordAdmin can only edit users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const updatedUser = await storage.updateUser(targetUserId, {
        isActive: req.body.isActive,
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.delete("/api/users/:id", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const targetUserId = req.params.id;

      if (!currentUser || currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting self
      if (targetUserId === userId) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      // LandlordAdmin can only delete users in their organization
      if (currentUser.privilegeLevel === 1) {
        if (targetUser.organizationId !== currentUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // LandlordAdmin cannot delete SuperAdmin or other LandlordAdmin users
        if (["SuperAdmin", "LandlordAdmin"].includes(targetUser.role)) {
          return res
            .status(403)
            .json({ message: "Insufficient privileges to delete this user" });
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

  // Get organization profile for LandlordAdmin
  app.get("/api/organization-profile", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Organization profile access check:", {
        userId: user.id,
        role: user.role,
        privilegeLevel: user.privilegeLevel,
        organizationId: user.organizationId,
      });

      // Only TenantAdmin (privilege level 1) and SuperAdmin (privilege level 0) can access organization profile
      if (user.privilegeLevel > 1) {
        return res
          .status(403)
          .json({ message: "Access denied. TenantAdmin or SuperAdmin role required." });
      }

      let organizationId = user.organizationId;
      
      // For SuperAdmin without an assigned organization, get the first available organization
      if (!organizationId && user.privilegeLevel === 0) {
        const organizations = await storage.getOrganizations();
        if (organizations.length > 0) {
          organizationId = organizations[0].id;
        } else {
          return res
            .status(404)
            .json({ message: "No organizations available." });
        }
      } else if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization assigned to this user." });
      }

      const organization = await storage.getOrganizationById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization profile:", error);
      res.status(500).json({ message: "Failed to fetch organization profile" });
    }
  });

  // Update organization profile for LandlordAdmin
  app.put("/api/organization-profile", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin (privilege level 1) and SuperAdmin (privilege level 0) can update organization profile
      if (user.privilegeLevel > 1) {
        return res
          .status(403)
          .json({ message: "Access denied. TenantAdmin or SuperAdmin role required." });
      }

      let organizationId = user.organizationId;
      
      // For SuperAdmin without an assigned organization, get the first available organization
      if (!organizationId && user.privilegeLevel === 0) {
        const organizations = await storage.getOrganizations();
        if (organizations.length > 0) {
          organizationId = organizations[0].id;
        } else {
          return res
            .status(404)
            .json({ message: "No organizations available." });
        }
      } else if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization assigned to this user." });
      }

      const {
        displayName,
        description,
        website,
        phone,
        email,
        address,
        city,
        state,
        zipCode,
        logoUrl,
        primaryColor,
        secondaryColor,
      } = req.body;

      const updatedOrganization = await storage.updateOrganization(
        organizationId,
        {
          displayName,
          description,
          website,
          phone,
          email,
          address,
          city,
          state,
          zipCode,
          logoUrl,
          primaryColor,
          secondaryColor,
          updatedAt: new Date(),
        },
      );

      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(updatedOrganization);
    } catch (error) {
      console.error("Error updating organization profile:", error);
      res
        .status(500)
        .json({ message: "Failed to update organization profile" });
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

  // Get current user's organization members (for agents)
  app.get("/api/my-organization/members", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || !currentUser.organizationId) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      // Allow agents and admins to see organization members
      if ((currentUser.privilegeLevel || 5) > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const members = await storage.getOrganizationMembers(
        currentUser.organizationId,
      );
      res.json(members);
    } catch (error) {
      console.error("Error fetching organization members:", error);
      res.status(500).json({ message: "Failed to fetch organization members" });
    }
  });

  // Organization Invitation Management
  
  // Send organization invitation (TenantAdmin only)
  app.post("/api/organizations/:id/invite", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      const { email, role } = req.body;

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin can send invitations for their organization
      if (currentUser.privilegeLevel !== 1) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      if (currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Cannot invite users to different organizations." });
      }

      // Check if user already has a pending invitation
      const existingInvitation = await storage.getInvitationByEmail(email, organizationId);
      if (existingInvitation) {
        return res.status(409).json({ message: "User already has a pending invitation" });
      }

      // Check if user already exists and is in organization
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.organizationId === organizationId) {
        return res.status(409).json({ message: "User is already a member of this organization" });
      }

      const invitation = await storage.createOrganizationInvitation({
        organizationId,
        email,
        role,
        invitedBy: userId,
      });

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating organization invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get organization invitations (TenantAdmin only)
  app.get("/api/organizations/:id/invitations", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin can view invitations for their organization
      if (currentUser.privilegeLevel !== 1) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      if (currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Cannot view invitations for different organizations." });
      }

      const invitations = await storage.getOrganizationInvitations(organizationId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching organization invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Get invitation details by token
  app.get("/api/invitations/:token/details", async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Get organization details
      const organization = await storage.getOrganizationById(invitation.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get inviter details (optional)
      let inviterName = "Unknown";
      if (invitation.invitedBy) {
        const inviter = await storage.getUser(invitation.invitedBy);
        if (inviter) {
          const inviterPerson = await storage.getPersonById(inviter.personId);
          inviterName = inviterPerson ? `${inviterPerson.firstName} ${inviterPerson.lastName}` : inviter.email;
        }
      }

      res.json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
        organizationName: organization.displayName || organization.name,
        inviterName,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        createdAt: invitation.createdAt,
      });
    } catch (error) {
      console.error("Error fetching invitation details:", error);
      res.status(500).json({ message: "Failed to fetch invitation details" });
    }
  });

  // Decline invitation
  app.post("/api/invitations/:token/decline", async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== "Pending") {
        return res.status(400).json({ message: "Invitation is no longer valid" });
      }

      if (new Date() > invitation.expiresAt) {
        await storage.expireInvitation(invitation.id);
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Update invitation status to declined
      const declinedInvitation = await storage.updateOrganizationInvitation(invitation.id, {
        status: "Declined",
        updatedAt: new Date(),
      });

      res.json({ 
        message: "Invitation declined successfully",
        invitation: declinedInvitation
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ message: "Failed to decline invitation" });
    }
  });

  // Accept organization invitation
  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { userId } = req.body;

      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== "Pending") {
        return res.status(400).json({ message: "Invitation is no longer valid" });
      }

      if (new Date() > invitation.expiresAt) {
        await storage.expireInvitation(invitation.id);
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user email matches invitation
      if (user.email !== invitation.email) {
        return res.status(403).json({ message: "User email does not match invitation" });
      }

      // Update user with organization and role
      await storage.updateUser(userId, {
        organizationId: invitation.organizationId,
        role: invitation.role,
        privilegeLevel: invitation.role === "Agent" ? 2 : 3,
      });

      // Accept the invitation
      const acceptedInvitation = await storage.acceptInvitation(token, userId);

      res.json({ 
        message: "Invitation accepted successfully",
        invitation: acceptedInvitation
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Revoke organization invitation (TenantAdmin only)
  app.delete("/api/invitations/:id", auth, async (req: any, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (currentUser.privilegeLevel !== 1) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.deleteOrganizationInvitation(invitationId);
      res.json({ message: "Invitation revoked successfully" });
    } catch (error) {
      console.error("Error revoking invitation:", error);
      res.status(500).json({ message: "Failed to revoke invitation" });
    }
  });

  // ===== PHASE 2: ADVANCED ORGANIZATION MANAGEMENT ROUTES =====

  // Organization Analytics Dashboard
  app.get("/api/organizations/:id/analytics", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has access to this organization (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. Cannot view analytics for different organizations." });
      }

      const analytics = await storage.getOrganizationAnalytics(organizationId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching organization analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Organization Member Growth Analytics
  app.get("/api/organizations/:id/member-growth", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const months = parseInt(req.query.months as string) || 6;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const growth = await storage.getOrganizationMemberGrowth(organizationId, months);
      res.json(growth);
    } catch (error) {
      console.error("Error fetching member growth:", error);
      res.status(500).json({ message: "Failed to fetch member growth data" });
    }
  });

  // Agent Performance Metrics
  app.get("/api/organizations/:id/agent-performance", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const agentId = req.query.agentId as string;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const performance = await storage.getAgentPerformanceMetrics(organizationId, agentId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      res.status(500).json({ message: "Failed to fetch agent performance metrics" });
    }
  });

  // Top Performing Agents
  app.get("/api/organizations/:id/top-agents", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 5;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const topAgents = await storage.getTopPerformingAgents(organizationId, limit);
      res.json(topAgents);
    } catch (error) {
      console.error("Error fetching top agents:", error);
      res.status(500).json({ message: "Failed to fetch top performing agents" });
    }
  });

  // Enhanced Team Overview
  app.get("/api/organizations/:id/team-overview", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const teamOverview = await storage.getOrganizationTeamOverview(organizationId);
      res.json(teamOverview);
    } catch (error) {
      console.error("Error fetching team overview:", error);
      res.status(500).json({ message: "Failed to fetch team overview" });
    }
  });

  // ===== ADVANCED ANALYTICS ENDPOINTS =====

  // Advanced Organization Analytics with insights
  app.get("/api/organizations/:id/advanced-analytics", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const advancedAnalytics = await storage.getOrganizationAdvancedAnalytics(organizationId);
      res.json(advancedAnalytics);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      res.status(500).json({ message: "Failed to fetch advanced analytics" });
    }
  });

  // Comprehensive KPI Dashboard
  app.get("/api/organizations/:id/kpi-dashboard", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const kpiDashboard = await storage.getOrganizationKPIDashboard(organizationId);
      res.json(kpiDashboard);
    } catch (error) {
      console.error("Error fetching KPI dashboard:", error);
      res.status(500).json({ message: "Failed to fetch KPI dashboard" });
    }
  });

  // Agent Workload Distribution
  app.get("/api/organizations/:id/agent-workload", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const workloadDistribution = await storage.getAgentWorkloadDistribution(organizationId);
      res.json(workloadDistribution);
    } catch (error) {
      console.error("Error fetching agent workload:", error);
      res.status(500).json({ message: "Failed to fetch agent workload distribution" });
    }
  });

  // Client Lifecycle Analytics
  app.get("/api/organizations/:id/client-lifecycle", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const lifecycleAnalytics = await storage.getClientLifecycleAnalytics(organizationId);
      res.json(lifecycleAnalytics);
    } catch (error) {
      console.error("Error fetching client lifecycle analytics:", error);
      res.status(500).json({ message: "Failed to fetch client lifecycle analytics" });
    }
  });

  // ===== ENHANCED AGENT PERFORMANCE TRACKING ENDPOINTS =====

  // Agent Performance History
  app.get("/api/agents/:id/performance-history", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const months = parseInt(req.query.months as string) || 6;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Agents can view their own history, TenantAdmin/SuperAdmin can view any agent's history
      if (currentUser.id !== agentId && currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied." });
      }

      const performanceHistory = await storage.getAgentPerformanceHistory(agentId, currentUser.organizationId, months);
      res.json(performanceHistory);
    } catch (error) {
      console.error("Error fetching agent performance history:", error);
      res.status(500).json({ message: "Failed to fetch agent performance history" });
    }
  });

  // Agent Goals and Targets
  app.get("/api/agents/:id/goals", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Agents can view their own goals, TenantAdmin/SuperAdmin can view any agent's goals
      if (currentUser.id !== agentId && currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied." });
      }

      const goalsAndTargets = await storage.getAgentGoalsAndTargets(agentId, currentUser.organizationId);
      res.json(goalsAndTargets);
    } catch (error) {
      console.error("Error fetching agent goals:", error);
      res.status(500).json({ message: "Failed to fetch agent goals and targets" });
    }
  });

  // Agent Productivity Metrics
  app.get("/api/agents/:id/productivity", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Agents can view their own productivity, TenantAdmin/SuperAdmin can view any agent's productivity
      if (currentUser.id !== agentId && currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied." });
      }

      const productivityMetrics = await storage.getAgentProductivityMetrics(agentId, currentUser.organizationId);
      res.json(productivityMetrics);
    } catch (error) {
      console.error("Error fetching agent productivity metrics:", error);
      res.status(500).json({ message: "Failed to fetch agent productivity metrics" });
    }
  });

  // Generate Comprehensive Agent Performance Report
  app.get("/api/agents/:id/performance-report", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin and SuperAdmin can generate comprehensive reports
      if (currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Only administrators can generate performance reports." });
      }

      const performanceReport = await storage.generateAgentPerformanceReport(agentId, currentUser.organizationId);
      res.json(performanceReport);
    } catch (error) {
      console.error("Error generating agent performance report:", error);
      res.status(500).json({ message: "Failed to generate agent performance report" });
    }
  });

  // Organization Agent Performance Rankings
  app.get("/api/organizations/:id/agent-rankings", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const agentRankings = await storage.getOrganizationAgentPerformanceRankings(organizationId);
      res.json(agentRankings);
    } catch (error) {
      console.error("Error fetching agent performance rankings:", error);
      res.status(500).json({ message: "Failed to fetch agent performance rankings" });
    }
  });

  // ===== AGENT DIRECTORY AND COLLABORATION ENDPOINTS =====
  
  /**
   * Phase 1-4: SuperAdmin Cross-Organization Access with Pagination
   * Scope-aware agent query endpoint - SuperAdmin sees all orgs, others see their org
   * Query params: page (default 1), limit (default 50)
   */
  app.get("/api/agents", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;

      // Create user context for scope resolution
      const userContext = {
        userId: currentUser.id,
        privilegeLevel: currentUser.privilegeLevel,
        organizationId: currentUser.organizationId,
      };

      // Get agents with automatic scope resolution and pagination
      const result = await storage.getAgents(userContext, { limit, offset });
      
      // Add cache headers for performance optimization
      // Phase 4: Response caching considerations
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes cache
      res.setHeader('Vary', 'Cookie'); // Vary by authentication
      
      // Return paginated response
      res.json({
        data: result.agents,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasMore: offset + result.agents.length < result.total,
        },
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Get all agents in organization (legacy endpoint for backward compatibility)
  app.get("/api/organizations/:id/agents", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const agents = await storage.getOrganizationAgents(organizationId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching organization agents:", error);
      res.status(500).json({ message: "Failed to fetch organization agents" });
    }
  });

  // Search and filter agents
  app.get("/api/organizations/:id/agents/search", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const filters = {
        specializations: req.query.specializations ? JSON.parse(req.query.specializations as string) : undefined,
        acceptingClients: req.query.acceptingClients ? req.query.acceptingClients === 'true' : undefined,
        languages: req.query.languages ? JSON.parse(req.query.languages as string) : undefined,
        experienceMin: req.query.experienceMin ? parseInt(req.query.experienceMin as string) : undefined,
        ratingMin: req.query.ratingMin ? parseFloat(req.query.ratingMin as string) : undefined,
      };

      const agents = await storage.searchAgents(organizationId, filters);
      res.json(agents);
    } catch (error) {
      console.error("Error searching agents:", error);
      res.status(500).json({ message: "Failed to search agents" });
    }
  });

  // Get agent profile details
  app.get("/api/agents/:id/profile", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const agentProfile = await storage.getAgentProfile(agentId);
      if (!agentProfile) {
        return res.status(404).json({ message: "Agent profile not found" });
      }

      // Check access permissions - only allow access within same organization or for SuperAdmin
      if (currentUser.privilegeLevel > 0 && currentUser.organizationId !== agentProfile.organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      res.json(agentProfile);
    } catch (error) {
      console.error("Error fetching agent profile:", error);
      res.status(500).json({ message: "Failed to fetch agent profile" });
    }
  });

  // Update agent profile
  app.put("/api/agents/:id/profile", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow agents to update their own profile or TenantAdmin/SuperAdmin to update any profile
      if (currentUser.id !== agentId && currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Can only update your own profile." });
      }

      const updatedProfile = await storage.updateAgentProfile(agentId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating agent profile:", error);
      res.status(500).json({ message: "Failed to update agent profile" });
    }
  });

  // ===== CLIENT ASSIGNMENT AND RELATIONSHIP MANAGEMENT ENDPOINTS =====
  
  // Get all clients in organization
  app.get("/api/organizations/:id/clients", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const clients = await storage.getOrganizationClients(organizationId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching organization clients:", error);
      res.status(500).json({ message: "Failed to fetch organization clients" });
    }
  });

  // Get unassigned clients in organization
  app.get("/api/organizations/:id/clients/unassigned", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin and above can view unassigned clients
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const unassignedClients = await storage.getUnassignedClients(organizationId);
      res.json(unassignedClients);
    } catch (error) {
      console.error("Error fetching unassigned clients:", error);
      res.status(500).json({ message: "Failed to fetch unassigned clients" });
    }
  });

  // Get agent's clients
  app.get("/api/agents/:id/clients", auth, async (req: any, res) => {
    try {
      const agentId = req.params.id;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Agents can only see their own clients, TenantAdmin/SuperAdmin can see any agent's clients in same org
      if (currentUser.id !== agentId && currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied." });
      }

      const clients = await storage.getAgentClients(agentId, currentUser.organizationId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching agent clients:", error);
      res.status(500).json({ message: "Failed to fetch agent clients" });
    }
  });

  // Assign client to agent
  app.post("/api/client-assignments", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin and above can assign clients
      if (currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Only administrators can assign clients." });
      }

      const assignmentData = {
        ...req.body,
        organizationId: currentUser.organizationId,
      };

      const assignment = await storage.assignClientToAgent(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning client:", error);
      res.status(500).json({ message: "Failed to assign client to agent" });
    }
  });

  // Transfer client assignment
  app.put("/api/client-assignments/:id/transfer", auth, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { newAgentId, reason } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only TenantAdmin and above can transfer assignments
      if (currentUser.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Only administrators can transfer assignments." });
      }

      const updatedAssignment = await storage.transferClientAssignment(assignmentId, newAgentId, reason);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error transferring client assignment:", error);
      res.status(500).json({ message: "Failed to transfer client assignment" });
    }
  });

  // Update client assignment
  app.put("/api/client-assignments/:id", auth, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // TenantAdmin and above can update any assignment, agents can update their own assignments
      if (currentUser.privilegeLevel > 1) {
        // For regular agents, they can only update their own client assignments
        // This would require additional logic to check if the assignment belongs to them
        return res.status(403).json({ message: "Access denied." });
      }

      const updatedAssignment = await storage.updateClientAssignment(assignmentId, req.body);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating client assignment:", error);
      res.status(500).json({ message: "Failed to update client assignment" });
    }
  });

  // Get client assignment details
  app.get("/api/clients/:id/assignment", auth, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const assignmentDetails = await storage.getClientAssignmentDetails(clientId);
      
      if (!assignmentDetails) {
        return res.status(404).json({ message: "Client assignment not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 1 && 
          currentUser.organizationId !== assignmentDetails.client.organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      res.json(assignmentDetails);
    } catch (error) {
      console.error("Error fetching client assignment details:", error);
      res.status(500).json({ message: "Failed to fetch client assignment details" });
    }
  });

  // Client Assignment Management
  app.get("/api/organizations/:id/client-assignments", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const agentId = req.query.agentId as string;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const assignments = await storage.getAgentClientAssignments(organizationId, agentId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching client assignments:", error);
      res.status(500).json({ message: "Failed to fetch client assignments" });
    }
  });

  // Assign Client to Agent
  app.post("/api/organizations/:id/assign-client", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const { clientId, agentId } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or Agent)
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      await storage.assignClientToAgent(clientId, agentId, userId);
      res.json({ message: "Client assigned successfully" });
    } catch (error) {
      console.error("Error assigning client:", error);
      res.status(500).json({ message: "Failed to assign client" });
    }
  });

  // Transfer Client Between Agents
  app.post("/api/organizations/:id/transfer-client", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const { clientId, fromAgentId, toAgentId, reason } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin only)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.transferClientToAgent(clientId, fromAgentId, toAgentId, reason);
      res.json({ message: "Client transferred successfully" });
    } catch (error) {
      console.error("Error transferring client:", error);
      res.status(500).json({ message: "Failed to transfer client" });
    }
  });

  // Organization Activity Feed
  app.get("/api/organizations/:id/activity-feed", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const activityFeed = await storage.getOrganizationActivityFeed(organizationId, limit);
      res.json(activityFeed);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Organization Insights
  app.get("/api/organizations/:id/insights", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const insights = await storage.getOrganizationInsights(organizationId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching organization insights:", error);
      res.status(500).json({ message: "Failed to fetch organization insights" });
    }
  });

  // ===== PHASE 5: EXTENDED CROSS-ORGANIZATION ACCESS ENDPOINTS =====

  /**
   * Phase 5: Scope-aware Members endpoint
   * SuperAdmin sees all orgs, others see their org
   */
  app.get("/api/members-scope", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;

      // Create user context
      const userContext = {
        userId: currentUser.id,
        privilegeLevel: currentUser.privilegeLevel,
        organizationId: currentUser.organizationId,
      };

      const result = await storage.getMembersWithScope(userContext, { limit, offset });

      // Add cache headers
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Cookie');

      res.json({
        data: result.members,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasMore: offset + result.members.length < result.total,
        },
      });
    } catch (error) {
      console.error("Error fetching members with scope:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  /**
   * Phase 5: Scope-aware Analytics endpoint
   * SuperAdmin sees system-wide analytics, others see organization analytics
   */
  app.get("/api/analytics-scope", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create user context
      const userContext = {
        userId: currentUser.id,
        privilegeLevel: currentUser.privilegeLevel,
        organizationId: currentUser.organizationId,
      };

      const analytics = await storage.getAnalyticsWithScope(userContext);

      // Add cache headers
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Cookie');

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics with scope:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  /**
   * Phase 5: Scope-aware Client Assignments endpoint
   * SuperAdmin sees all orgs, others see their org
   */
  app.get("/api/client-assignments-scope", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;

      // Create user context
      const userContext = {
        userId: currentUser.id,
        privilegeLevel: currentUser.privilegeLevel,
        organizationId: currentUser.organizationId,
      };

      const result = await storage.getClientAssignmentsWithScope(userContext, { limit, offset });

      // Add cache headers
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'Cookie');

      res.json({
        data: result.assignments,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasMore: offset + result.assignments.length < result.total,
        },
      });
    } catch (error) {
      console.error("Error fetching client assignments with scope:", error);
      res.status(500).json({ message: "Failed to fetch client assignments" });
    }
  });

  // Enhanced Team Management Routes

  // Get Enhanced Member List with Search and Filtering
  app.get("/api/organizations/:id/enhanced-members", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const search = req.query.search as string;
      const roleFilter = req.query.roleFilter as string;
      const statusFilter = req.query.statusFilter as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin or SuperAdmin)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const result = await storage.getEnhancedMemberList(organizationId, {
        search,
        roleFilter,
        statusFilter,
        limit,
        offset,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching enhanced member list:", error);
      res.status(500).json({ message: "Failed to fetch enhanced member list" });
    }
  });

  // Update Member Role
  app.patch("/api/organizations/:id/members/:memberId/role", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const memberId = req.params.memberId;
      const { newRole } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin only)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.updateMemberRole(memberId, newRole, userId);
      res.json({ message: "Member role updated successfully" });
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  // Update Member Status
  app.patch("/api/organizations/:id/members/:memberId/status", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const memberId = req.params.memberId;
      const { isActive } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin only)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.updateMemberStatus(memberId, isActive, userId);
      res.json({ message: "Member status updated successfully" });
    } catch (error) {
      console.error("Error updating member status:", error);
      res.status(500).json({ message: "Failed to update member status" });
    }
  });

  // Bulk Update Members
  app.patch("/api/organizations/:id/members/bulk", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const { memberIds, updates } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin only)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.bulkUpdateMembers(memberIds, updates, userId);
      res.json({ message: `Successfully updated ${memberIds.length} members` });
    } catch (error) {
      console.error("Error bulk updating members:", error);
      res.status(500).json({ message: "Failed to bulk update members" });
    }
  });

  // Remove Member
  app.delete("/api/organizations/:id/members/:memberId", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const memberId = req.params.memberId;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions (TenantAdmin only)
      if (currentUser.privilegeLevel > 1 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied. TenantAdmin role required." });
      }

      await storage.removeMember(memberId, userId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Get Member Performance Details
  app.get("/api/organizations/:id/members/:memberId/performance", auth, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const memberId = req.params.memberId;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (currentUser.privilegeLevel > 2 && currentUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const performance = await storage.getMemberPerformanceDetails(memberId, organizationId);
      if (!performance) {
        return res.status(404).json({ message: "Member not found" });
      }

      res.json(performance);
    } catch (error) {
      console.error("Error fetching member performance details:", error);
      res.status(500).json({ message: "Failed to fetch member performance details" });
    }
  });

  // Get agent information for current member
  app.get("/api/my-agent", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle SuperAdmin users (privilege level 0)
      if (currentUser.privilegeLevel === 0) {
        // SuperAdmin can access all agents, return from demo-org as default
        const organizations = await storage.getOrganizations();
        const demoOrg = organizations.find(org => org.name === 'demo-org') || organizations[0];
        
        if (!demoOrg) {
          return res.status(404).json({ message: "No organizations found" });
        }

        const orgUsers = await storage.getOrganizationUsers(demoOrg.id);
        const agents = orgUsers.filter((user) => user.role === "Agent");

        return res.json({
          agents,
          organization: demoOrg,
        });
      }

      // Check if user has organization assignment
      if (!currentUser.organizationId) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      // Only members and higher roles can access this endpoint
      if ((currentUser.privilegeLevel || 5) > 3) {
        return res
          .status(403)
          .json({ message: "Access denied" });
      }

      // Get all users in the organization with Agent role
      const orgUsers = await storage.getOrganizationUsers(
        currentUser.organizationId,
      );
      const agents = orgUsers.filter((user) => user.role === "Agent");

      if (agents.length === 0) {
        return res
          .status(404)
          .json({ message: "No agents found in your organization" });
      }

      // Get organization info
      const organizations = await storage.getOrganizations();
      const organization = organizations.find(
        (org) => org.id === currentUser.organizationId,
      );

      res.json({
        agents,
        organization,
      });
    } catch (error) {
      console.error("Error fetching agent information:", error);
      res.status(500).json({ message: "Failed to fetch agent information" });
    }
  });

  // File upload endpoints for claims documents
  // Get upload URL for file attachment (MUST come before :id route)
  app.post("/api/claims/upload-url", auth, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/api/claims/:id", auth, async (req: any, res) => {
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

  // Attach uploaded file to claim
  app.post("/api/claims/:claimId/documents", auth, async (req: any, res) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const userId = req.user.claims.sub;
      const { fileName, fileType, fileSize, documentType, uploadedFileURL } =
        req.body;

      if (!uploadedFileURL) {
        return res.status(400).json({ error: "uploadedFileURL is required" });
      }

      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: "Invalid file type" });
      }

      const isImage = fileType.startsWith("image/");
      const maxSize = isImage ? 204800 : 512000; // 200KB for images, 500KB for documents
      if (fileSize > maxSize) {
        return res
          .status(400)
          .json({
            error: `File too large. ${isImage ? "Images" : "Documents"} must be under ${Math.round(maxSize / 1024)}KB.`,
          });
      }

      // Verify the claim exists and user has access
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }

      // Check if user owns the claim or is an agent/admin
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const canAccess = claim.userId === userId || user.privilegeLevel <= 2; // Member owns claim or Agent/Admin
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Set ACL policy for the uploaded file
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadedFileURL,
        {
          owner: userId,
          visibility: "private", // Claims documents are always private
        },
      );

      // Create document record
      const documentData = {
        claimId,
        fileName,
        fileType,
        fileSize,
        documentType: documentType || "other",
        uploadedBy: userId,
        status: "pending",
      };

      const document = await storage.uploadClaimDocument(documentData);

      res.status(201).json({
        document,
        objectPath,
      });
    } catch (error) {
      console.error("Error attaching document to claim:", error);
      res.status(500).json({ error: "Failed to attach document" });
    }
  });

  // Get documents for a claim
  app.get("/api/claims/:claimId/documents", auth, async (req: any, res) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const userId = req.user.claims.sub;

      // Verify user has access to the claim
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const canAccess = claim.userId === userId || user.privilegeLevel <= 2;
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const documents = await storage.getClaimDocuments(claimId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching claim documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Download/serve claim document file
  app.get("/objects/:objectPath(*)", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();

      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.sendStatus(403);
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // SuperAdmin: External quote requests management
  app.get("/api/admin/external-quote-requests", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "SuperAdmin access required" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const requests = await storage.getExternalQuoteRequests({
        limit,
        offset,
      });
      const totalCount = await storage.getExternalQuoteRequestsCount();

      res.json({
        requests,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching external quote requests:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch external quote requests" });
    }
  });

  // SuperAdmin: Provider configuration management
  app.get("/api/admin/provider-configs", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "SuperAdmin access required" });
      }

      const { getActiveProviders, getAllProviders } = await import(
        "./insuranceProviderConfig"
      );
      const activeProviders = getActiveProviders();
      const allProviders = getAllProviders();

      res.json({
        active: activeProviders,
        all: allProviders,
        summary: {
          totalProviders: allProviders.length,
          activeProviders: activeProviders.length,
          inactiveProviders: allProviders.length - activeProviders.length,
        },
      });
    } catch (error) {
      console.error("Error fetching provider configs:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch provider configurations" });
    }
  });

  // SuperAdmin: Update provider configuration
  app.put("/api/admin/provider-configs/:id", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "SuperAdmin access required" });
      }

      const { id } = req.params;
      const { UpdateProviderConfigSchema, updateProvider } = await import(
        "./insuranceProviderConfig"
      );

      const validatedData = UpdateProviderConfigSchema.parse(req.body);
      const updatedProvider = updateProvider(id, validatedData);

      if (!updatedProvider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.json(updatedProvider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating provider config:", error);
      res
        .status(500)
        .json({ message: "Failed to update provider configuration" });
    }
  });

  // SuperAdmin: Test provider connection
  app.post(
    "/api/admin/provider-configs/:id/test",
    auth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user || user.privilegeLevel !== 0) {
          return res
            .status(403)
            .json({ message: "SuperAdmin access required" });
        }

        const { id } = req.params;
        const { getProviderById, testProviderConnection } = await import(
          "./insuranceProviderConfig"
        );

        const provider = getProviderById(id);
        if (!provider) {
          return res.status(404).json({ message: "Provider not found" });
        }

        const testResult = await testProviderConnection(provider);
        res.json(testResult);
      } catch (error) {
        console.error("Error testing provider connection:", error);
        res.status(500).json({ message: "Failed to test provider connection" });
      }
    },
  );

  // SuperAdmin: Get provider statistics
  app.get("/api/admin/provider-stats", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.privilegeLevel !== 0) {
        return res.status(403).json({ message: "SuperAdmin access required" });
      }

      const { getAllProviders } = await import("./insuranceProviderConfig");
      const allProviders = getAllProviders();

      // Get provider statistics from database
      const statsPromises = allProviders.map(async (provider) => {
        const successfulRequests = await storage.getExternalQuoteRequestsCount({
          providerId: provider.id,
          status: "success",
        });
        const failedRequests = await storage.getExternalQuoteRequestsCount({
          providerId: provider.id,
          status: "error",
        });
        const totalRequests = await storage.getExternalQuoteRequestsCount({
          providerId: provider.id,
        });

        return {
          providerId: provider.id,
          providerName: provider.displayName,
          isActive: provider.isActive,
          mockMode: provider.mockMode,
          priority: provider.priority,
          successfulRequests,
          failedRequests,
          totalRequests,
          successRate:
            totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
          supportedCoverageTypes: provider.supportedCoverageTypes,
        };
      });

      const stats = await Promise.all(statsPromises);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching provider stats:", error);
      res.status(500).json({ message: "Failed to fetch provider statistics" });
    }
  });

  // ===== Phase 2: User Engagement Features API Routes =====

  // Achievement routes
  app.get("/api/achievements", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Return all achievements for the achievements gallery page
      const achievements = await achievementService.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/check", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const newAchievements = await achievementService.checkUserAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await notificationService.getUserNotifications(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notificationId = parseInt(req.params.id);
      await notificationService.markAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Referral routes
  app.get("/api/referrals/code", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const referralCode = await referralService.generateReferralCode(userId);
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  app.get("/api/referrals/stats", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const stats = await referralService.getUserReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/referrals/validate", async (req: any, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const validation = await referralService.validateReferralCode(code);
      res.json(validation);
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  // ===== Phase 3: Administrative Tools API Routes =====

  // Points Rules Management (Admin only)
  app.get("/api/admin/points-rules", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { category, isActive, search, sortBy, sortOrder, limit, offset } = req.query;
      const result = await pointsRulesManagementService.getAllPointsRules({
        category,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search,
        sortBy,
        sortOrder,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching points rules:", error);
      res.status(500).json({ message: "Failed to fetch points rules" });
    }
  });

  app.get("/api/admin/points-rules/:id", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const rule = await pointsRulesManagementService.getPointsRuleById(parseInt(req.params.id));
      if (!rule) {
        return res.status(404).json({ message: "Points rule not found" });
      }

      res.json(rule);
    } catch (error) {
      console.error("Error fetching points rule:", error);
      res.status(500).json({ message: "Failed to fetch points rule" });
    }
  });

  app.post("/api/admin/points-rules", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = await pointsRulesManagementService.validateRule(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ message: "Validation failed", errors: validation.errors });
      }

      const newRule = await pointsRulesManagementService.createPointsRule(req.body);
      res.status(201).json(newRule);
    } catch (error) {
      console.error("Error creating points rule:", error);
      res.status(500).json({ message: "Failed to create points rule" });
    }
  });

  app.put("/api/admin/points-rules/:id", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = await pointsRulesManagementService.validateRule(req.body, parseInt(req.params.id));
      if (!validation.isValid) {
        return res.status(400).json({ message: "Validation failed", errors: validation.errors });
      }

      const updatedRule = await pointsRulesManagementService.updatePointsRule(parseInt(req.params.id), req.body);
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating points rule:", error);
      res.status(500).json({ message: "Failed to update points rule" });
    }
  });

  app.delete("/api/admin/points-rules/:id", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      await pointsRulesManagementService.deletePointsRule(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting points rule:", error);
      res.status(500).json({ message: "Failed to delete points rule" });
    }
  });

  app.post("/api/admin/points-rules/bulk-update", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { ids, isActive } = req.body;
      const updatedCount = await pointsRulesManagementService.bulkUpdateRuleStatus(ids, isActive);
      res.json({ updatedCount });
    } catch (error) {
      console.error("Error bulk updating points rules:", error);
      res.status(500).json({ message: "Failed to bulk update points rules" });
    }
  });

  // Redemption Management (Admin only)
  app.get("/api/admin/redemptions", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filters = {
        status: req.query.status,
        userId: req.query.userId,
        rewardId: req.query.rewardId ? parseInt(req.query.rewardId as string) : undefined,
        deliveryMethod: req.query.deliveryMethod,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await redemptionManagementService.getAllRedemptions(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  app.get("/api/admin/redemptions/:id", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const redemption = await redemptionManagementService.getRedemptionById(parseInt(req.params.id));
      if (!redemption) {
        return res.status(404).json({ message: "Redemption not found" });
      }

      res.json(redemption);
    } catch (error) {
      console.error("Error fetching redemption:", error);
      res.status(500).json({ message: "Failed to fetch redemption" });
    }
  });

  app.put("/api/admin/redemptions/:id/status", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, adminNotes, deliveryData } = req.body;
      const updatedRedemption = await redemptionManagementService.updateRedemptionStatus(
        parseInt(req.params.id), 
        status, 
        adminNotes, 
        deliveryData
      );

      res.json(updatedRedemption);
    } catch (error) {
      console.error("Error updating redemption status:", error);
      res.status(500).json({ message: "Failed to update redemption status" });
    }
  });

  app.post("/api/admin/redemptions/:id/generate-code", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const redemptionCode = await redemptionManagementService.generateAndAssignRedemptionCode(parseInt(req.params.id));
      res.json({ redemptionCode });
    } catch (error) {
      console.error("Error generating redemption code:", error);
      res.status(500).json({ message: "Failed to generate redemption code" });
    }
  });

  app.get("/api/admin/redemptions-queue", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await redemptionManagementService.getPendingRedemptionsQueue(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching redemptions queue:", error);
      res.status(500).json({ message: "Failed to fetch redemptions queue" });
    }
  });

  // Bulk Operations (Admin only)
  app.post("/api/admin/bulk/award-points", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await bulkOperationsService.bulkAwardPoints(req.body, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error("Error executing bulk points award:", error);
      res.status(500).json({ message: "Failed to execute bulk points award" });
    }
  });

  app.post("/api/admin/bulk/distribute-rewards", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await bulkOperationsService.bulkDistributeRewards(req.body, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error("Error executing bulk reward distribution:", error);
      res.status(500).json({ message: "Failed to execute bulk reward distribution" });
    }
  });

  app.post("/api/admin/bulk/campaign-distribution", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await bulkOperationsService.distributeCampaignPoints(req.body, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error("Error executing campaign distribution:", error);
      res.status(500).json({ message: "Failed to execute campaign distribution" });
    }
  });

  app.post("/api/admin/bulk/parse-csv", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { csvData } = req.body;
      const result = await bulkOperationsService.parseBulkAwardCSV(csvData);
      res.json(result);
    } catch (error) {
      console.error("Error parsing bulk CSV:", error);
      res.status(500).json({ message: "Failed to parse CSV data" });
    }
  });

  app.get("/api/admin/bulk/operations-history", async (req: any, res) => {
    try {
      if (req.session?.user?.privilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filters = {
        adminUserId: req.query.adminUserId,
        operationType: req.query.operationType,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await bulkOperationsService.getBulkOperationHistory(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching bulk operations history:", error);
      res.status(500).json({ message: "Failed to fetch operations history" });
    }
  });

  // Admin routes for Phase 2 features (SuperAdmin only)
  app.get("/api/admin/achievements", async (req: any, res) => {
    try {
      if (req.session?.user?.role !== "SuperAdmin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const achievements = await achievementService.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching all achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/admin/referrals", async (req: any, res) => {
    try {
      if (req.session?.user?.role !== "SuperAdmin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const referralActivity = await referralService.getAllReferralActivity(limit, offset);
      res.json(referralActivity);
    } catch (error) {
      console.error("Error fetching referral activity:", error);
      res.status(500).json({ message: "Failed to fetch referral activity" });
    }
  });

  app.get("/api/admin/notifications/stats", async (req: any, res) => {
    try {
      if (req.session?.user?.role !== "SuperAdmin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await notificationService.getNotificationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({ message: "Failed to fetch notification stats" });
    }
  });

  // Initialize services
  const analyticsService = new AnalyticsService();

  // ===== ANALYTICS ENDPOINTS =====
  
  // Admin Analytics Dashboard - Points Metrics
  app.get("/api/admin/analytics/points-metrics", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { from, to } = req.query;
      const dateRange = from && to ? { from: new Date(from), to: new Date(to) } : undefined;
      
      const metrics = await analyticsService.getPointsMetrics(dateRange);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching points metrics:", error);
      res.status(500).json({ message: "Failed to fetch points metrics" });
    }
  });

  // Admin Analytics Dashboard - Reward Popularity
  app.get("/api/admin/analytics/reward-popularity", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const popularity = await analyticsService.getRewardPopularity(limit);
      res.json(popularity);
    } catch (error) {
      console.error("Error fetching reward popularity:", error);
      res.status(500).json({ message: "Failed to fetch reward popularity" });
    }
  });

  // Admin Analytics Dashboard - Tier Distribution
  app.get("/api/admin/analytics/tier-distribution", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const distribution = await analyticsService.getTierDistribution();
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching tier distribution:", error);
      res.status(500).json({ message: "Failed to fetch tier distribution" });
    }
  });

  // Admin Analytics Dashboard - Points Trends
  app.get("/api/admin/analytics/points-trends", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const days = parseInt(req.query.days as string) || 30;
      const trends = await analyticsService.getPointsTrends(days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching points trends:", error);
      res.status(500).json({ message: "Failed to fetch points trends" });
    }
  });

  // Admin Analytics Dashboard - Redemption Funnel
  app.get("/api/admin/analytics/redemption-funnel", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const funnel = await analyticsService.getRedemptionFunnel();
      res.json(funnel);
    } catch (error) {
      console.error("Error fetching redemption funnel:", error);
      res.status(500).json({ message: "Failed to fetch redemption funnel" });
    }
  });

  // User Points Insights - Personal Analytics
  app.get("/api/user/insights", async (req: any, res) => {
    try {
      console.log("User insights request - session user:", req.session?.user);
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const insights = await analyticsService.getUserInsights(userId);
      if (!insights) {
        return res.status(404).json({ message: "User insights not found" });
      }

      res.json(insights);
    } catch (error) {
      console.error("Error fetching user insights:", error);
      res.status(500).json({ message: "Failed to fetch user insights" });
    }
  });

  // Combined Analytics Overview - For Admin Dashboard Summary
  app.get("/api/admin/analytics/overview", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const [metrics, popularRewards, tierDistribution, funnel] = await Promise.all([
        analyticsService.getPointsMetrics(),
        analyticsService.getRewardPopularity(5),
        analyticsService.getTierDistribution(),
        analyticsService.getRedemptionFunnel()
      ]);

      res.json({
        pointsMetrics: metrics,
        popularRewards,
        tierDistribution,
        redemptionFunnel: funnel
      });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // ===== END ANALYTICS ENDPOINTS =====

  // ===== PHASE 5: SEASONAL CAMPAIGNS ENDPOINTS =====

  // Admin - Create Seasonal Campaign
  app.post("/api/admin/seasonal-campaigns", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const campaign = await seasonalCampaignsService.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating seasonal campaign:", error);
      res.status(500).json({ message: "Failed to create seasonal campaign" });
    }
  });

  // Admin - Get All Seasonal Campaigns
  app.get("/api/admin/seasonal-campaigns", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const activeOnly = req.query.activeOnly === 'true';
      const campaigns = await seasonalCampaignsService.getCampaigns(activeOnly);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching seasonal campaigns:", error);
      res.status(500).json({ message: "Failed to fetch seasonal campaigns" });
    }
  });

  // Admin - Get Seasonal Campaign by ID
  app.get("/api/admin/seasonal-campaigns/:id", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const id = parseInt(req.params.id);
      const campaign = await seasonalCampaignsService.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching seasonal campaign:", error);
      res.status(500).json({ message: "Failed to fetch seasonal campaign" });
    }
  });

  // Admin - Update Seasonal Campaign
  app.put("/api/admin/seasonal-campaigns/:id", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const id = parseInt(req.params.id);
      const campaign = await seasonalCampaignsService.updateCampaign(id, req.body);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error updating seasonal campaign:", error);
      res.status(500).json({ message: "Failed to update seasonal campaign" });
    }
  });

  // Admin - Delete Seasonal Campaign
  app.delete("/api/admin/seasonal-campaigns/:id", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const id = parseInt(req.params.id);
      const deleted = await seasonalCampaignsService.deleteCampaign(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting seasonal campaign:", error);
      res.status(500).json({ message: "Failed to delete seasonal campaign" });
    }
  });

  // Admin - Activate/Deactivate Campaign
  app.post("/api/admin/seasonal-campaigns/:id/:action", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const id = parseInt(req.params.id);
      const action = req.params.action;
      
      let result;
      if (action === 'activate') {
        result = await seasonalCampaignsService.activateCampaign(id);
      } else if (action === 'deactivate') {
        result = await seasonalCampaignsService.deactivateCampaign(id);
      } else {
        return res.status(400).json({ message: "Invalid action. Use 'activate' or 'deactivate'" });
      }

      if (!result) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json({ message: `Campaign ${action}d successfully` });
    } catch (error) {
      console.error(`Error ${req.params.action}ing seasonal campaign:`, error);
      res.status(500).json({ message: `Failed to ${req.params.action} seasonal campaign` });
    }
  });

  // Admin - Get Campaign Analytics
  app.get("/api/admin/seasonal-campaigns/:id/analytics", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const id = parseInt(req.params.id);
      const analytics = await seasonalCampaignsService.getCampaignAnalytics(id);
      
      if (!analytics) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });

  // User - Get Active Campaigns
  app.get("/api/user/seasonal-campaigns/active", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const campaigns = await seasonalCampaignsService.getUserActiveCampaigns(req.session.user.id);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user active campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active campaigns" });
    }
  });

  // User - Join Campaign
  app.post("/api/user/seasonal-campaigns/:id/join", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      const participation = await seasonalCampaignsService.joinCampaign(req.session.user.id, campaignId);
      
      if (!participation) {
        return res.status(400).json({ message: "Unable to join campaign. Campaign may be inactive, full, or already joined." });
      }

      res.json(participation);
    } catch (error) {
      console.error("Error joining campaign:", error);
      res.status(500).json({ message: "Failed to join campaign" });
    }
  });

  // User - Get Campaign Participation
  app.get("/api/user/seasonal-campaigns/:id/participation", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const campaignId = parseInt(req.params.id);
      const participation = await seasonalCampaignsService.getUserCampaignParticipation(req.session.user.id, campaignId);
      
      if (!participation) {
        return res.status(404).json({ message: "No participation found for this campaign" });
      }

      res.json(participation);
    } catch (error) {
      console.error("Error fetching campaign participation:", error);
      res.status(500).json({ message: "Failed to fetch campaign participation" });
    }
  });

  // ===== END SEASONAL CAMPAIGNS ENDPOINTS =====

  // ===== PHASE 5.2: SOCIAL FEATURES ENDPOINTS =====

  // User - Update Leaderboard Settings
  app.put("/api/user/leaderboard/settings", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const settings = await socialFeaturesService.updateLeaderboardSettings(req.session.user.id, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating leaderboard settings:", error);
      res.status(500).json({ message: "Failed to update leaderboard settings" });
    }
  });

  // User - Get Leaderboard Settings
  app.get("/api/user/leaderboard/settings", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const settings = await socialFeaturesService.getLeaderboardSettings(req.session.user.id);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching leaderboard settings:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard settings" });
    }
  });

  // Public - Get Leaderboard
  app.get("/api/leaderboard", async (req: any, res) => {
    try {
      const period = req.query.period || 'Monthly';
      const category = req.query.category || 'Points';
      const limit = parseInt(req.query.limit) || 50;

      const leaderboard = await socialFeaturesService.getLeaderboard(period, category, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User - Share Achievement
  app.post("/api/user/achievements/share", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const shareData = { ...req.body, userId: req.session.user.id };
      const share = await socialFeaturesService.shareAchievement(shareData);
      res.status(201).json(share);
    } catch (error) {
      console.error("Error sharing achievement:", error);
      res.status(500).json({ message: "Failed to share achievement" });
    }
  });

  // User - Get Achievement Shares
  app.get("/api/user/achievements/shares", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.query.limit) || 20;
      const shares = await socialFeaturesService.getAchievementShares(req.session.user.id, limit);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching achievement shares:", error);
      res.status(500).json({ message: "Failed to fetch achievement shares" });
    }
  });

  // Public - Get Public Achievement Shares
  app.get("/api/achievements/shares/public", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const shares = await socialFeaturesService.getPublicAchievementShares(limit);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching public achievement shares:", error);
      res.status(500).json({ message: "Failed to fetch public achievement shares" });
    }
  });

  // User - Connect Social Media
  app.post("/api/user/social-media/connect", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const integrationData = { ...req.body, userId: req.session.user.id };
      const integration = await socialFeaturesService.connectSocialMedia(integrationData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error connecting social media:", error);
      res.status(500).json({ message: "Failed to connect social media" });
    }
  });

  // User - Get Social Media Integrations
  app.get("/api/user/social-media/integrations", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const integrations = await socialFeaturesService.getUserSocialIntegrations(req.session.user.id);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching social media integrations:", error);
      res.status(500).json({ message: "Failed to fetch social media integrations" });
    }
  });

  // User - Disconnect Social Media
  app.post("/api/user/social-media/:platform/disconnect", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const platform = req.params.platform;
      const success = await socialFeaturesService.disconnectSocialMedia(req.session.user.id, platform);
      
      if (!success) {
        return res.status(404).json({ message: "Social media connection not found" });
      }

      res.json({ message: "Social media disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting social media:", error);
      res.status(500).json({ message: "Failed to disconnect social media" });
    }
  });

  // User - Send Friend Request
  app.post("/api/user/friends/request", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { addresseeId, message } = req.body;
      const friendship = await socialFeaturesService.sendFriendRequest(req.session.user.id, addresseeId, message);
      
      if (!friendship) {
        return res.status(400).json({ message: "Friend request could not be sent. Relationship may already exist." });
      }

      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  // User - Respond to Friend Request
  app.post("/api/user/friends/respond", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { friendshipId, response } = req.body;
      const success = await socialFeaturesService.respondToFriendRequest(friendshipId, response);
      
      if (!success) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json({ message: `Friend request ${response.toLowerCase()} successfully` });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  // User - Get Friends
  app.get("/api/user/friends", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const friends = await socialFeaturesService.getUserFriends(req.session.user.id);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // User - Get Pending Friend Requests
  app.get("/api/user/friends/pending", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requests = await socialFeaturesService.getPendingFriendRequests(req.session.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending friend requests:", error);
      res.status(500).json({ message: "Failed to fetch pending friend requests" });
    }
  });

  // User - Create Social Referral
  app.post("/api/user/referrals/create", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { inviteMethod, platformUsed } = req.body;
      const referral = await socialFeaturesService.createSocialReferral(req.session.user.id, inviteMethod, platformUsed);
      res.status(201).json(referral);
    } catch (error) {
      console.error("Error creating social referral:", error);
      res.status(500).json({ message: "Failed to create social referral" });
    }
  });

  // User - Get User Referrals
  app.get("/api/user/referrals", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const referrals = await socialFeaturesService.getUserReferrals(req.session.user.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching user referrals:", error);
      res.status(500).json({ message: "Failed to fetch user referrals" });
    }
  });

  // Public - Complete Referral (for new user registration)
  app.post("/api/referrals/complete", async (req: any, res) => {
    try {
      const { referralCode, referredUserId } = req.body;
      const success = await socialFeaturesService.completeReferral(referralCode, referredUserId);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired referral code" });
      }

      res.json({ message: "Referral completed successfully" });
    } catch (error) {
      console.error("Error completing referral:", error);
      res.status(500).json({ message: "Failed to complete referral" });
    }
  });

  // User - Get Social Activity Feed
  app.get("/api/user/social/feed", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.query.limit) || 20;
      const feed = await socialFeaturesService.getSocialActivityFeed(req.session.user.id, limit);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching social activity feed:", error);
      res.status(500).json({ message: "Failed to fetch social activity feed" });
    }
  });

  // User - Like Social Activity
  app.post("/api/user/social/activity/:id/like", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const activityId = parseInt(req.params.id);
      const { reactionType } = req.body;
      const like = await socialFeaturesService.likeActivity(activityId, req.session.user.id, reactionType);
      res.json(like);
    } catch (error) {
      console.error("Error liking activity:", error);
      res.status(500).json({ message: "Failed to like activity" });
    }
  });

  // User - Add Comment to Social Activity
  app.post("/api/user/social/activity/:id/comment", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const activityId = parseInt(req.params.id);
      const { comment, parentCommentId } = req.body;
      const newComment = await socialFeaturesService.addComment(activityId, req.session.user.id, comment, parentCommentId);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Public - Get Activity Comments
  app.get("/api/social/activity/:id/comments", async (req: any, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const comments = await socialFeaturesService.getActivityComments(activityId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching activity comments:", error);
      res.status(500).json({ message: "Failed to fetch activity comments" });
    }
  });

  // ===== END SOCIAL FEATURES ENDPOINTS =====

  // ===== PHASE 5.3: ADVANCED REDEMPTION OPTIONS ENDPOINTS =====

  // User - Add to Wishlist
  app.post("/api/user/wishlist", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const wishlistItem = await advancedRedemptionService.addToWishlist(req.session.user.id, req.body);
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  // User - Get Wishlist
  app.get("/api/user/wishlist", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const wishlist = await advancedRedemptionService.getUserWishlist(req.session.user.id);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  // User - Remove from Wishlist
  app.delete("/api/user/wishlist/:rewardId", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const rewardId = parseInt(req.params.rewardId);
      const success = await advancedRedemptionService.removeFromWishlist(req.session.user.id, rewardId);
      
      if (!success) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }

      res.json({ message: "Removed from wishlist successfully" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // User - Update Wishlist Item
  app.put("/api/user/wishlist/:rewardId", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const rewardId = parseInt(req.params.rewardId);
      const updated = await advancedRedemptionService.updateWishlistItem(req.session.user.id, rewardId, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });

  // User - Initiate Partial Redemption
  app.post("/api/user/rewards/:id/partial-redeem", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const rewardId = parseInt(req.params.id);
      const { pointsToContribute } = req.body;
      
      const partialRedemption = await advancedRedemptionService.initiatePartialRedemption(
        req.session.user.id,
        rewardId,
        pointsToContribute
      );
      
      if (!partialRedemption) {
        return res.status(400).json({ message: "Unable to initiate partial redemption. Check reward availability and point balance." });
      }

      res.status(201).json(partialRedemption);
    } catch (error) {
      console.error("Error initiating partial redemption:", error);
      res.status(500).json({ message: "Failed to initiate partial redemption" });
    }
  });

  // User - Get Partial Redemptions
  app.get("/api/user/partial-redemptions", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const partialRedemptions = await advancedRedemptionService.getUserPartialRedemptions(req.session.user.id);
      res.json(partialRedemptions);
    } catch (error) {
      console.error("Error fetching partial redemptions:", error);
      res.status(500).json({ message: "Failed to fetch partial redemptions" });
    }
  });

  // User - Cancel Partial Redemption
  app.post("/api/user/partial-redemptions/:id/cancel", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const partialRedemptionId = parseInt(req.params.id);
      const success = await advancedRedemptionService.cancelPartialRedemption(req.session.user.id, partialRedemptionId);
      
      if (!success) {
        return res.status(404).json({ message: "Partial redemption not found or cannot be cancelled" });
      }

      res.json({ message: "Partial redemption cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling partial redemption:", error);
      res.status(500).json({ message: "Failed to cancel partial redemption" });
    }
  });

  // User - Get Reward Recommendations
  app.get("/api/user/recommendations", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.query.limit) || 10;
      const recommendations = await advancedRedemptionService.getUserRecommendations(req.session.user.id, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // User - Generate New Recommendations
  app.post("/api/user/recommendations/generate", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.body.limit) || 10;
      const recommendations = await advancedRedemptionService.generateRecommendations(req.session.user.id, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // User - Mark Recommendation Viewed
  app.post("/api/user/recommendations/:id/viewed", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const recommendationId = parseInt(req.params.id);
      await advancedRedemptionService.markRecommendationViewed(req.session.user.id, recommendationId);
      res.json({ message: "Recommendation marked as viewed" });
    } catch (error) {
      console.error("Error marking recommendation viewed:", error);
      res.status(500).json({ message: "Failed to mark recommendation viewed" });
    }
  });

  // User - Mark Recommendation Clicked
  app.post("/api/user/recommendations/:id/clicked", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const recommendationId = parseInt(req.params.id);
      await advancedRedemptionService.markRecommendationClicked(req.session.user.id, recommendationId);
      res.json({ message: "Recommendation marked as clicked" });
    } catch (error) {
      console.error("Error marking recommendation clicked:", error);
      res.status(500).json({ message: "Failed to mark recommendation clicked" });
    }
  });

  // User - Track Reward Interaction
  app.post("/api/user/rewards/:id/interact", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const rewardId = parseInt(req.params.id);
      const { interactionType, metadata } = req.body;
      
      const interaction = await advancedRedemptionService.trackRewardInteraction(
        req.session.user.id,
        rewardId,
        interactionType,
        metadata
      );
      
      res.json(interaction);
    } catch (error) {
      console.error("Error tracking reward interaction:", error);
      res.status(500).json({ message: "Failed to track reward interaction" });
    }
  });

  // User - Get Reward Interactions
  app.get("/api/user/rewards/:id/interactions", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const rewardId = parseInt(req.params.id);
      const interactions = await advancedRedemptionService.getUserRewardInteractions(req.session.user.id, rewardId);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching reward interactions:", error);
      res.status(500).json({ message: "Failed to fetch reward interactions" });
    }
  });

  // User - Get Reward Notifications
  app.get("/api/user/notifications", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const notifications = await advancedRedemptionService.getUserNotifications(req.session.user.id, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // User - Mark Notification Read
  app.post("/api/user/notifications/:id/read", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const notificationId = parseInt(req.params.id);
      const success = await advancedRedemptionService.markNotificationRead(req.session.user.id, notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  // Admin - Update Reward Pricing
  app.post("/api/admin/rewards/:id/pricing", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const rewardId = parseInt(req.params.id);
      const { demandLevel } = req.body;
      
      await advancedRedemptionService.updateRewardPricing(rewardId, demandLevel);
      res.json({ message: "Reward pricing updated successfully" });
    } catch (error) {
      console.error("Error updating reward pricing:", error);
      res.status(500).json({ message: "Failed to update reward pricing" });
    }
  });

  // Admin - Get Reward Pricing History
  app.get("/api/admin/rewards/:id/pricing-history", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const rewardId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 30;
      
      const history = await advancedRedemptionService.getRewardPricingHistory(rewardId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching pricing history:", error);
      res.status(500).json({ message: "Failed to fetch pricing history" });
    }
  });

  // Admin - Update Reward Inventory
  app.post("/api/admin/rewards/:id/inventory", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const rewardId = parseInt(req.params.id);
      const inventory = await advancedRedemptionService.updateRewardInventory(rewardId, req.body);
      res.json(inventory);
    } catch (error) {
      console.error("Error updating reward inventory:", error);
      res.status(500).json({ message: "Failed to update reward inventory" });
    }
  });

  // Admin - Check Inventory Availability
  app.get("/api/admin/rewards/:id/inventory/check", async (req: any, res) => {
    try {
      const userPrivilegeLevel = getPrivilegeLevelForRole(req.session?.user?.role || "Visitor");
      if (userPrivilegeLevel > 1) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const rewardId = parseInt(req.params.id);
      const quantity = parseInt(req.query.quantity) || 1;
      
      const available = await advancedRedemptionService.checkInventoryAvailability(rewardId, quantity);
      res.json({ available, rewardId, quantity });
    } catch (error) {
      console.error("Error checking inventory availability:", error);
      res.status(500).json({ message: "Failed to check inventory availability" });
    }
  });

  // ===== END ADVANCED REDEMPTION OPTIONS ENDPOINTS =====

  // Seeding endpoint (for development only)
  app.post("/api/seed-users", async (req: any, res) => {
    try {
      console.log("Starting user seeding...");

      // Import seeding function dynamically
      const { seedUsers } = await import("./seed-users");
      await seedUsers();

      res.json({ message: "Users seeded successfully!" });
    } catch (error) {
      console.error("Error seeding users:", error);
      res
        .status(500)
        .json({ message: "Failed to seed users", error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time quote updates
  initializeQuoteWebSocket(httpServer);

  return httpServer;
}
