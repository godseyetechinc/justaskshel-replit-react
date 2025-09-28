import { db } from "../db";
import { pointsTransactions, pointsSummary, rewardRedemptions, rewards, users } from "../../shared/schema";
import { eq, desc, asc, and, gte, lte, sql, count, sum, avg } from "drizzle-orm";

export interface PointsMetrics {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  redemptionRate: number;
}

export interface RewardPopularity {
  rewardId: number;
  rewardName: string;
  category: string;
  redemptionCount: number;
  pointsUsed: number;
  avgPointsPerRedemption: number;
}

export interface TierDistribution {
  tierLevel: string;
  userCount: number;
  percentage: number;
  avgPoints: number;
}

export interface PointsTrend {
  date: string;
  pointsEarned: number;
  pointsRedeemed: number;
  netChange: number;
}

export interface UserInsights {
  userId: string;
  currentBalance: number;
  lifetimePoints: number;
  tierLevel: string;
  recommendedRewards: RewardPopularity[];
  pointsEarningRate: number; // points per day average
  nextTierProgress: {
    current: number;
    required: number;
    percentage: number;
  };
}

export class AnalyticsService {
  
  // Get overall points system metrics
  async getPointsMetrics(dateRange?: { from: Date; to: Date }): Promise<PointsMetrics> {
    try {
      let conditions: any[] = [];
      
      if (dateRange) {
        conditions.push(
          gte(pointsTransactions.createdAt, dateRange.from),
          lte(pointsTransactions.createdAt, dateRange.to)
        );
      }

      // Get points issued (earned)
      const [earnedStats] = await db
        .select({
          totalEarned: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`
        })
        .from(pointsTransactions)
        .where(
          conditions.length > 0 
            ? and(sql`${pointsTransactions.points} > 0`, ...conditions)
            : sql`${pointsTransactions.points} > 0`
        );

      // Get points redeemed (spent)
      const [redeemedStats] = await db
        .select({
          totalRedeemed: sql<number>`COALESCE(SUM(ABS(${pointsTransactions.points})), 0)`
        })
        .from(pointsTransactions)
        .where(
          conditions.length > 0 
            ? and(sql`${pointsTransactions.points} < 0`, ...conditions)
            : sql`${pointsTransactions.points} < 0`
        );

      // Get current total balance across all users
      const [balanceStats] = await db
        .select({
          totalBalance: sql<number>`COALESCE(SUM(${pointsSummary.currentBalance}), 0)`
        })
        .from(pointsSummary);

      const totalIssued = earnedStats.totalEarned || 0;
      const totalRedeemed = redeemedStats.totalRedeemed || 0;
      const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;

      return {
        totalPointsIssued: totalIssued,
        totalPointsRedeemed: totalRedeemed,
        currentBalance: balanceStats.totalBalance || 0,
        redemptionRate: Math.round(redemptionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching points metrics:', error);
      throw new Error('Failed to fetch points metrics');
    }
  }

  // Get reward popularity statistics
  async getRewardPopularity(limit: number = 10): Promise<RewardPopularity[]> {
    try {
      const popularRewards = await db
        .select({
          rewardId: rewardRedemptions.rewardId,
          rewardName: rewards.name,
          category: rewards.category,
          redemptionCount: count(),
          pointsUsed: sql<number>`COALESCE(SUM(${rewardRedemptions.pointsUsed}), 0)`,
          avgPointsPerRedemption: sql<number>`COALESCE(AVG(${rewardRedemptions.pointsUsed}), 0)`
        })
        .from(rewardRedemptions)
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(sql`${rewardRedemptions.status} IN ('Approved', 'Delivered', 'Completed')`)
        .groupBy(rewardRedemptions.rewardId, rewards.name, rewards.category)
        .orderBy(desc(count()))
        .limit(limit);

      return popularRewards.map(reward => ({
        rewardId: reward.rewardId,
        rewardName: reward.rewardName || 'Unknown Reward',
        category: reward.category || 'Unknown',
        redemptionCount: reward.redemptionCount,
        pointsUsed: reward.pointsUsed,
        avgPointsPerRedemption: Math.round(reward.avgPointsPerRedemption * 100) / 100
      }));
    } catch (error) {
      console.error('Error fetching reward popularity:', error);
      throw new Error('Failed to fetch reward popularity');
    }
  }

  // Get tier distribution across users
  async getTierDistribution(): Promise<TierDistribution[]> {
    try {
      // First get total user count
      const [totalUsers] = await db
        .select({ count: count() })
        .from(pointsSummary);

      const tierStats = await db
        .select({
          tierLevel: pointsSummary.tierLevel,
          userCount: count(),
          avgPoints: sql<number>`COALESCE(AVG(${pointsSummary.lifetimePoints}), 0)`
        })
        .from(pointsSummary)
        .groupBy(pointsSummary.tierLevel)
        .orderBy(
          sql`CASE 
            WHEN ${pointsSummary.tierLevel} = 'Bronze' THEN 1
            WHEN ${pointsSummary.tierLevel} = 'Silver' THEN 2
            WHEN ${pointsSummary.tierLevel} = 'Gold' THEN 3
            WHEN ${pointsSummary.tierLevel} = 'Platinum' THEN 4
            WHEN ${pointsSummary.tierLevel} = 'Diamond' THEN 5
            ELSE 6
          END`
        );

      const totalCount = totalUsers.count || 1; // Avoid division by zero

      return tierStats.map(tier => ({
        tierLevel: tier.tierLevel || 'Unknown',
        userCount: tier.userCount,
        percentage: Math.round((tier.userCount / totalCount) * 10000) / 100,
        avgPoints: Math.round(tier.avgPoints * 100) / 100
      }));
    } catch (error) {
      console.error('Error fetching tier distribution:', error);
      throw new Error('Failed to fetch tier distribution');
    }
  }

  // Get points earning trends over time
  async getPointsTrends(days: number = 30): Promise<PointsTrend[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await db
        .select({
          date: sql<string>`DATE(${pointsTransactions.createdAt})`,
          pointsEarned: sql<number>`COALESCE(SUM(CASE WHEN ${pointsTransactions.points} > 0 THEN ${pointsTransactions.points} ELSE 0 END), 0)`,
          pointsRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${pointsTransactions.points} < 0 THEN ABS(${pointsTransactions.points}) ELSE 0 END), 0)`
        })
        .from(pointsTransactions)
        .where(gte(pointsTransactions.createdAt, startDate))
        .groupBy(sql`DATE(${pointsTransactions.createdAt})`)
        .orderBy(sql`DATE(${pointsTransactions.createdAt}) ASC`);

      return trends.map(trend => ({
        date: trend.date,
        pointsEarned: trend.pointsEarned,
        pointsRedeemed: trend.pointsRedeemed,
        netChange: trend.pointsEarned - trend.pointsRedeemed
      }));
    } catch (error) {
      console.error('Error fetching points trends:', error);
      throw new Error('Failed to fetch points trends');
    }
  }

  // Get user-specific insights and recommendations
  async getUserInsights(userId: string): Promise<UserInsights | null> {
    try {
      // Get user's points summary
      const [userSummary] = await db
        .select()
        .from(pointsSummary)
        .where(eq(pointsSummary.userId, userId))
        .limit(1);

      if (!userSummary) {
        return null;
      }

      // Calculate points earning rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [earningRate] = await db
        .select({
          totalEarned: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`,
          dayCount: sql<number>`COALESCE(COUNT(DISTINCT DATE(${pointsTransactions.createdAt})), 1)`
        })
        .from(pointsTransactions)
        .where(
          and(
            eq(pointsTransactions.userId, userId),
            sql`${pointsTransactions.points} > 0`,
            gte(pointsTransactions.createdAt, thirtyDaysAgo)
          )
        );

      // Calculate next tier progress
      const tiers = [
        { name: 'Bronze', min: 0 },
        { name: 'Silver', min: 500 },
        { name: 'Gold', min: 1500 },
        { name: 'Platinum', min: 5000 },
        { name: 'Diamond', min: 15000 }
      ];

      const currentTierIndex = tiers.findIndex(t => t.name === userSummary.tierLevel);
      const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

      const nextTierProgress = nextTier ? {
        current: userSummary.lifetimePoints,
        required: nextTier.min,
        percentage: Math.min(100, (userSummary.lifetimePoints / nextTier.min) * 100)
      } : {
        current: userSummary.lifetimePoints,
        required: userSummary.lifetimePoints,
        percentage: 100
      };

      // Get recommended rewards based on current balance and popularity
      const recommendedRewards = await this.getRecommendedRewards(userSummary.currentBalance);

      return {
        userId,
        currentBalance: userSummary.currentBalance,
        lifetimePoints: userSummary.lifetimePoints,
        tierLevel: userSummary.tierLevel,
        recommendedRewards: recommendedRewards.slice(0, 5), // Top 5 recommendations
        pointsEarningRate: Math.round((earningRate.totalEarned / earningRate.dayCount) * 100) / 100,
        nextTierProgress
      };
    } catch (error) {
      console.error('Error fetching user insights:', error);
      throw new Error('Failed to fetch user insights');
    }
  }

  // Get reward recommendations based on user's current balance
  private async getRecommendedRewards(userBalance: number): Promise<RewardPopularity[]> {
    try {
      const affordableRewards = await db
        .select({
          rewardId: rewards.id,
          rewardName: rewards.name,
          category: rewards.category,
          pointsCost: rewards.pointsCost,
          redemptionCount: sql<number>`COALESCE(COUNT(${rewardRedemptions.id}), 0)`,
          pointsUsed: sql<number>`COALESCE(SUM(${rewardRedemptions.pointsUsed}), 0)`,
          avgPointsPerRedemption: sql<number>`COALESCE(AVG(${rewardRedemptions.pointsUsed}), ${rewards.pointsCost})`
        })
        .from(rewards)
        .leftJoin(rewardRedemptions, eq(rewards.id, rewardRedemptions.rewardId))
        .where(
          and(
            eq(rewards.isActive, true),
            lte(rewards.pointsCost, userBalance)
          )
        )
        .groupBy(rewards.id, rewards.name, rewards.category, rewards.pointsCost)
        .orderBy(desc(sql`COALESCE(COUNT(${rewardRedemptions.id}), 0)`), asc(rewards.pointsCost))
        .limit(10);

      return affordableRewards.map(reward => ({
        rewardId: reward.rewardId,
        rewardName: reward.rewardName,
        category: reward.category,
        redemptionCount: reward.redemptionCount,
        pointsUsed: reward.pointsUsed,
        avgPointsPerRedemption: Math.round(reward.avgPointsPerRedemption * 100) / 100
      }));
    } catch (error) {
      console.error('Error fetching recommended rewards:', error);
      return [];
    }
  }

  // Get redemption funnel analysis
  async getRedemptionFunnel(): Promise<{
    totalUsers: number;
    usersWithPoints: number;
    usersWhoRedeemed: number;
    conversionRate: number;
  }> {
    try {
      const [totalUsers] = await db
        .select({ count: count() })
        .from(users);

      const [usersWithPoints] = await db
        .select({ count: count() })
        .from(pointsSummary)
        .where(sql`${pointsSummary.currentBalance} > 0`);

      const [usersWhoRedeemed] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${rewardRedemptions.userId})` })
        .from(rewardRedemptions);

      const conversionRate = totalUsers.count > 0 
        ? (usersWhoRedeemed.count / totalUsers.count) * 100 
        : 0;

      return {
        totalUsers: totalUsers.count,
        usersWithPoints: usersWithPoints.count,
        usersWhoRedeemed: usersWhoRedeemed.count,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching redemption funnel:', error);
      throw new Error('Failed to fetch redemption funnel');
    }
  }
}