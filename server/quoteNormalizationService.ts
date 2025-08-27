import { QuoteResponse } from "./insuranceProviderConfig";

export interface NormalizedQuoteData {
  id: string;
  providerId: string;
  providerName: string;
  monthlyPremium: number;
  annualPremium: number;
  coverageAmount: number;
  deductible?: number;
  termLength?: number;
  features: string[];
  rating?: number;
  medicalExamRequired: boolean;
  conversionOption?: boolean;
  expiresAt: string;
  applicationUrl?: string;
  metadata: Record<string, any>;
  // Database-specific fields
  typeId?: number;
  userId?: string;
  createdAt?: Date;
  isExternal: boolean;
  externalQuoteId: string;
}

export class QuoteNormalizationService {
  /**
   * Normalize quotes from external providers for database storage and display
   */
  static normalizeExternalQuotes(
    quotes: QuoteResponse[], 
    userId?: string, 
    typeId?: number
  ): NormalizedQuoteData[] {
    return quotes.map(quote => ({
      id: quote.quoteId,
      providerId: quote.providerId,
      providerName: quote.providerName,
      monthlyPremium: quote.monthlyPremium,
      annualPremium: quote.annualPremium,
      coverageAmount: quote.coverageAmount,
      deductible: quote.deductible,
      termLength: quote.termLength,
      features: quote.features,
      rating: quote.rating,
      medicalExamRequired: quote.medicalExamRequired,
      conversionOption: quote.conversionOption,
      expiresAt: quote.expiresAt,
      applicationUrl: quote.applicationUrl,
      metadata: {
        ...quote.metadata,
        normalized: true,
        normalizedAt: new Date().toISOString(),
      },
      typeId,
      userId,
      createdAt: new Date(),
      isExternal: true,
      externalQuoteId: quote.quoteId,
    }));
  }

  /**
   * Merge external quotes with internal database quotes
   */
  static mergeQuotes(
    externalQuotes: NormalizedQuoteData[],
    internalQuotes: any[]
  ): NormalizedQuoteData[] {
    // Convert internal quotes to normalized format
    const normalizedInternal: NormalizedQuoteData[] = internalQuotes.map(quote => ({
      id: quote.id?.toString() || `internal_${Date.now()}_${Math.random()}`,
      providerId: quote.provider || "internal",
      providerName: quote.provider || "Internal Provider",
      monthlyPremium: parseFloat(quote.monthlyPremium || "0"),
      annualPremium: parseFloat(quote.annualPremium || quote.monthlyPremium || "0") * 12,
      coverageAmount: parseFloat(quote.coverageAmount || "0"),
      deductible: parseFloat(quote.deductible || "0"),
      termLength: quote.termLength,
      features: Array.isArray(quote.features) ? quote.features : [],
      rating: quote.rating,
      medicalExamRequired: quote.medicalExamRequired || false,
      conversionOption: quote.conversionOption || false,
      expiresAt: quote.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      applicationUrl: quote.applicationUrl,
      metadata: {
        internal: true,
        originalQuote: quote,
      },
      typeId: quote.typeId,
      userId: quote.userId,
      createdAt: quote.createdAt || new Date(),
      isExternal: false,
      externalQuoteId: "",
    }));

    // Combine and sort by monthly premium
    const allQuotes = [...externalQuotes, ...normalizedInternal];
    return allQuotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
  }

  /**
   * Filter and deduplicate quotes
   */
  static filterQuotes(
    quotes: NormalizedQuoteData[],
    filters: {
      maxMonthlyPremium?: number;
      minCoverageAmount?: number;
      maxDeductible?: number;
      requiredFeatures?: string[];
      excludeProviders?: string[];
      minRating?: number;
    } = {}
  ): NormalizedQuoteData[] {
    let filtered = quotes;

    // Apply filters
    if (filters.maxMonthlyPremium) {
      filtered = filtered.filter(q => q.monthlyPremium <= filters.maxMonthlyPremium!);
    }

    if (filters.minCoverageAmount) {
      filtered = filtered.filter(q => q.coverageAmount >= filters.minCoverageAmount!);
    }

    if (filters.maxDeductible) {
      filtered = filtered.filter(q => (q.deductible || 0) <= filters.maxDeductible!);
    }

    if (filters.requiredFeatures && filters.requiredFeatures.length > 0) {
      filtered = filtered.filter(q => 
        filters.requiredFeatures!.every(feature => 
          q.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        )
      );
    }

    if (filters.excludeProviders && filters.excludeProviders.length > 0) {
      filtered = filtered.filter(q => !filters.excludeProviders!.includes(q.providerId));
    }

    if (filters.minRating) {
      filtered = filtered.filter(q => (q.rating || 0) >= filters.minRating!);
    }

    // Remove duplicates by provider and similar pricing
    const deduped = this.deduplicateQuotes(filtered);

    return deduped;
  }

  /**
   * Remove duplicate quotes from the same provider with very similar terms
   */
  private static deduplicateQuotes(quotes: NormalizedQuoteData[]): NormalizedQuoteData[] {
    const seen = new Map<string, NormalizedQuoteData>();

    quotes.forEach(quote => {
      const key = `${quote.providerId}_${quote.coverageAmount}_${Math.floor(quote.monthlyPremium / 10) * 10}`;
      
      const existing = seen.get(key);
      if (!existing || quote.monthlyPremium < existing.monthlyPremium) {
        seen.set(key, quote);
      }
    });

    return Array.from(seen.values()).sort((a, b) => a.monthlyPremium - b.monthlyPremium);
  }

  /**
   * Enrich quotes with additional calculated fields for display
   */
  static enrichQuotesForDisplay(quotes: NormalizedQuoteData[]): Array<NormalizedQuoteData & {
    // Display-specific fields
    formattedMonthlyPremium: string;
    formattedAnnualPremium: string;
    formattedCoverageAmount: string;
    formattedDeductible: string;
    costPerThousand: number;
    recommendationScore: number;
    isRecommended: boolean;
    isExpiringSoon: boolean;
    daysUntilExpiry: number;
  }> {
    const now = new Date();
    
    return quotes.map((quote, index) => {
      const expiryDate = new Date(quote.expiresAt);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate cost per thousand dollars of coverage
      const costPerThousand = quote.coverageAmount > 0 
        ? (quote.monthlyPremium * 12) / (quote.coverageAmount / 1000)
        : 0;
      
      // Calculate recommendation score (lower is better)
      const priceScore = index / quotes.length; // Position in sorted list
      const ratingScore = quote.rating ? (5 - quote.rating) / 5 : 0.5; // Higher rating = lower score
      const examScore = quote.medicalExamRequired ? 0.1 : 0; // Small penalty for exam
      const recommendationScore = priceScore + ratingScore + examScore;
      
      return {
        ...quote,
        formattedMonthlyPremium: `$${quote.monthlyPremium.toFixed(2)}`,
        formattedAnnualPremium: `$${quote.annualPremium.toFixed(2)}`,
        formattedCoverageAmount: `$${quote.coverageAmount.toLocaleString()}`,
        formattedDeductible: quote.deductible ? `$${quote.deductible.toLocaleString()}` : "N/A",
        costPerThousand: Math.round(costPerThousand * 100) / 100,
        recommendationScore,
        isRecommended: index < 3 && recommendationScore < 0.5, // Top 3 with good score
        isExpiringSoon: daysUntilExpiry <= 2,
        daysUntilExpiry,
      };
    });
  }

  /**
   * Group quotes by provider for comparison display
   */
  static groupQuotesByProvider(quotes: NormalizedQuoteData[]): Record<string, NormalizedQuoteData[]> {
    const grouped: Record<string, NormalizedQuoteData[]> = {};
    
    quotes.forEach(quote => {
      if (!grouped[quote.providerId]) {
        grouped[quote.providerId] = [];
      }
      grouped[quote.providerId].push(quote);
    });
    
    // Sort quotes within each provider group by price
    Object.keys(grouped).forEach(providerId => {
      grouped[providerId].sort((a, b) => a.monthlyPremium - b.monthlyPremium);
    });
    
    return grouped;
  }

  /**
   * Generate quote comparison summary
   */
  static generateComparisonSummary(quotes: NormalizedQuoteData[]): {
    totalQuotes: number;
    providersCount: number;
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
    coverageRange: {
      min: number;
      max: number;
    };
    featuresOverview: {
      feature: string;
      count: number;
      percentage: number;
    }[];
    recommendations: {
      bestValue: NormalizedQuoteData | null;
      lowestPrice: NormalizedQuoteData | null;
      highestRating: NormalizedQuoteData | null;
    };
  } {
    if (quotes.length === 0) {
      return {
        totalQuotes: 0,
        providersCount: 0,
        priceRange: { min: 0, max: 0, average: 0 },
        coverageRange: { min: 0, max: 0 },
        featuresOverview: [],
        recommendations: {
          bestValue: null,
          lowestPrice: null,
          highestRating: null,
        },
      };
    }

    const providers = new Set(quotes.map(q => q.providerId));
    const premiums = quotes.map(q => q.monthlyPremium);
    const coverageAmounts = quotes.map(q => q.coverageAmount);
    
    // Calculate feature frequency
    const featureCount = new Map<string, number>();
    quotes.forEach(quote => {
      quote.features.forEach(feature => {
        featureCount.set(feature, (featureCount.get(feature) || 0) + 1);
      });
    });
    
    const featuresOverview = Array.from(featureCount.entries())
      .map(([feature, count]) => ({
        feature,
        count,
        percentage: Math.round((count / quotes.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 features

    // Find recommendations
    const lowestPrice = quotes.reduce((min, quote) => 
      quote.monthlyPremium < min.monthlyPremium ? quote : min, quotes[0]);
    
    const highestRating = quotes.reduce((max, quote) => 
      (quote.rating || 0) > (max.rating || 0) ? quote : max, quotes[0]);
    
    // Best value = good balance of price and coverage
    const bestValue = quotes.reduce((best, quote) => {
      const valueScore = (quote.coverageAmount / 1000) / quote.monthlyPremium;
      const bestScore = (best.coverageAmount / 1000) / best.monthlyPremium;
      return valueScore > bestScore ? quote : best;
    }, quotes[0]);

    return {
      totalQuotes: quotes.length,
      providersCount: providers.size,
      priceRange: {
        min: Math.min(...premiums),
        max: Math.max(...premiums),
        average: Math.round((premiums.reduce((sum, p) => sum + p, 0) / premiums.length) * 100) / 100,
      },
      coverageRange: {
        min: Math.min(...coverageAmounts),
        max: Math.max(...coverageAmounts),
      },
      featuresOverview,
      recommendations: {
        bestValue,
        lowestPrice,
        highestRating: highestRating.rating ? highestRating : null,
      },
    };
  }
}