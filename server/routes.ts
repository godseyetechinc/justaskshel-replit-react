import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
      const { email, password, firstName, lastName, phone, role } =
        validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
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
        },
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
      const validatedData = insertPolicySchema.parse({
        ...req.body,
        userId,
      });
      const policy = await storage.createPolicy(validatedData);
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

  // Applications routes
  app.get("/api/applications", auth, async (req: any, res) => {
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

  app.post("/api/applications", auth, async (req: any, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ message: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", auth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(
        parseInt(id),
        applicationData,
      );
      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(400).json({ message: "Failed to update application" });
    }
  });

  app.delete("/api/applications/:id", auth, async (req: any, res) => {
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

      // Only LandlordAdmin can access their organization profile
      if (user.privilegeLevel !== 1) {
        return res
          .status(403)
          .json({ message: "Access denied. LandlordAdmin role required." });
      }

      if (!user.organizationId) {
        return res
          .status(404)
          .json({ message: "No organization assigned to this user." });
      }

      const organization = await storage.getOrganizationById(
        user.organizationId,
      );
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

      // Only LandlordAdmin can update their organization profile
      if (user.privilegeLevel !== 1) {
        return res
          .status(403)
          .json({ message: "Access denied. LandlordAdmin role required." });
      }

      if (!user.organizationId) {
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
        user.organizationId,
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

  // Get agent information for current member
  app.get("/api/my-agent", auth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);

      if (!currentUser || !currentUser.organizationId) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      // Only members can access this endpoint
      if ((currentUser.privilegeLevel || 5) !== 3) {
        return res
          .status(403)
          .json({ message: "This endpoint is only available for members" });
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
