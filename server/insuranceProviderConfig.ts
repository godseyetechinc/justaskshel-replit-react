import { z } from "zod";

// Base provider configuration interface
export interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  authHeader?: string;
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  timeout: number; // milliseconds
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  supportedCoverageTypes: string[];
  isActive: boolean;
  priority: number; // Lower numbers = higher priority
  mockMode?: boolean; // For testing/demo purposes
}

// Enhanced multi-tenant provider configuration
export interface OrganizationProviderConfig extends ProviderConfig {
  organizationId?: number;
  organizationOverrides?: {
    priority?: number;
    isActive?: boolean;
    commissionRate?: number;
    customDisplayName?: string;
    timeout?: number;
    rateLimit?: {
      requestsPerSecond: number;
      burstLimit: number;
    };
  };
  lastHealthCheck?: Date;
  healthScore?: number; // 0-100 score
  errorCount?: number;
  successCount?: number;
}

// Request/Response schemas for quote requests
export const QuoteRequestSchema = z.object({
  coverageType: z.string(),
  applicantAge: z.number().min(18).max(100),
  zipCode: z.string().regex(/^\d{5}$/),
  coverageAmount: z.number().positive(),
  termLength: z.number().optional(),
  paymentFrequency: z
    .enum(["monthly", "quarterly", "semi-annually", "annually"])
    .optional(),
  effectiveDate: z.string().optional(),
  spouse: z
    .object({
      age: z.number().min(18).max(100),
    })
    .optional(),
  children: z
    .array(
      z.object({
        age: z.number().min(0).max(25),
      }),
    )
    .optional(),
  healthInfo: z
    .object({
      smoker: z.boolean().optional(),
      medicalConditions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const QuoteResponseSchema = z.object({
  quoteId: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  monthlyPremium: z.number(),
  annualPremium: z.number(),
  coverageAmount: z.number(),
  deductible: z.number().optional(),
  termLength: z.number().optional(),
  features: z.array(z.string()),
  rating: z.number().min(1).max(5).optional(),
  medicalExamRequired: z.boolean(),
  conversionOption: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string(),
  applicationUrl: z.string().optional(),
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

// Provider-specific configurations
export const INSURANCE_PROVIDERS: ProviderConfig[] = [
  {
    id: "jas_assure",
    name: "jas_assure",
    displayName: "JAS",
    baseUrl:
      process.env.JASASSURE_API_URL ||
      "http://api1.justaskshel.com:8700/web-api/v1",
    apiKey: process.env.JASASSURE_API_KEY,
    authHeader: "X-API-Key",
    rateLimit: {
      requestsPerSecond: 10,
      burstLimit: 50,
    },
    timeout: 8000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
    },
    supportedCoverageTypes: ["life"],
    isActive: true,
    priority: 1,
    mockMode: !process.env.JASASSURE_API_KEY,
  },

  // ------------------
  {
    id: "life_secure",
    name: "life_secure",
    displayName: "LifeSecure Insurance",
    baseUrl: process.env.LIFESECURE_API_URL || "https://api.lifesecure.com/v1",
    apiKey: process.env.LIFESECURE_API_KEY,
    authHeader: "X-API-Key",
    rateLimit: {
      requestsPerSecond: 10,
      burstLimit: 50,
    },
    timeout: 8000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
    },
    supportedCoverageTypes: ["life", "term_life", "whole_life"],
    isActive: true,
    priority: 1,
    mockMode: !process.env.LIFESECURE_API_KEY,
  },
  {
    id: "health_plus",
    name: "health_plus",
    displayName: "HealthPlus Coverage",
    baseUrl:
      process.env.HEALTHPLUS_API_URL || "https://api.healthplus.com/quotes",
    apiKey: process.env.HEALTHPLUS_API_KEY,
    authHeader: "Authorization",
    rateLimit: {
      requestsPerSecond: 5,
      burstLimit: 25,
    },
    timeout: 10000,
    retryConfig: {
      maxRetries: 2,
      backoffMultiplier: 1.5,
      initialDelay: 800,
    },
    supportedCoverageTypes: ["health", "medical", "hospital_indemnity"],
    isActive: true,
    priority: 2,
    mockMode: !process.env.HEALTHPLUS_API_KEY,
  },
  {
    id: "dental_care",
    name: "dental_care",
    displayName: "DentalCare Pro",
    baseUrl: process.env.DENTALCARE_API_URL || "https://api.dentalcare.com/v2",
    apiKey: process.env.DENTALCARE_API_KEY,
    authHeader: "X-Auth-Token",
    rateLimit: {
      requestsPerSecond: 8,
      burstLimit: 40,
    },
    timeout: 6000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 500,
    },
    supportedCoverageTypes: ["dental", "orthodontic"],
    isActive: true,
    priority: 3,
    mockMode: !process.env.DENTALCARE_API_KEY,
  },
  {
    id: "vision_first",
    name: "vision_first",
    displayName: "VisionFirst Insurance",
    baseUrl:
      process.env.VISIONFIRST_API_URL || "https://api.visionfirst.com/quotes",
    apiKey: process.env.VISIONFIRST_API_KEY,
    authHeader: "Bearer",
    rateLimit: {
      requestsPerSecond: 12,
      burstLimit: 60,
    },
    timeout: 5000,
    retryConfig: {
      maxRetries: 2,
      backoffMultiplier: 1.8,
      initialDelay: 600,
    },
    supportedCoverageTypes: ["vision", "eye_care"],
    isActive: true,
    priority: 4,
    mockMode: !process.env.VISIONFIRST_API_KEY,
  },
  {
    id: "family_shield",
    name: "family_shield",
    displayName: "FamilyShield Insurance",
    baseUrl:
      process.env.FAMILYSHIELD_API_URL ||
      "https://api.familyshield.com/v1/quotes",
    apiKey: process.env.FAMILYSHIELD_API_KEY,
    authHeader: "X-Client-Key",
    rateLimit: {
      requestsPerSecond: 6,
      burstLimit: 30,
    },
    timeout: 9000,
    retryConfig: {
      maxRetries: 4,
      backoffMultiplier: 2.5,
      initialDelay: 1200,
    },
    supportedCoverageTypes: [
      "life",
      "health",
      "dental",
      "vision",
      "disability",
    ],
    isActive: true,
    priority: 5,
    mockMode: !process.env.FAMILYSHIELD_API_KEY,
  },
];

// Helper functions
export function getActiveProviders(): ProviderConfig[] {
  return INSURANCE_PROVIDERS.filter((provider) => provider.isActive);
}

export function getAllProviders(): ProviderConfig[] {
  return INSURANCE_PROVIDERS;
}

export function getProvidersForCoverage(
  coverageType: string,
): ProviderConfig[] {
  return getActiveProviders()
    .filter(
      (provider) =>
        provider.supportedCoverageTypes.includes(coverageType.toLowerCase()) ||
        provider.supportedCoverageTypes.includes("all"),
    )
    .sort((a, b) => a.priority - b.priority);
}

export function getProviderById(id: string): ProviderConfig | undefined {
  return INSURANCE_PROVIDERS.find((provider) => provider.id === id);
}

// Validation schema for provider configuration updates
export const UpdateProviderConfigSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  authHeader: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().min(1).max(100).optional(),
  mockMode: z.boolean().optional(),
  supportedCoverageTypes: z.array(z.string()).optional(),
  rateLimit: z
    .object({
      requestsPerSecond: z.number().positive(),
      burstLimit: z.number().positive(),
    })
    .optional(),
  timeout: z.number().positive().optional(),
  retryConfig: z
    .object({
      maxRetries: z.number().min(0).max(10),
      backoffMultiplier: z.number().positive(),
      initialDelay: z.number().positive(),
    })
    .optional(),
});

export type UpdateProviderConfig = z.infer<typeof UpdateProviderConfigSchema>;

// Provider management functions
export function updateProvider(
  id: string,
  updates: UpdateProviderConfig,
): ProviderConfig | null {
  const providerIndex = INSURANCE_PROVIDERS.findIndex((p) => p.id === id);
  if (providerIndex === -1) return null;

  const provider = INSURANCE_PROVIDERS[providerIndex];
  const updatedProvider = {
    ...provider,
    ...updates,
    rateLimit: updates.rateLimit
      ? { ...provider.rateLimit, ...updates.rateLimit }
      : provider.rateLimit,
    retryConfig: updates.retryConfig
      ? { ...provider.retryConfig, ...updates.retryConfig }
      : provider.retryConfig,
  };

  INSURANCE_PROVIDERS[providerIndex] = updatedProvider;
  return updatedProvider;
}

export function testProviderConnection(
  provider: ProviderConfig,
): Promise<{ success: boolean; responseTime?: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

    fetch(`${provider.baseUrl}/health`, {
      method: "GET",
      headers: provider.apiKey
        ? {
            [provider.authHeader || "Authorization"]:
              `${provider.authHeader === "Bearer" ? "Bearer " : ""}${provider.apiKey}`,
          }
        : {},
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        resolve({
          success: response.ok,
          responseTime,
          error: !response.ok ? `HTTP ${response.status}` : undefined,
        });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error.name === "AbortError" ? "Timeout" : error.message,
        });
      });
  });
}

// Coverage type mapping for provider APIs
export const COVERAGE_TYPE_MAPPING: Record<string, Record<string, string>> = {
  life_secure: {
    "Life Insurance": "term_life",
    life: "term_life",
    whole_life: "whole_life",
  },
  health_plus: {
    "Health Insurance": "medical",
    health: "medical",
    "Hospital Indemnity Insurance": "hospital_indemnity",
  },
  dental_care: {
    "Dental Insurance": "dental",
    dental: "dental",
  },
  vision_first: {
    "Vision Insurance": "vision",
    vision: "vision",
  },
  family_shield: {
    "Life Insurance": "life",
    "Health Insurance": "health",
    "Dental Insurance": "dental",
    "Vision Insurance": "vision",
  },
};

export function mapCoverageTypeForProvider(
  providerId: string,
  coverageType: string,
): string {
  const mapping = COVERAGE_TYPE_MAPPING[providerId];
  return mapping?.[coverageType] || coverageType.toLowerCase();
}
