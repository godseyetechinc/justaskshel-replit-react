import { ProviderApiClient } from "./insuranceApiClient";
import { 
  ProviderConfig, 
  OrganizationProviderConfig, 
  INSURANCE_PROVIDERS,
  QuoteRequest,
  QuoteResponse 
} from "./insuranceProviderConfig";

// Circuit breaker states
enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open", 
  HALF_OPEN = "half-open"
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.failureCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export class ProviderOrchestrator {
  private providers: Map<string, ProviderApiClient> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private organizationProviderConfigs: Map<string, OrganizationProviderConfig[]> = new Map();
  private quotesCache: Map<string, { quotes: QuoteResponse[], timestamp: number, ttl: number }> = new Map();

  constructor() {
    this.initializeProviders();
    this.startHealthChecking();
  }

  private initializeProviders() {
    INSURANCE_PROVIDERS.forEach(config => {
      if (config.isActive) {
        const client = new ProviderApiClient(config);
        this.providers.set(config.id, client);
        
        // Initialize circuit breaker for each provider
        const circuitBreakerConfig: CircuitBreakerConfig = {
          failureThreshold: 5,
          recoveryTimeout: 30000, // 30 seconds
          monitoringPeriod: 60000  // 1 minute
        };
        this.circuitBreakers.set(config.id, new CircuitBreaker(circuitBreakerConfig));
      }
    });
  }

  private startHealthChecking() {
    // Health check every 2 minutes
    setInterval(() => {
      this.performHealthChecks();
    }, 120000);
  }

  private async performHealthChecks() {
    for (const [providerId, client] of Array.from(this.providers.entries())) {
      try {
        const circuitBreaker = this.circuitBreakers.get(providerId);
        if (circuitBreaker && circuitBreaker.getState() !== CircuitBreakerState.OPEN) {
          // Simple health check with minimal quote request
          const healthCheckRequest: QuoteRequest = {
            coverageType: "life",
            applicantAge: 30,
            zipCode: "10001",
            coverageAmount: 100000,
            paymentFrequency: "monthly"
          };
          
          await circuitBreaker.execute(async () => {
            // Short timeout for health checks
            const startTime = Date.now();
            await client.getQuotes(healthCheckRequest);
            const responseTime = Date.now() - startTime;
            
            // Update provider health metrics
            this.updateProviderHealth(providerId, responseTime, true);
          });
        }
      } catch (error) {
        this.updateProviderHealth(providerId, 0, false);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Health check failed for provider ${providerId}:`, errorMessage);
      }
    }
  }

  private updateProviderHealth(providerId: string, responseTime: number, success: boolean) {
    // Find provider config and update health metrics
    const providerConfig = INSURANCE_PROVIDERS.find(p => p.id === providerId);
    if (providerConfig) {
      // Cast to OrganizationProviderConfig to add health metrics
      const orgConfig = providerConfig as OrganizationProviderConfig;
      orgConfig.lastHealthCheck = new Date();
      
      if (success) {
        orgConfig.successCount = (orgConfig.successCount || 0) + 1;
        // Calculate health score based on success rate and response time
        const totalRequests = (orgConfig.successCount || 0) + (orgConfig.errorCount || 0);
        const successRate = (orgConfig.successCount || 0) / totalRequests;
        const responseTimeScore = Math.max(0, 100 - (responseTime / 100)); // Penalize slow responses
        orgConfig.healthScore = Math.round((successRate * 70) + (responseTimeScore * 0.3));
      } else {
        orgConfig.errorCount = (orgConfig.errorCount || 0) + 1;
        const totalRequests = (orgConfig.successCount || 0) + (orgConfig.errorCount || 0);
        const successRate = (orgConfig.successCount || 0) / totalRequests;
        orgConfig.healthScore = Math.round(successRate * 70); // Lower score for failures
      }
    }
  }

  async getQuotesForOrganization(
    request: QuoteRequest, 
    organizationId?: number,
    userRole?: string,
    requestHeaders?: Record<string, string>
  ): Promise<{
    quotes: QuoteResponse[];
    providers: {
      total: number;
      successful: number;
      failed: number;
      errors: string[];
    };
    requestId: string;
    cached: boolean;
  }> {
    const requestId = this.generateRequestId();/*
    const cacheKey = this.generateCacheKey(request, organizationId);
    
    // Check cache first
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return {
        quotes: cached.quotes,
        providers: { total: 0, successful: 0, failed: 0, errors: [] },
        requestId,
        cached: true
      };
    }
    */

    // Get organization-specific provider configurations
    const organizationProviders = this.getOrganizationProviders(organizationId, request.coverageType);
    
    const results = await Promise.allSettled(
      organizationProviders.map(async (config) => {
        const provider = this.providers.get(config.id);
        const circuitBreaker = this.circuitBreakers.get(config.id);
        
        if (!provider || !circuitBreaker) {
          throw new Error(`Provider ${config.id} not available`);
        }

        return await circuitBreaker.execute(async () => {
          // Pass organization-specific and request-level custom headers
          const organizationHeaders = config.organizationOverrides?.customHeaders;
          const quotes = await provider.getQuotes(request, organizationHeaders, requestHeaders);
          
          // Add organization-specific metadata
          return quotes.map(quote => ({
            ...quote,
            metadata: {
              ...quote.metadata,
              organizationId,
              providerId: config.id,
              priority: config.organizationOverrides?.priority || config.priority,
              commissionRate: config.organizationOverrides?.commissionRate || 0,
              responseTimestamp: new Date().toISOString()
            }
          }));
        });
      })
    );

    // Process results
    const allQuotes: QuoteResponse[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allQuotes.push(...result.value);
        successful++;
      } else {
        failed++;
        const providerName = organizationProviders[index]?.displayName || 'Unknown';
        errors.push(`${providerName}: ${result.reason.message}`);
      }
    });

    // Sort quotes by organization priority and price
    const sortedQuotes = this.sortQuotesByOrganizationPreferences(allQuotes, organizationId);

    // Cache results with organization-specific TTL (disabled for now)
    // const ttl = this.getOrganizationCacheTTL(organizationId);
    // this.cacheResults(cacheKey, sortedQuotes, ttl);

    return {
      quotes: sortedQuotes,
      providers: {
        total: organizationProviders.length,
        successful,
        failed,
        errors
      },
      requestId,
      cached: false
    };
  }

  private getOrganizationProviders(organizationId?: number, coverageType?: string): OrganizationProviderConfig[] {
    // Normalize coverage type to canonical format
    const normalizedCoverageType = this.normalizeCoverageType(coverageType);
    
    let providers = INSURANCE_PROVIDERS.filter(p => {
      const isActive = p.isActive;
      const supportsType = !normalizedCoverageType || p.supportedCoverageTypes.includes(normalizedCoverageType);
      return isActive && supportsType;
    });

    // Apply organization-specific overrides if available
    if (organizationId) {
      const orgProviders = this.organizationProviderConfigs.get(organizationId.toString());
      if (orgProviders) {
        providers = providers.map(baseProvider => {
          const orgOverride = orgProviders.find(op => op.id === baseProvider.id);
          if (orgOverride && orgOverride.organizationOverrides) {
            return {
              ...baseProvider,
              ...orgOverride.organizationOverrides,
              organizationId,
              organizationOverrides: orgOverride.organizationOverrides
            } as OrganizationProviderConfig;
          }
          return baseProvider as OrganizationProviderConfig;
        });
      }
    }

    // Sort by priority (lower numbers = higher priority)
    return providers.sort((a, b) => {
      const priorityA = (a as OrganizationProviderConfig).organizationOverrides?.priority || a.priority;
      const priorityB = (b as OrganizationProviderConfig).organizationOverrides?.priority || b.priority;
      return priorityA - priorityB;
    });
  }

  private sortQuotesByOrganizationPreferences(quotes: QuoteResponse[], organizationId?: number): QuoteResponse[] {
    return quotes.sort((a, b) => {
      // First sort by provider priority
      const priorityA = a.metadata?.priority || 999;
      const priorityB = b.metadata?.priority || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then sort by monthly premium (ascending)
      return a.monthlyPremium - b.monthlyPremium;
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeCoverageType(coverageType?: string): string | undefined {
    if (!coverageType) return undefined;
    
    // Coverage type mapping from display names to canonical keys
    const coverageTypeMapping: Record<string, string> = {
      'life insurance': 'life',
      'health insurance': 'health',
      'dental insurance': 'dental', 
      'vision insurance': 'vision',
      'hospital indemnity insurance': 'hospital_indemnity',
      'disability insurance': 'disability',
      'term life': 'life',
      'whole life': 'life',
      'medical': 'health'
    };
    
    const normalized = coverageTypeMapping[coverageType.toLowerCase()] || coverageType.toLowerCase();
    return normalized;
  }

  private generateCacheKey(request: QuoteRequest, organizationId?: number): string {
    const keyData = {
      coverageType: request.coverageType,
      applicantAge: request.applicantAge,
      zipCode: request.zipCode,
      coverageAmount: request.coverageAmount,
      termLength: request.termLength,
      organizationId: organizationId || 'default'
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private checkCache(cacheKey: string) {
    const cached = this.quotesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached;
    }
    
    // Clean expired cache entry
    if (cached) {
      this.quotesCache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResults(cacheKey: string, quotes: QuoteResponse[], ttl: number) {
    this.quotesCache.set(cacheKey, {
      quotes,
      timestamp: Date.now(),
      ttl
    });
  }

  private getOrganizationCacheTTL(organizationId?: number): number {
    // Default cache TTL: 5 minutes
    // Organization-specific TTL could be configured here
    return 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Organization provider configuration management
  setOrganizationProviderConfig(organizationId: number, configs: OrganizationProviderConfig[]) {
    this.organizationProviderConfigs.set(organizationId.toString(), configs);
  }

  getOrganizationProviderConfig(organizationId: number): OrganizationProviderConfig[] {
    return this.organizationProviderConfigs.get(organizationId.toString()) || [];
  }

  // Provider health and circuit breaker status
  getProviderHealth(): { [providerId: string]: any } {
    const health: { [providerId: string]: any } = {};
    
    INSURANCE_PROVIDERS.forEach(provider => {
      const circuitBreaker = this.circuitBreakers.get(provider.id);
      const orgConfig = provider as OrganizationProviderConfig;
      
      health[provider.id] = {
        displayName: provider.displayName,
        isActive: provider.isActive,
        circuitBreakerState: circuitBreaker?.getState(),
        circuitBreakerStats: circuitBreaker?.getStats(),
        healthScore: orgConfig.healthScore || 0,
        lastHealthCheck: orgConfig.lastHealthCheck,
        successCount: orgConfig.successCount || 0,
        errorCount: orgConfig.errorCount || 0
      };
    });
    
    return health;
  }

  // Clear cache for organization or globally
  clearCache(organizationId?: number) {
    if (organizationId) {
      // Clear only organization-specific cache entries
      const orgIdStr = organizationId.toString();
      for (const [key, value] of Array.from(this.quotesCache.entries())) {
        if (key.includes(orgIdStr)) {
          this.quotesCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.quotesCache.clear();
    }
  }
}

// Singleton instance
export const providerOrchestrator = new ProviderOrchestrator();