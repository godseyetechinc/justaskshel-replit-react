import { db } from '../db';
import {
  seasonalCampaigns,
  campaignParticipations,
  seasonalAchievements,
  userSeasonalAchievements,
  pointsTransactions,
  pointsSummary,
  users,
  type SeasonalCampaign,
  type InsertSeasonalCampaign,
  type CampaignParticipation,
  type InsertCampaignParticipation,
  type SeasonalAchievement,
  type InsertSeasonalAchievement,
  type UserSeasonalAchievement,
  type InsertUserSeasonalAchievement,
} from '../../shared/schema';
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm';

export class SeasonalCampaignsService {
  // ===== CAMPAIGN MANAGEMENT =====

  async createCampaign(campaign: InsertSeasonalCampaign): Promise<SeasonalCampaign> {
    const [newCampaign] = await db.insert(seasonalCampaigns).values(campaign).returning();
    
    // Auto-start campaign if current date is within campaign period and autoStart is true
    if (campaign.autoStart && this.isCampaignActive(newCampaign)) {
      await this.activateCampaign(newCampaign.id);
    }
    
    return newCampaign;
  }

  async getCampaigns(activeOnly: boolean = false): Promise<SeasonalCampaign[]> {
    const query = db.select().from(seasonalCampaigns);
    
    if (activeOnly) {
      const now = new Date();
      return await query
        .where(
          and(
            eq(seasonalCampaigns.isActive, true),
            lte(seasonalCampaigns.startDate, now),
            gte(seasonalCampaigns.endDate, now)
          )
        )
        .orderBy(desc(seasonalCampaigns.startDate));
    }
    
    return await query.orderBy(desc(seasonalCampaigns.createdAt));
  }

  async getCampaign(id: number): Promise<SeasonalCampaign | null> {
    const [campaign] = await db.select().from(seasonalCampaigns).where(eq(seasonalCampaigns.id, id));
    return campaign || null;
  }

  async updateCampaign(id: number, updates: Partial<InsertSeasonalCampaign>): Promise<SeasonalCampaign | null> {
    const [updated] = await db
      .update(seasonalCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(seasonalCampaigns.id, id))
      .returning();
    return updated || null;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(seasonalCampaigns).where(eq(seasonalCampaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async activateCampaign(id: number): Promise<boolean> {
    const result = await db
      .update(seasonalCampaigns)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(seasonalCampaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deactivateCampaign(id: number): Promise<boolean> {
    const result = await db
      .update(seasonalCampaigns)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(seasonalCampaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ===== CAMPAIGN PARTICIPATION =====

  async joinCampaign(userId: string, campaignId: number): Promise<CampaignParticipation | null> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign || !campaign.isActive || !this.isCampaignActive(campaign)) {
      return null;
    }

    // Check if user already joined
    const [existing] = await db
      .select()
      .from(campaignParticipations)
      .where(
        and(
          eq(campaignParticipations.userId, userId),
          eq(campaignParticipations.campaignId, campaignId)
        )
      );

    if (existing) {
      return existing;
    }

    // Check participant limit
    if (campaign.maxParticipants && (campaign.currentParticipants ?? 0) >= campaign.maxParticipants) {
      return null;
    }

    // Join campaign
    const [participation] = await db
      .insert(campaignParticipations)
      .values({
        userId,
        campaignId,
        pointsEarned: 0,
        bonusPointsEarned: 0,
      })
      .returning();

    // Update participant count
    await db
      .update(seasonalCampaigns)
      .set({ 
        currentParticipants: sql`${seasonalCampaigns.currentParticipants} + 1`,
        updatedAt: new Date()
      })
      .where(eq(seasonalCampaigns.id, campaignId));

    return participation;
  }

  async getUserCampaignParticipation(userId: string, campaignId: number): Promise<CampaignParticipation | null> {
    const [participation] = await db
      .select()
      .from(campaignParticipations)
      .where(
        and(
          eq(campaignParticipations.userId, userId),
          eq(campaignParticipations.campaignId, campaignId)
        )
      );
    return participation || null;
  }

  async getUserActiveCampaigns(userId: string): Promise<SeasonalCampaign[]> {
    const activeCampaigns = await db
      .select({
        id: seasonalCampaigns.id,
        name: seasonalCampaigns.name,
        description: seasonalCampaigns.description,
        campaignType: seasonalCampaigns.campaignType,
        pointsMultiplier: seasonalCampaigns.pointsMultiplier,
        bonusPoints: seasonalCampaigns.bonusPoints,
        isActive: seasonalCampaigns.isActive,
        autoStart: seasonalCampaigns.autoStart,
        autoEnd: seasonalCampaigns.autoEnd,
        startDate: seasonalCampaigns.startDate,
        endDate: seasonalCampaigns.endDate,
        targetUserTiers: seasonalCampaigns.targetUserTiers,
        targetCategories: seasonalCampaigns.targetCategories,
        maxParticipants: seasonalCampaigns.maxParticipants,
        currentParticipants: seasonalCampaigns.currentParticipants,
        conditions: seasonalCampaigns.conditions,
        createdAt: seasonalCampaigns.createdAt,
        updatedAt: seasonalCampaigns.updatedAt,
      })
      .from(campaignParticipations)
      .innerJoin(seasonalCampaigns, eq(campaignParticipations.campaignId, seasonalCampaigns.id))
      .where(
        and(
          eq(campaignParticipations.userId, userId),
          eq(campaignParticipations.isActive, true),
          eq(seasonalCampaigns.isActive, true)
        )
      );

    return activeCampaigns;
  }

  // ===== POINTS CALCULATION WITH CAMPAIGN BONUSES =====

  async calculateCampaignBonusPoints(
    userId: string,
    category: string,
    basePoints: number,
    userTier: string
  ): Promise<{ multipliedPoints: number; bonusPoints: number; appliedCampaigns: SeasonalCampaign[] }> {
    const activeCampaigns = await this.getUserActiveCampaigns(userId);
    let totalMultiplier = 1.0;
    let totalBonusPoints = 0;
    const appliedCampaigns: SeasonalCampaign[] = [];

    for (const campaign of activeCampaigns) {
      // Check if campaign applies to this user tier
      if (campaign.targetUserTiers && campaign.targetUserTiers.length > 0 && !campaign.targetUserTiers.includes(userTier)) {
        continue;
      }

      // Check if campaign applies to this category
      if (campaign.targetCategories && campaign.targetCategories.length > 0 && !campaign.targetCategories.includes(category)) {
        continue;
      }

      // Apply multiplier
      if (campaign.pointsMultiplier) {
        totalMultiplier *= parseFloat(campaign.pointsMultiplier.toString());
      }

      // Apply bonus points
      if (campaign.bonusPoints && campaign.bonusPoints > 0) {
        totalBonusPoints += campaign.bonusPoints;
      }

      appliedCampaigns.push(campaign);

      // Update participation points
      await db
        .update(campaignParticipations)
        .set({
          pointsEarned: sql`${campaignParticipations.pointsEarned} + ${basePoints}`,
          bonusPointsEarned: sql`${campaignParticipations.bonusPointsEarned} + ${campaign.bonusPoints ?? 0}`,
        })
        .where(
          and(
            eq(campaignParticipations.userId, userId),
            eq(campaignParticipations.campaignId, campaign.id)
          )
        );
    }

    const multipliedPoints = Math.floor(basePoints * totalMultiplier);
    return { multipliedPoints, bonusPoints: totalBonusPoints, appliedCampaigns };
  }

  // ===== SEASONAL ACHIEVEMENTS =====

  async createSeasonalAchievement(achievement: InsertSeasonalAchievement): Promise<SeasonalAchievement> {
    const [newAchievement] = await db.insert(seasonalAchievements).values(achievement).returning();
    return newAchievement;
  }

  async getCampaignAchievements(campaignId: number): Promise<SeasonalAchievement[]> {
    return await db
      .select()
      .from(seasonalAchievements)
      .where(
        and(
          eq(seasonalAchievements.campaignId, campaignId),
          eq(seasonalAchievements.isActive, true)
        )
      )
      .orderBy(asc(seasonalAchievements.unlockOrder));
  }

  async getUserSeasonalAchievements(userId: string, campaignId?: number): Promise<UserSeasonalAchievement[]> {
    if (campaignId) {
      return await db
        .select()
        .from(userSeasonalAchievements)
        .where(
          and(
            eq(userSeasonalAchievements.userId, userId),
            eq(userSeasonalAchievements.campaignId, campaignId)
          )
        );
    }

    return await db
      .select()
      .from(userSeasonalAchievements)
      .where(eq(userSeasonalAchievements.userId, userId))
      .orderBy(desc(userSeasonalAchievements.unlockedAt));
  }

  async checkAndUnlockSeasonalAchievements(userId: string, campaignId: number): Promise<SeasonalAchievement[]> {
    const unlockedAchievements: SeasonalAchievement[] = [];
    const campaignAchievements = await this.getCampaignAchievements(campaignId);
    const userAchievements = await this.getUserSeasonalAchievements(userId, campaignId);

    for (const achievement of campaignAchievements) {
      // Check if user already has this achievement
      const hasAchievement = userAchievements.some(ua => ua.achievementId === achievement.id);
      
      if (!hasAchievement || achievement.isRepeatable) {
        // Check achievement requirements (simplified - would need more complex logic for real implementation)
        const canUnlock = await this.checkAchievementRequirement(userId, campaignId, achievement);
        
        if (canUnlock) {
          // Award achievement
          const userTier = await this.getUserTier(userId);
          await db.insert(userSeasonalAchievements).values({
            userId,
            achievementId: achievement.id,
            campaignId,
            pointsAwarded: achievement.pointsReward ?? 0,
            tier: userTier,
            progressData: {},
          });

          // Award points if applicable
          if (achievement.pointsReward && achievement.pointsReward > 0) {
            await this.awardAchievementPoints(userId, achievement.pointsReward, achievement.name);
          }

          unlockedAchievements.push(achievement);
        }
      }
    }

    return unlockedAchievements;
  }

  // ===== CAMPAIGN AUTOMATION =====

  async processAutomaticCampaignActivation(): Promise<void> {
    const now = new Date();
    
    // Auto-start campaigns
    const campaignsToStart = await db
      .select()
      .from(seasonalCampaigns)
      .where(
        and(
          eq(seasonalCampaigns.autoStart, true),
          eq(seasonalCampaigns.isActive, false),
          lte(seasonalCampaigns.startDate, now),
          gte(seasonalCampaigns.endDate, now)
        )
      );

    for (const campaign of campaignsToStart) {
      await this.activateCampaign(campaign.id);
      console.log(`Auto-started campaign: ${campaign.name}`);
    }

    // Auto-end campaigns
    const campaignsToEnd = await db
      .select()
      .from(seasonalCampaigns)
      .where(
        and(
          eq(seasonalCampaigns.autoEnd, true),
          eq(seasonalCampaigns.isActive, true),
          lte(seasonalCampaigns.endDate, now)
        )
      );

    for (const campaign of campaignsToEnd) {
      await this.deactivateCampaign(campaign.id);
      console.log(`Auto-ended campaign: ${campaign.name}`);
    }
  }

  // ===== HELPER METHODS =====

  private isCampaignActive(campaign: SeasonalCampaign): boolean {
    const now = new Date();
    return campaign.isActive && 
           new Date(campaign.startDate) <= now && 
           new Date(campaign.endDate) >= now;
  }

  private async checkAchievementRequirement(
    userId: string, 
    campaignId: number, 
    achievement: SeasonalAchievement
  ): Promise<boolean> {
    // Simplified requirement checking - in a real implementation, this would be more sophisticated
    const participation = await this.getUserCampaignParticipation(userId, campaignId);
    if (!participation) return false;

    const requirement = achievement.requirement as any;
    if (!requirement) return true;

    // Example: Check if user earned enough points in campaign
    if (requirement.minCampaignPoints && (participation.pointsEarned ?? 0) < requirement.minCampaignPoints) {
      return false;
    }

    return true;
  }

  private async getUserTier(userId: string): Promise<string> {
    const [summary] = await db
      .select({ tierLevel: pointsSummary.tierLevel })
      .from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));
    return summary?.tierLevel || 'Bronze';
  }

  private async awardAchievementPoints(userId: string, points: number, achievementName: string): Promise<void> {
    // Award points for achievement (simplified implementation)
    await db.insert(pointsTransactions).values({
      userId,
      amount: points,
      transactionType: 'Credit',
      category: 'Achievement',
      description: `Seasonal Achievement: ${achievementName}`,
      referenceId: 'SEASONAL_ACHIEVEMENT',
    });

    // Update points summary
    await db
      .update(pointsSummary)
      .set({
        totalEarned: sql`${pointsSummary.totalEarned} + ${points}`,
        currentBalance: sql`${pointsSummary.currentBalance} + ${points}`,
        lifetimeBalance: sql`${pointsSummary.lifetimeBalance} + ${points}`,
        lastEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pointsSummary.userId, userId));
  }

  // ===== ANALYTICS =====

  async getCampaignAnalytics(campaignId: number) {
    const [campaign] = await db
      .select()
      .from(seasonalCampaigns)
      .where(eq(seasonalCampaigns.id, campaignId));

    if (!campaign) return null;

    const [stats] = await db
      .select({
        totalParticipants: sql<number>`count(${campaignParticipations.id})::int`,
        totalPointsEarned: sql<number>`sum(${campaignParticipations.pointsEarned})::int`,
        totalBonusPoints: sql<number>`sum(${campaignParticipations.bonusPointsEarned})::int`,
        avgPointsPerUser: sql<number>`avg(${campaignParticipations.pointsEarned})::int`,
      })
      .from(campaignParticipations)
      .where(eq(campaignParticipations.campaignId, campaignId));

    return {
      campaign,
      analytics: stats || {
        totalParticipants: 0,
        totalPointsEarned: 0,
        totalBonusPoints: 0,
        avgPointsPerUser: 0,
      },
    };
  }

  async getActiveCampaignsSummary() {
    const now = new Date();
    const activeCampaigns = await db
      .select()
      .from(seasonalCampaigns)
      .where(
        and(
          eq(seasonalCampaigns.isActive, true),
          lte(seasonalCampaigns.startDate, now),
          gte(seasonalCampaigns.endDate, now)
        )
      );

    const summary = [];
    for (const campaign of activeCampaigns) {
      const analytics = await this.getCampaignAnalytics(campaign.id);
      summary.push(analytics);
    }

    return summary;
  }
}

export const seasonalCampaignsService = new SeasonalCampaignsService();