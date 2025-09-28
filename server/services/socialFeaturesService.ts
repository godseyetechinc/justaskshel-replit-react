import { db } from '../db';
import {
  leaderboardSettings,
  achievementShares,
  socialMediaIntegrations,
  friendships,
  socialReferrals,
  leaderboardRankings,
  socialActivities,
  activityLikes,
  activityComments,
  pointsTransactions,
  pointsSummary,
  users,
  achievements,
  type LeaderboardSettings,
  type InsertLeaderboardSettings,
  type AchievementShare,
  type InsertAchievementShare,
  type SocialMediaIntegration,
  type InsertSocialMediaIntegration,
  type Friendship,
  type InsertFriendship,
  type SocialReferral,
  type InsertSocialReferral,
  type LeaderboardRanking,
  type InsertLeaderboardRanking,
  type SocialActivity,
  type InsertSocialActivity,
  type ActivityLike,
  type InsertActivityLike,
  type ActivityComment,
  type InsertActivityComment,
} from '../../shared/schema';
import { eq, and, desc, asc, sql, or, gte, lte, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class SocialFeaturesService {
  // ===== LEADERBOARD MANAGEMENT =====

  async updateLeaderboardSettings(userId: string, settings: Partial<InsertLeaderboardSettings>): Promise<LeaderboardSettings> {
    // Check if settings exist
    const [existing] = await db
      .select()
      .from(leaderboardSettings)
      .where(eq(leaderboardSettings.userId, userId));

    if (existing) {
      const [updated] = await db
        .update(leaderboardSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(leaderboardSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(leaderboardSettings)
        .values({ userId, ...settings })
        .returning();
      return created;
    }
  }

  async getLeaderboardSettings(userId: string): Promise<LeaderboardSettings | null> {
    const [settings] = await db
      .select()
      .from(leaderboardSettings)
      .where(eq(leaderboardSettings.userId, userId));
    return settings || null;
  }

  async getLeaderboard(
    period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'All-Time',
    category: 'Points' | 'Achievements' | 'Referrals' | 'Activity' | 'Redemptions',
    limit: number = 50
  ): Promise<LeaderboardRanking[]> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    // Calculate period boundaries
    switch (period) {
      case 'Daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'Weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'Monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'Yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      default: // All-Time
        periodStart = new Date(2020, 0, 1);
        break;
    }

    return await db
      .select({
        id: leaderboardRankings.id,
        userId: leaderboardRankings.userId,
        period: leaderboardRankings.period,
        category: leaderboardRankings.category,
        rank: leaderboardRankings.rank,
        score: leaderboardRankings.score,
        previousRank: leaderboardRankings.previousRank,
        rankChange: leaderboardRankings.rankChange,
        periodStart: leaderboardRankings.periodStart,
        periodEnd: leaderboardRankings.periodEnd,
        updatedAt: leaderboardRankings.updatedAt,
        // User info with privacy controls
        displayName: leaderboardSettings.displayName,
        showTierLevel: leaderboardSettings.showTierLevel,
        showTotalPoints: leaderboardSettings.showTotalPoints,
        isOptedIn: leaderboardSettings.isOptedIn,
      })
      .from(leaderboardRankings)
      .leftJoin(leaderboardSettings, eq(leaderboardRankings.userId, leaderboardSettings.userId))
      .where(
        and(
          eq(leaderboardRankings.period, period),
          eq(leaderboardRankings.category, category),
          gte(leaderboardRankings.periodStart, periodStart),
          lte(leaderboardRankings.periodEnd, periodEnd),
          or(
            eq(leaderboardSettings.isOptedIn, true),
            sql`${leaderboardSettings.isOptedIn} IS NULL` // Include users who haven't set preferences yet
          )
        )
      )
      .orderBy(asc(leaderboardRankings.rank))
      .limit(limit);
  }

  async updateLeaderboardRankings(
    period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'All-Time',
    category: 'Points' | 'Achievements' | 'Referrals' | 'Activity' | 'Redemptions'
  ): Promise<void> {
    // This would typically be run by a scheduled job
    const now = new Date();
    
    // Get current scores based on category
    let scoreQuery;
    switch (category) {
      case 'Points':
        scoreQuery = db
          .select({
            userId: pointsSummary.userId,
            score: pointsSummary.totalEarned,
          })
          .from(pointsSummary)
          .orderBy(desc(pointsSummary.totalEarned));
        break;
      case 'Achievements':
        scoreQuery = db
          .select({
            userId: sql<string>`${pointsSummary.userId}`,
            score: sql<number>`${pointsSummary.achievementsUnlocked}`,
          })
          .from(pointsSummary)
          .orderBy(desc(pointsSummary.achievementsUnlocked));
        break;
      default:
        return; // Other categories would need similar implementations
    }

    const scores = await scoreQuery;
    
    // Calculate rankings
    const rankings: InsertLeaderboardRanking[] = scores.map((score, index) => ({
      userId: score.userId,
      period,
      category,
      rank: index + 1,
      score: score.score ?? 0,
      periodStart: this.getPeriodStart(period, now),
      periodEnd: now,
    }));

    // Clear existing rankings for this period/category
    await db
      .delete(leaderboardRankings)
      .where(
        and(
          eq(leaderboardRankings.period, period),
          eq(leaderboardRankings.category, category)
        )
      );

    // Insert new rankings
    if (rankings.length > 0) {
      await db.insert(leaderboardRankings).values(rankings);
    }
  }

  // ===== ACHIEVEMENT SHARING =====

  async shareAchievement(share: InsertAchievementShare): Promise<AchievementShare> {
    const [newShare] = await db.insert(achievementShares).values(share).returning();
    
    // Award social media bonus points
    if (share.shareType !== 'Internal') {
      await this.awardSocialShareBonus(share.userId, share.shareType);
    }

    return newShare;
  }

  async getAchievementShares(userId: string, limit: number = 20): Promise<AchievementShare[]> {
    return await db
      .select()
      .from(achievementShares)
      .where(eq(achievementShares.userId, userId))
      .orderBy(desc(achievementShares.sharedAt))
      .limit(limit);
  }

  async getPublicAchievementShares(limit: number = 50): Promise<AchievementShare[]> {
    return await db
      .select()
      .from(achievementShares)
      .where(eq(achievementShares.isPublic, true))
      .orderBy(desc(achievementShares.sharedAt))
      .limit(limit);
  }

  // ===== SOCIAL MEDIA INTEGRATION =====

  async connectSocialMedia(integration: InsertSocialMediaIntegration): Promise<SocialMediaIntegration> {
    const [newIntegration] = await db.insert(socialMediaIntegrations).values(integration).returning();
    
    // Award connection bonus if not already awarded
    if (!integration.connectionBonusAwarded) {
      await this.awardSocialConnectionBonus(integration.userId, integration.platform);
      await db
        .update(socialMediaIntegrations)
        .set({ connectionBonusAwarded: true })
        .where(eq(socialMediaIntegrations.id, newIntegration.id));
    }

    return newIntegration;
  }

  async getUserSocialIntegrations(userId: string): Promise<SocialMediaIntegration[]> {
    return await db
      .select()
      .from(socialMediaIntegrations)
      .where(eq(socialMediaIntegrations.userId, userId))
      .orderBy(desc(socialMediaIntegrations.connectedAt));
  }

  async disconnectSocialMedia(userId: string, platform: string): Promise<boolean> {
    const result = await db
      .update(socialMediaIntegrations)
      .set({ isConnected: false, updatedAt: new Date() })
      .where(
        and(
          eq(socialMediaIntegrations.userId, userId),
          eq(socialMediaIntegrations.platform, platform)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // ===== FRIENDSHIP SYSTEM =====

  async sendFriendRequest(requesterId: string, addresseeId: string, message?: string): Promise<Friendship | null> {
    // Check if friendship already exists
    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, requesterId),
            eq(friendships.addresseeId, addresseeId)
          ),
          and(
            eq(friendships.requesterId, addresseeId),
            eq(friendships.addresseeId, requesterId)
          )
        )
      );

    if (existing) {
      return null; // Friendship already exists
    }

    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        requestMessage: message,
        status: 'Pending',
      })
      .returning();

    return friendship;
  }

  async respondToFriendRequest(friendshipId: number, response: 'Accepted' | 'Declined'): Promise<boolean> {
    const result = await db
      .update(friendships)
      .set({ 
        status: response, 
        respondedAt: new Date() 
      })
      .where(eq(friendships.id, friendshipId));

    return (result.rowCount ?? 0) > 0;
  }

  async getUserFriends(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          ),
          eq(friendships.status, 'Accepted')
        )
      )
      .orderBy(desc(friendships.respondedAt));
  }

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, 'Pending')
        )
      )
      .orderBy(desc(friendships.createdAt));
  }

  // ===== ENHANCED REFERRAL SYSTEM =====

  async createSocialReferral(
    referrerId: string,
    inviteMethod: 'Email' | 'SMS' | 'Social Media' | 'Direct Link' | 'QR Code',
    platformUsed?: string
  ): Promise<SocialReferral> {
    const referralCode = nanoid(10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const bonusTier = await this.determineBonusTier(referrerId);
    const { referrerReward, referredReward } = this.getBonusAmounts(bonusTier);

    const [referral] = await db
      .insert(socialReferrals)
      .values({
        referrerId,
        referralCode,
        inviteMethod,
        platformUsed,
        bonusTier,
        referrerReward,
        referredReward,
        expiresAt,
      })
      .returning();

    return referral;
  }

  async completeReferral(referralCode: string, referredUserId: string): Promise<boolean> {
    const [referral] = await db
      .select()
      .from(socialReferrals)
      .where(eq(socialReferrals.referralCode, referralCode));

    if (!referral || referral.isCompleted || new Date() > new Date(referral.expiresAt)) {
      return false;
    }

    // Complete the referral
    await db
      .update(socialReferrals)
      .set({
        referredUserId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .where(eq(socialReferrals.id, referral.id));

    // Award points to both users
    await this.awardReferralBonus(referral.referrerId, referral.referrerReward, 'Referrer Bonus');
    await this.awardReferralBonus(referredUserId, referral.referredReward, 'Welcome Bonus');

    return true;
  }

  async getUserReferrals(userId: string): Promise<SocialReferral[]> {
    return await db
      .select()
      .from(socialReferrals)
      .where(eq(socialReferrals.referrerId, userId))
      .orderBy(desc(socialReferrals.createdAt));
  }

  // ===== SOCIAL ACTIVITY FEED =====

  async createSocialActivity(activity: InsertSocialActivity): Promise<SocialActivity> {
    const [newActivity] = await db.insert(socialActivities).values(activity).returning();
    return newActivity;
  }

  async getSocialActivityFeed(userId: string, limit: number = 20): Promise<SocialActivity[]> {
    // Get activities from user and their friends
    const friendIds = await this.getFriendIds(userId);
    const visibleUserIds = [userId, ...friendIds];

    return await db
      .select()
      .from(socialActivities)
      .where(
        and(
          sql`${socialActivities.userId} = ANY(${visibleUserIds})`,
          eq(socialActivities.isPublic, true)
        )
      )
      .orderBy(desc(socialActivities.createdAt))
      .limit(limit);
  }

  async likeActivity(activityId: number, userId: string, reactionType: 'Like' | 'Love' | 'Celebrate' | 'Inspire' | 'Congratulate' = 'Like'): Promise<ActivityLike> {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(activityLikes)
      .where(
        and(
          eq(activityLikes.activityId, activityId),
          eq(activityLikes.userId, userId)
        )
      );

    if (existing) {
      // Update reaction type
      const [updated] = await db
        .update(activityLikes)
        .set({ reactionType })
        .where(eq(activityLikes.id, existing.id))
        .returning();
      return updated;
    }

    // Create new like
    const [like] = await db
      .insert(activityLikes)
      .values({ activityId, userId, reactionType })
      .returning();

    // Update likes count
    await db
      .update(socialActivities)
      .set({ likesCount: sql`${socialActivities.likesCount} + 1` })
      .where(eq(socialActivities.id, activityId));

    return like;
  }

  async addComment(activityId: number, userId: string, comment: string, parentCommentId?: number): Promise<ActivityComment> {
    const [newComment] = await db
      .insert(activityComments)
      .values({
        activityId,
        userId,
        comment,
        isReply: !!parentCommentId,
        parentCommentId,
      })
      .returning();

    // Update comments count
    await db
      .update(socialActivities)
      .set({ commentsCount: sql`${socialActivities.commentsCount} + 1` })
      .where(eq(socialActivities.id, activityId));

    return newComment;
  }

  async getActivityComments(activityId: number): Promise<ActivityComment[]> {
    return await db
      .select()
      .from(activityComments)
      .where(eq(activityComments.activityId, activityId))
      .orderBy(asc(activityComments.createdAt));
  }

  // ===== HELPER METHODS =====

  private async getFriendIds(userId: string): Promise<string[]> {
    const friends = await this.getUserFriends(userId);
    return friends.map(f => f.requesterId === userId ? f.addresseeId : f.requesterId);
  }

  private async awardSocialShareBonus(userId: string, platform: string): Promise<void> {
    const bonusPoints = this.getSocialShareBonus(platform);
    
    await db.insert(pointsTransactions).values({
      userId,
      amount: bonusPoints,
      transactionType: 'Credit',
      category: 'Social Share',
      description: `Social media share bonus - ${platform}`,
      referenceId: 'SOCIAL_SHARE_BONUS',
    });

    // Update points summary
    await db
      .update(pointsSummary)
      .set({
        totalEarned: sql`${pointsSummary.totalEarned} + ${bonusPoints}`,
        currentBalance: sql`${pointsSummary.currentBalance} + ${bonusPoints}`,
        lastEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pointsSummary.userId, userId));
  }

  private async awardSocialConnectionBonus(userId: string, platform: string): Promise<void> {
    const bonusPoints = this.getSocialConnectionBonus(platform);
    
    await db.insert(pointsTransactions).values({
      userId,
      amount: bonusPoints,
      transactionType: 'Credit',
      category: 'Social Connection',
      description: `Social media connection bonus - ${platform}`,
      referenceId: 'SOCIAL_CONNECTION_BONUS',
    });

    // Update points summary
    await db
      .update(pointsSummary)
      .set({
        totalEarned: sql`${pointsSummary.totalEarned} + ${bonusPoints}`,
        currentBalance: sql`${pointsSummary.currentBalance} + ${bonusPoints}`,
        lastEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pointsSummary.userId, userId));
  }

  private async awardReferralBonus(userId: string, points: number, description: string): Promise<void> {
    await db.insert(pointsTransactions).values({
      userId,
      amount: points,
      transactionType: 'Credit',
      category: 'Referral',
      description,
      referenceId: 'SOCIAL_REFERRAL_BONUS',
    });

    // Update points summary
    await db
      .update(pointsSummary)
      .set({
        totalEarned: sql`${pointsSummary.totalEarned} + ${points}`,
        currentBalance: sql`${pointsSummary.currentBalance} + ${points}`,
        lastEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pointsSummary.userId, userId));
  }

  private async determineBonusTier(userId: string): Promise<'Standard' | 'Premium' | 'Elite'> {
    const [summary] = await db
      .select({ tierLevel: pointsSummary.tierLevel })
      .from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));

    const tier = summary?.tierLevel || 'Bronze';
    
    if (tier === 'Diamond' || tier === 'Platinum') return 'Elite';
    if (tier === 'Gold' || tier === 'Silver') return 'Premium';
    return 'Standard';
  }

  private getBonusAmounts(bonusTier: 'Standard' | 'Premium' | 'Elite'): { referrerReward: number; referredReward: number } {
    switch (bonusTier) {
      case 'Elite':
        return { referrerReward: 1000, referredReward: 500 };
      case 'Premium':
        return { referrerReward: 750, referredReward: 350 };
      default:
        return { referrerReward: 500, referredReward: 250 };
    }
  }

  private getSocialShareBonus(platform: string): number {
    const bonuses: Record<string, number> = {
      'Facebook': 50,
      'Twitter': 40,
      'LinkedIn': 60,
      'Instagram': 45,
      'WhatsApp': 30,
    };
    return bonuses[platform] || 25;
  }

  private getSocialConnectionBonus(platform: string): number {
    const bonuses: Record<string, number> = {
      'Facebook': 200,
      'Twitter': 150,
      'LinkedIn': 250,
      'Instagram': 175,
      'TikTok': 125,
      'YouTube': 300,
    };
    return bonuses[platform] || 100;
  }

  private getPeriodStart(period: string, now: Date): Date {
    switch (period) {
      case 'Daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'Weekly':
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'Monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'Quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'Yearly':
        return new Date(now.getFullYear(), 0, 1);
      default: // All-Time
        return new Date(2020, 0, 1);
    }
  }
}

export const socialFeaturesService = new SocialFeaturesService();