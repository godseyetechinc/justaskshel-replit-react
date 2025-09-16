import {
  ProviderConfig,
  QuoteRequest,
  QuoteResponse,
  QuoteRequestSchema,
  QuoteResponseSchema,
  getProvidersForCoverage,
  getActiveProviders,
  mapCoverageTypeForProvider,
} from "./insuranceProviderConfig";

// Rate limiting utility
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(requestsPerSecond: number, burstLimit: number) {
    this.maxTokens = burstLimit;
    this.refillRate = requestsPerSecond;
    this.tokens = burstLimit;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Provider-specific API clients
export class ProviderApiClient {
  private rateLimiter: RateLimiter;

  constructor(private config: ProviderConfig) {
    this.rateLimiter = new RateLimiter(
      config.rateLimit.requestsPerSecond,
      config.rateLimit.burstLimit,
    );
  }

  async getQuotes(request: QuoteRequest): Promise<QuoteResponse[]> {
    if (this.config.mockMode) {
      return this.getMockQuotes(request);
    }

    await this.rateLimiter.acquire();
    return this.makeApiRequest(request);
  }

  private async makeApiRequest(
    request: QuoteRequest,
  ): Promise<QuoteResponse[]> {
    const { maxRetries, backoffMultiplier, initialDelay } =
      this.config.retryConfig;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(request);
        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private async executeRequest(
    request: QuoteRequest,
  ): Promise<QuoteResponse[]> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "JustAskShel/1.0",
    };

    if (this.config.apiKey && this.config.authHeader) {
      if (this.config.authHeader === "Bearer") {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      } else {
        headers[this.config.authHeader] = this.config.apiKey;
      }
    }

    const mappedCoverageType = mapCoverageTypeForProvider(
      this.config.id,
      request.coverageType,
    );
    const providerRequest = this.transformRequestForProvider(
      request,
      mappedCoverageType,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/quotes`, {
        method: "POST",
        headers,
        body: JSON.stringify(providerRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Provider ${this.config.name} returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      //if (this.config.id == "jas_assure")
      //  throw new Error(await response.json());

      return this.transformResponseFromProvider(data);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Provider ${this.config.name} request timed out after ${this.config.timeout}ms`,
        );
      }
      throw error;
    }
  }

  private transformRequestForProvider(
    request: QuoteRequest,
    coverageType: string,
  ): any {
    // Transform the normalized request to provider-specific format
    const baseRequest = {
      coverage_type: coverageType,
      applicant: {
        age: request.applicantAge,
        zip_code: request.zipCode,
      },
      coverage: {
        amount: request.coverageAmount,
        term_length: request.termLength,
        payment_frequency: request.paymentFrequency,
      },
      effective_date: request.effectiveDate,
    };

    // Add spouse and children if present
    if (request.spouse) {
      baseRequest.applicant.spouse = { age: request.spouse.age };
    }

    if (request.children && request.children.length > 0) {
      baseRequest.applicant.children = request.children.map((child) => ({
        age: child.age,
      }));
    }

    // Provider-specific transformations
    switch (this.config.id) {
      case "jas_assure":
        // https://transform.tools/json-to-typescript
        /*
        {
          "isLifeInsuranceRequest": true,
          "subCategoryFilter": [
            "string"
          ],
          "quoteCriteria": {
            "quoteSearchId": 0,
            "coverage": 0,
            "coverageAmount": 1000000,
            "state": "FL",
            "zipCode": "33073",
            "county": "Broward",
            "applicant": {
              "dateOfBirth": "1999-03-17",
              "gender": "M",
              "healthClass": "good",
              "tobacco": true,
              "heightInInches": 69,
              "weight": 175,
              "ignore": true
            },
            "paymentMode": "string",
            "effectiveDate": "2024-03-17",
            "quoteSource": "string",
            "termLength": 0,
            "includeWaiverPremium": true,
            "multiTermQuote": true
          }
        }
        */
        return {
          isLifeInsuranceRequest: true,
          subCategoryFilter: [],
          quoteCriteria: {
            quoteSearchId: 0,
            coverage: 0,
            coverageAmount: 1000000,
            state: "FL",
            zipCode: "33073",
            county: "Broward",
            applicant: {
              dateOfBirth: "1999-03-17",
              gender: "M",
              healthClass: "good",
              tobacco: true,
              heightInInches: 69,
              weight: 175,
              ignore: true,
            },
            paymentMode: "string",
            effectiveDate: "2024-03-17",
            quoteSource: "string",
            termLength: 0,
            includeWaiverPremium: true,
            multiTermQuote: true,
          },
        };

      case "life_secure":
        return {
          ...baseRequest,
          product_type: coverageType,
          client_info: baseRequest.applicant,
          coverage_details: baseRequest.coverage,
        };

      case "health_plus":
        return {
          ...baseRequest,
          plan_type: coverageType,
          member_info: baseRequest.applicant,
          benefit_details: baseRequest.coverage,
        };

      case "dental_care":
        return {
          ...baseRequest,
          service_type: coverageType,
          patient_info: baseRequest.applicant,
          plan_options: baseRequest.coverage,
        };

      case "vision_first":
        return {
          ...baseRequest,
          vision_plan: coverageType,
          subscriber: baseRequest.applicant,
          benefits: baseRequest.coverage,
        };

      default:
        return baseRequest;
    }
  }

  private transformResponseFromProvider(data: any): QuoteResponse[] {
    // Handle different provider response formats
    let quotes: any[] = [];

    if (Array.isArray(data)) {
      quotes = data;
    } else if (data.quotes && Array.isArray(data.quotes)) {
      quotes = data.quotes;
    } else if (data.results && Array.isArray(data.results)) {
      quotes = data.results;
    } else if (data.plans && Array.isArray(data.plans)) {
      quotes = data.plans;
    } else if (data.Data && Array.isArray(data.Data)) {
      let jasQuotes: any[] = data.Data;
      let responses: QuoteResponse[] = [];

      for (let quoteGroup in jasQuotes) {
        responses.push(...this.normalizeJASQuoteGroup(quoteGroup));
      }
      return responses;
    } else {
      quotes = [data];
    }

    return quotes.map((quote) => this.normalizeQuote(quote));
  }

  private normalizeJASQuoteGroup(quoteGroup: any): QuoteResponse[] {
    return quoteGroup.items.map((quote: any) => this.normalizeJASQuote(quote));
  }

  private normalizeJASQuote(quote: any): QuoteResponse {
    // Normalize different provider response formats to our standard format
    const normalized: QuoteResponse = {
      quoteId:
        quote.id ||
        quote.quote_id ||
        quote.quoteId ||
        `${this.config.id}_${Date.now()}_${Math.random()}`,
      providerId: this.config.id,
      providerName: this.config.displayName,
      monthlyPremium: this.extractJASMonthlyPremium(quote),
      annualPremium: this.extractJASAnnualPremium(quote),
      coverageAmount:
        quote.coverage_amount ||
        quote.coverageAmount ||
        quote.benefit_amount ||
        0,
      deductible: quote.deductible || quote.deductible_amount || 0,
      termLength:
        quote.term_length || quote.termLength || quote.term || undefined,
      features: this.extractJASFeatures(quote),
      rating: quote.rating || quote.provider_rating || quote.score || undefined,
      medicalExamRequired:
        quote.medical_exam_required ||
        quote.medicalExam ||
        quote.exam_required ||
        false,
      conversionOption: quote.conversion_option || quote.convertible || false,
      metadata: {
        providerId: this.config.id,
        originalResponse: quote,
        responseTimestamp: new Date().toISOString(),
      },
      expiresAt:
        quote.expires_at ||
        quote.expirationDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      applicationUrl: quote.application_url || quote.applyUrl || undefined,
    };

    return normalized;
  }

  private normalizeQuote(quote: any): QuoteResponse {
    // Normalize different provider response formats to our standard format
    const normalized: QuoteResponse = {
      quoteId:
        quote.id ||
        quote.quote_id ||
        quote.quoteId ||
        `${this.config.id}_${Date.now()}_${Math.random()}`,
      providerId: this.config.id,
      providerName: this.config.displayName,
      monthlyPremium: this.extractMonthlyPremium(quote),
      annualPremium: this.extractAnnualPremium(quote),
      coverageAmount:
        quote.coverage_amount ||
        quote.coverageAmount ||
        quote.benefit_amount ||
        0,
      deductible: quote.deductible || quote.deductible_amount || 0,
      termLength:
        quote.term_length || quote.termLength || quote.term || undefined,
      features: this.extractFeatures(quote),
      rating: quote.rating || quote.provider_rating || quote.score || undefined,
      medicalExamRequired:
        quote.medical_exam_required ||
        quote.medicalExam ||
        quote.exam_required ||
        false,
      conversionOption: quote.conversion_option || quote.convertible || false,
      metadata: {
        providerId: this.config.id,
        originalResponse: quote,
        responseTimestamp: new Date().toISOString(),
      },
      expiresAt:
        quote.expires_at ||
        quote.expirationDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      applicationUrl: quote.application_url || quote.applyUrl || undefined,
    };

    return normalized;
  }

  private extractMonthlyPremium(quote: any): number {
    return (
      quote.monthly_premium ||
      quote.monthlyPremium ||
      quote.premium_monthly ||
      quote.monthly_cost ||
      (quote.annual_premium || quote.annualPremium || quote.yearly_cost || 0) /
        12 ||
      0
    );
  }

  private extractJASMonthlyPremium(quote: any): number {
    return (
      quote.monthly_premium ||
      quote.monthlyPremium ||
      quote.premium_monthly ||
      quote.monthly_cost ||
      (quote.annual_premium || quote.annualPremium || quote.yearly_cost || 0) /
        12 ||
      0
    );
  }

  private extractAnnualPremium(quote: any): number {
    return (
      quote.annual_premium ||
      quote.annualPremium ||
      quote.yearly_cost ||
      (quote.monthly_premium ||
        quote.monthlyPremium ||
        quote.monthly_cost ||
        0) * 12 ||
      0
    );
  }

  private extractJASAnnualPremium(quote: any): number {
    return (
      quote.annual_premium ||
      quote.annualPremium ||
      quote.yearly_cost ||
      (quote.monthly_premium ||
        quote.monthlyPremium ||
        quote.monthly_cost ||
        0) * 12 ||
      0
    );
  }

  private extractFeatures(quote: any): string[] {
    const features =
      quote.features || quote.benefits || quote.coverage_details || [];

    if (Array.isArray(features)) {
      return features.map((f) =>
        typeof f === "string" ? f : f.name || f.description || String(f),
      );
    }

    if (typeof features === "object") {
      return Object.entries(features)
        .filter(([, value]) => value)
        .map(([key]) =>
          key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        );
    }

    return [];
  }

  private extractJASFeatures(quote: any): string[] {
    const features =
      quote.features || quote.benefits || quote.coverage_details || [];

    if (Array.isArray(features)) {
      return features.map((f) =>
        typeof f === "string" ? f : f.name || f.description || String(f),
      );
    }

    if (typeof features === "object") {
      return Object.entries(features)
        .filter(([, value]) => value)
        .map(([key]) =>
          key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        );
    }

    return [];
  }

  private getMockQuotes(request: QuoteRequest): QuoteResponse[] {
    // Generate realistic mock quotes for demo/testing
    const baseMonthlyPremium = Math.floor(Math.random() * 200) + 50;
    const numQuotes = Math.floor(Math.random() * 3) + 1; // 1-3 quotes per provider

    const quotes: QuoteResponse[] = [];

    for (let i = 0; i < numQuotes; i++) {
      const variance = 1 + (Math.random() - 0.5) * 0.4; // ±20% variance
      const monthlyPremium = Math.round(baseMonthlyPremium * variance);

      quotes.push({
        quoteId: `${this.config.id}_mock_${Date.now()}_${i}`,
        providerId: this.config.id,
        providerName: this.config.displayName,
        monthlyPremium,
        annualPremium: monthlyPremium * 12,
        coverageAmount: request.coverageAmount,
        deductible: request.coverageType.toLowerCase().includes("health")
          ? Math.floor(Math.random() * 5000) + 500
          : 0,
        termLength: request.termLength,
        features: this.generateMockFeatures(request.coverageType),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
        medicalExamRequired: Math.random() > 0.7,
        conversionOption: Math.random() > 0.6,
        metadata: {
          providerId: this.config.id,
          mockQuote: true,
          generatedAt: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        applicationUrl: `https://demo.${this.config.id}.com/apply?quote=${quotes.length}`,
      });
    }

    return quotes;
  }

  private generateMockFeatures(coverageType: string): string[] {
    const commonFeatures = [
      "24/7 Customer Support",
      "Online Account Management",
      "Mobile App Access",
      "Direct Pay Options",
    ];

    const typeSpecificFeatures: Record<string, string[]> = {
      life: [
        "Accelerated Death Benefit",
        "Waiver of Premium",
        "Terminal Illness Rider",
        "Accidental Death Benefit",
      ],
      health: [
        "Prescription Drug Coverage",
        "Preventive Care",
        "Specialist Referrals",
        "Emergency Care",
      ],
      dental: [
        "Preventive Care Covered 100%",
        "Orthodontic Coverage",
        "Annual Maximum Benefit",
        "Network Discounts",
      ],
      vision: [
        "Annual Eye Exam",
        "Frame Allowance",
        "Contact Lens Coverage",
        "Lens Enhancements",
      ],
    };

    const specific = typeSpecificFeatures[coverageType.toLowerCase()] || [];
    const selected = [...commonFeatures.slice(0, 2), ...specific.slice(0, 3)];

    return selected;
  }
}

// Main concurrent quote aggregation service
export class InsuranceQuoteAggregator {
  private clients: Map<string, ProviderApiClient> = new Map();

  constructor() {
    // Initialize clients for all active providers
    const activeProviders = getActiveProviders();
    activeProviders.forEach((provider) => {
      this.clients.set(provider.id, new ProviderApiClient(provider));
    });
  }

  async getQuotes(request: QuoteRequest): Promise<{
    quotes: QuoteResponse[];
    providers: {
      total: number;
      successful: number;
      failed: number;
      errors: Array<{ providerId: string; error: string }>;
    };
    requestId: string;
  }> {
    // Validate the request
    const validatedRequest = QuoteRequestSchema.parse(request);
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get providers that support the requested coverage type
    const eligibleProviders = getProvidersForCoverage(request.coverageType);

    if (eligibleProviders.length === 0) {
      throw new Error(
        `No providers available for coverage type: ${request.coverageType}`,
      );
    }

    // Execute requests concurrently with Promise.allSettled
    const quotePromises = eligibleProviders.map(async (provider) => {
      const client = this.clients.get(provider.id);
      if (!client) {
        throw new Error(`Client not found for provider: ${provider.id}`);
      }

      try {
        const quotes = await client.getQuotes(validatedRequest);
        return { providerId: provider.id, quotes, error: null };
      } catch (error) {
        return {
          providerId: provider.id,
          quotes: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const results = await Promise.allSettled(quotePromises);

    // Aggregate results
    const allQuotes: QuoteResponse[] = [];
    const errors: Array<{ providerId: string; error: string }> = [];
    let successful = 0;
    let failed = 0;

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { quotes, error, providerId } = result.value;
        if (error) {
          failed++;
          errors.push({ providerId, error });
        } else {
          successful++;
          allQuotes.push(...quotes);
        }
      } else {
        failed++;
        errors.push({
          providerId: "unknown",
          error: result.reason?.message || "Unknown error",
        });
      }
    });

    // Sort quotes by monthly premium (ascending)
    allQuotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

    return {
      quotes: allQuotes,
      providers: {
        total: eligibleProviders.length,
        successful,
        failed,
        errors,
      },
      requestId,
    };
  }

  // Get specific provider quotes (for testing individual providers)
  async getQuotesFromProvider(
    providerId: string,
    request: QuoteRequest,
  ): Promise<QuoteResponse[]> {
    const client = this.clients.get(providerId);
    if (!client) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const validatedRequest = QuoteRequestSchema.parse(request);
    return client.getQuotes(validatedRequest);
  }

  // Health check for all providers
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const testRequest: QuoteRequest = {
      coverageType: "life",
      applicantAge: 30,
      zipCode: "10001",
      coverageAmount: 100000,
    };

    const healthPromises = Array.from(this.clients.entries()).map(
      async ([providerId, client]) => {
        try {
          await client.getQuotes(testRequest);
          results[providerId] = true;
        } catch {
          results[providerId] = false;
        }
      },
    );

    await Promise.allSettled(healthPromises);
    return results;
  }
}

// Singleton instance
export const quoteAggregator = new InsuranceQuoteAggregator();
