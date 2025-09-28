import { db } from "../db";
import { pointsTransactions, pointsSummary, pointsRules, users } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ActivityPoints {
  activity: string;
  points: number;
  description: string;
  category: string;
}

export class PointsService {
  // Define default point values for activities
  private static readonly DEFAULT_ACTIVITIES: Record<string, ActivityPoints> = {
    POLICY_PURCHASE: {
      activity: "POLICY_PURCHASE",
      points: 500,
      description: "Points earned for purchasing an insurance policy",
      category: "Policy Purchase"
    },
    CLAIM_SUBMISSION: {
      activity: "CLAIM_SUBMISSION", 
      points: 100,
      description: "Points earned for submitting an insurance claim",
      category: "Claim Submission"
    },
    PROFILE_COMPLETE: {
      activity: "PROFILE_COMPLETE",
      points: 50,
      description: "Points earned for completing profile information",
      category: "Profile Complete"
    },
    DAILY_LOGIN: {
      activity: "DAILY_LOGIN",
      points: 10,
      description: "Daily login bonus points",
      category: "Login"
    },
    WEEKLY_LOGIN_STREAK: {
      activity: "WEEKLY_LOGIN_STREAK",
      points: 50,
      description: "Weekly login streak bonus",
      category: "Login"
    },
    REVIEW_SUBMISSION: {
      activity: "REVIEW_SUBMISSION",
      points: 25,
      description: "Points earned for submitting a review",
      category: "Review"
    },
    SURVEY_COMPLETION: {
      activity: "SURVEY_COMPLETION", 
      points: 25,
      description: "Points earned for completing a survey",
      category: "Survey"
    },
    REFERRAL_SIGNUP: {
      activity: "REFERRAL_SIGNUP",
      points: 200,
      description: "Points earned for successful referral",
      category: "Referral"
    },
    WELCOME_BONUS: {
      activity: "WELCOME_BONUS",
      points: 1000,
      description: "Welcome bonus for new users",
      category: "Welcome"
    }
  };

  // Tier thresholds for dynamic calculation
  private static readonly TIER_THRESHOLDS = [
    { name: 'Diamond', threshold: 15000, color: 'text-purple-500' },
    { name: 'Platinum', threshold: 5000, color: 'text-indigo-500' },
    { name: 'Gold', threshold: 1500, color: 'text-yellow-500' },
    { name: 'Silver', threshold: 500, color: 'text-gray-500' },
    { name: 'Bronze', threshold: 0, color: 'text-amber-600' }
  ];

  /**
   * Award points to a user for a specific activity
   */
  async awardPointsForActivity(
    userId: string, 
    activityType: keyof typeof PointsService.DEFAULT_ACTIVITIES,
    referenceId?: string,
    referenceType?: string,
    customPoints?: number
  ): Promise<any> {
    try {
      const activity = PointsService.DEFAULT_ACTIVITIES[activityType];
      if (!activity) {
        throw new Error(`Unknown activity type: ${activityType}`);
      }

      // Check if there's a custom rule for this activity
      const customRule = await this.getActivePointsRule(activity.category);
      const pointsToAward = customPoints || (customRule ? customRule.points : activity.points);
      const description = customRule ? customRule.description : activity.description;

      // Validate earning limits if rule exists
      if (customRule && !await this.validateEarningLimits(userId, customRule, activity.category)) {
        console.log(`User ${userId} has reached earning limit for ${activity.category}`);
        return null;
      }

      // Get current user points summary
      const currentSummary = await this.getUserPointsSummary(userId);
      const balanceAfter = (currentSummary?.currentBalance || 0) + pointsToAward;

      // Create points transaction
      const [transaction] = await db.insert(pointsTransactions).values({
        userId,
        transactionType: "Earned",
        points: pointsToAward,
        description,
        category: activity.category as any,
        referenceId,
        referenceType,
        balanceAfter,
        createdAt: new Date()
      }).returning();

      // Update user points summary
      await this.updateUserPointsSummary(userId, pointsToAward, "Earned");

      // Check for tier progression
      await this.checkAndUpdateTierProgression(userId);

      console.log(`Awarded ${pointsToAward} points to user ${userId} for ${activityType}`);
      return transaction;

    } catch (error) {
      console.error(`Error awarding points for activity ${activityType}:`, error);
      throw error;
    }
  }

  /**
   * Calculate dynamic tier level based on total points
   */
  async calculateTierLevel(totalPoints: number): Promise<{
    tier: string;
    progress: number;
    nextThreshold: number | null;
    color: string;
  }> {
    const currentTier = PointsService.TIER_THRESHOLDS.find(t => totalPoints >= t.threshold);
    const nextTier = PointsService.TIER_THRESHOLDS.find(t => t.threshold > totalPoints);
    
    if (!currentTier) {
      return {
        tier: 'Bronze',
        progress: totalPoints,
        nextThreshold: 500,
        color: 'text-amber-600'
      };
    }

    return {
      tier: currentTier.name,
      progress: nextTier ? totalPoints - currentTier.threshold : 0,
      nextThreshold: nextTier ? nextTier.threshold : null,
      color: currentTier.color
    };
  }

  /**
   * Initialize points summary for new user
   */
  async initializeUserPointsSummary(userId: string): Promise<any> {
    try {
      // Check if user already has a summary
      const existing = await this.getUserPointsSummary(userId);
      if (existing) {
        return existing;
      }

      // Create new points summary
      const [summary] = await db.insert(pointsSummary).values({
        userId,
        totalEarned: 0,
        totalRedeemed: 0,
        currentBalance: 0,
        lifetimeBalance: 0,
        tierLevel: "Bronze",
        tierProgress: 0,
        nextTierThreshold: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return summary;
    } catch (error) {
      console.error(`Error initializing points summary for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Award welcome bonus to new user
   */
  async awardWelcomeBonus(userId: string): Promise<any> {
    try {
      // Check if user already received welcome bonus
      const existingWelcome = await db.select()
        .from(pointsTransactions)
        .where(and(
          eq(pointsTransactions.userId, userId),
          eq(pointsTransactions.category, "Bonus"),
          eq(pointsTransactions.description, PointsService.DEFAULT_ACTIVITIES.WELCOME_BONUS.description)
        ));

      if (existingWelcome.length > 0) {
        console.log(`User ${userId} already received welcome bonus`);
        return null;
      }

      // Initialize points summary first
      await this.initializeUserPointsSummary(userId);

      // Award welcome bonus
      return await this.awardPointsForActivity(userId, "WELCOME_BONUS");
    } catch (error) {
      console.error(`Error awarding welcome bonus to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user points summary after transaction
   */
  private async updateUserPointsSummary(userId: string, points: number, transactionType: string): Promise<void> {
    try {
      let summary = await this.getUserPointsSummary(userId);
      
      if (!summary) {
        summary = await this.initializeUserPointsSummary(userId);
      }

      const updates: any = { updatedAt: new Date() };

      if (transactionType === "Earned" || transactionType === "Bonus" || transactionType === "Referral") {
        updates.totalEarned = (summary.totalEarned || 0) + points;
        updates.currentBalance = (summary.currentBalance || 0) + points;
        updates.lifetimeBalance = (summary.lifetimeBalance || 0) + points;
        updates.lastEarnedAt = new Date();
      } else if (transactionType === "Redeemed") {
        updates.totalRedeemed = (summary.totalRedeemed || 0) + Math.abs(points);
        updates.currentBalance = (summary.currentBalance || 0) - Math.abs(points);
      }

      await db.update(pointsSummary)
        .set(updates)
        .where(eq(pointsSummary.userId, userId));

    } catch (error) {
      console.error(`Error updating points summary for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check and update tier progression for user
   */
  private async checkAndUpdateTierProgression(userId: string): Promise<void> {
    try {
      const summary = await this.getUserPointsSummary(userId);
      if (!summary) return;

      const tierInfo = await this.calculateTierLevel(summary.lifetimeBalance || 0);
      
      // Update tier information if changed
      if (summary.tierLevel !== tierInfo.tier || 
          summary.tierProgress !== tierInfo.progress ||
          summary.nextTierThreshold !== tierInfo.nextThreshold) {
        
        await db.update(pointsSummary)
          .set({
            tierLevel: tierInfo.tier as any,
            tierProgress: tierInfo.progress,
            nextTierThreshold: tierInfo.nextThreshold,
            updatedAt: new Date()
          })
          .where(eq(pointsSummary.userId, userId));

        // If tier changed, log it
        if (summary.tierLevel !== tierInfo.tier) {
          console.log(`User ${userId} advanced to ${tierInfo.tier} tier!`);
        }
      }
    } catch (error) {
      console.error(`Error checking tier progression for user ${userId}:`, error);
    }
  }

  /**
   * Award daily login points if user hasn't logged in today
   */
  async awardDailyLoginPoints(userId: string): Promise<any> {
    try {
      // Check if user already earned login points today
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todaysLoginPoints = await db.select().from(pointsTransactions)
        .where(and(
          eq(pointsTransactions.userId, userId),
          eq(pointsTransactions.category, "Login"),
          eq(pointsTransactions.transactionType, "Earned"),
          sql`${pointsTransactions.createdAt} >= ${startOfDay}`
        ));

      if (todaysLoginPoints.length > 0) {
        console.log(`User ${userId} already received daily login points today`);
        return null;
      }

      // Award daily login points
      return await this.awardPointsForActivity(userId, "DAILY_LOGIN");

    } catch (error) {
      console.error(`Error awarding daily login points to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user points summary
   */
  private async getUserPointsSummary(userId: string): Promise<any> {
    const [summary] = await db.select().from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));
    return summary;
  }

  /**
   * Get active points rule for category
   */
  private async getActivePointsRule(category: string): Promise<any> {
    const [rule] = await db.select().from(pointsRules)
      .where(and(
        eq(pointsRules.category, category as any),
        eq(pointsRules.isActive, true)
      ));
    return rule;
  }

  /**
   * Validate earning limits based on rules
   */
  private async validateEarningLimits(userId: string, rule: any, category: string): Promise<boolean> {
    if (!rule.maxPerPeriod || !rule.periodType) {
      return true; // No limits defined
    }

    // Calculate date range based on period type
    const now = new Date();
    let startDate: Date;

    switch (rule.periodType) {
      case 'Daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'Weekly':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        break;
      case 'Monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return true; // Unknown period type, allow
    }

    // Count points earned in this period for this category
    const transactions = await db.select().from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.category, category as any),
        eq(pointsTransactions.transactionType, "Earned")
      ));

    const periodTransactions = transactions.filter(t => 
      t.createdAt && new Date(t.createdAt) >= startDate
    );
    
    const periodPoints = periodTransactions.reduce((sum, t) => sum + (t.points || 0), 0);
    
    return periodPoints < rule.maxPerPeriod;
  }
}

// Export singleton instance
export const pointsService = new PointsService();