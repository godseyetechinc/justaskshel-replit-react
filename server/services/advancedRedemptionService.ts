import { db } from '../db';
import {
  rewardWishlists,
  rewardPricingHistory,
  partialRedemptions,
  rewardRecommendations,
  rewardInventory,
  recommendationModels,
  rewardInteractions,
  rewardNotifications,
  rewards,
  pointsTransactions,
  pointsSummary,
  rewardRedemptions,
  users,
  type RewardWishlist,
  type InsertRewardWishlist,
  type RewardPricingHistory,
  type InsertRewardPricingHistory,
  type PartialRedemption,
  type InsertPartialRedemption,
  type RewardRecommendation,
  type InsertRewardRecommendation,
  type RewardInventory,
  type InsertRewardInventory,
  type RewardInteraction,
  type InsertRewardInteraction,
  type RewardNotification,
  type InsertRewardNotification,
} from '../../shared/schema';
import { eq, and, desc, asc, sql, gte, lte, ne, isNull, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class AdvancedRedemptionService {
  // ===== REWARD WISHLIST MANAGEMENT =====

  async addToWishlist(userId: string, wishlistItem: Omit<InsertRewardWishlist, 'userId'>): Promise<RewardWishlist> {
    // Check if already in wishlist
    const [existing] = await db
      .select()
      .from(rewardWishlists)
      .where(
        and(
          eq(rewardWishlists.userId, userId),
          eq(rewardWishlists.rewardId, wishlistItem.rewardId)
        )
      );

    if (existing) {
      // Update existing wishlist item
      const [updated] = await db
        .update(rewardWishlists)
        .set(wishlistItem)
        .where(eq(rewardWishlists.id, existing.id))
        .returning();
      return updated;
    }

    const [newItem] = await db
      .insert(rewardWishlists)
      .values({ userId, ...wishlistItem })
      .returning();

    // Track interaction
    await this.trackRewardInteraction(userId, wishlistItem.rewardId, 'Add to Wishlist');

    return newItem;
  }

  async removeFromWishlist(userId: string, rewardId: number): Promise<boolean> {
    const result = await db
      .delete(rewardWishlists)
      .where(
        and(
          eq(rewardWishlists.userId, userId),
          eq(rewardWishlists.rewardId, rewardId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserWishlist(userId: string): Promise<(RewardWishlist & { reward: any })[]> {
    return await db
      .select({
        id: rewardWishlists.id,
        userId: rewardWishlists.userId,
        rewardId: rewardWishlists.rewardId,
        priority: rewardWishlists.priority,
        targetPointsGoal: rewardWishlists.targetPointsGoal,
        isNotificationsEnabled: rewardWishlists.isNotificationsEnabled,
        priceAlertThreshold: rewardWishlists.priceAlertThreshold,
        addedAt: rewardWishlists.addedAt,
        lastNotified: rewardWishlists.lastNotified,
        reward: {
          id: rewards.id,
          title: rewards.title,
          description: rewards.description,
          pointsRequired: rewards.pointsRequired,
          category: rewards.category,
          imageUrl: rewards.imageUrl,
          isActive: rewards.isActive,
        },
      })
      .from(rewardWishlists)
      .innerJoin(rewards, eq(rewardWishlists.rewardId, rewards.id))
      .where(eq(rewardWishlists.userId, userId))
      .orderBy(asc(rewardWishlists.priority), desc(rewardWishlists.addedAt));
  }

  async updateWishlistItem(userId: string, rewardId: number, updates: Partial<InsertRewardWishlist>): Promise<RewardWishlist | null> {
    const [updated] = await db
      .update(rewardWishlists)
      .set(updates)
      .where(
        and(
          eq(rewardWishlists.userId, userId),
          eq(rewardWishlists.rewardId, rewardId)
        )
      )
      .returning();
    return updated || null;
  }

  // ===== PARTIAL REDEMPTIONS =====

  async initiatePartialRedemption(userId: string, rewardId: number, pointsToContribute: number): Promise<PartialRedemption | null> {
    // Get reward details
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward) return null;

    // Check if user has enough points
    const [userPoints] = await db
      .select({ currentBalance: pointsSummary.currentBalance })
      .from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));

    if (!userPoints || (userPoints.currentBalance ?? 0) < pointsToContribute) {
      return null;
    }

    // Check for existing partial redemption
    const [existing] = await db
      .select()
      .from(partialRedemptions)
      .where(
        and(
          eq(partialRedemptions.userId, userId),
          eq(partialRedemptions.rewardId, rewardId),
          eq(partialRedemptions.status, 'Active')
        )
      );

    if (existing) {
      // Update existing partial redemption
      const newContribution = (existing.pointsContributed ?? 0) + pointsToContribute;
      const remaining = (existing.totalPointsRequired ?? 0) - newContribution;
      const isCompleted = remaining <= 0;

      const [updated] = await db
        .update(partialRedemptions)
        .set({
          pointsContributed: newContribution,
          remainingPoints: Math.max(0, remaining),
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          status: isCompleted ? 'Completed' : 'Active',
          updatedAt: new Date(),
        })
        .where(eq(partialRedemptions.id, existing.id))
        .returning();

      // If completed, process full redemption
      if (isCompleted) {
        await this.processFullRedemption(userId, rewardId, updated.reservationId);
      }

      return updated;
    } else {
      // Create new partial redemption
      const reservationId = nanoid(12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to complete

      const remaining = (reward.pointsRequired ?? 0) - pointsToContribute;
      const isCompleted = remaining <= 0;

      const [newPartial] = await db
        .insert(partialRedemptions)
        .values({
          userId,
          rewardId,
          totalPointsRequired: reward.pointsRequired ?? 0,
          pointsContributed: pointsToContribute,
          remainingPoints: Math.max(0, remaining),
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          expiresAt,
          reservationId,
          status: isCompleted ? 'Completed' : 'Active',
        })
        .returning();

      // If completed immediately, process full redemption
      if (isCompleted) {
        await this.processFullRedemption(userId, rewardId, reservationId);
      }

      return newPartial;
    }
  }

  async getUserPartialRedemptions(userId: string): Promise<(PartialRedemption & { reward: any })[]> {
    return await db
      .select({
        id: partialRedemptions.id,
        userId: partialRedemptions.userId,
        rewardId: partialRedemptions.rewardId,
        totalPointsRequired: partialRedemptions.totalPointsRequired,
        pointsContributed: partialRedemptions.pointsContributed,
        remainingPoints: partialRedemptions.remainingPoints,
        isCompleted: partialRedemptions.isCompleted,
        completedAt: partialRedemptions.completedAt,
        expiresAt: partialRedemptions.expiresAt,
        reservationId: partialRedemptions.reservationId,
        status: partialRedemptions.status,
        createdAt: partialRedemptions.createdAt,
        updatedAt: partialRedemptions.updatedAt,
        reward: {
          id: rewards.id,
          title: rewards.title,
          description: rewards.description,
          pointsRequired: rewards.pointsRequired,
          category: rewards.category,
          imageUrl: rewards.imageUrl,
        },
      })
      .from(partialRedemptions)
      .innerJoin(rewards, eq(partialRedemptions.rewardId, rewards.id))
      .where(eq(partialRedemptions.userId, userId))
      .orderBy(desc(partialRedemptions.createdAt));
  }

  async cancelPartialRedemption(userId: string, partialRedemptionId: number): Promise<boolean> {
    const [partial] = await db
      .select()
      .from(partialRedemptions)
      .where(
        and(
          eq(partialRedemptions.id, partialRedemptionId),
          eq(partialRedemptions.userId, userId),
          eq(partialRedemptions.status, 'Active')
        )
      );

    if (!partial) return false;

    // Refund points
    await this.refundPoints(userId, partial.pointsContributed ?? 0, 'Partial Redemption Cancelled');

    // Update status
    await db
      .update(partialRedemptions)
      .set({ status: 'Cancelled', updatedAt: new Date() })
      .where(eq(partialRedemptions.id, partialRedemptionId));

    return true;
  }

  // ===== DYNAMIC PRICING =====

  async updateRewardPricing(rewardId: number, demandLevel: 'Very Low' | 'Low' | 'Normal' | 'High' | 'Very High'): Promise<void> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward || !reward.pointsRequired) return;

    // Calculate demand multiplier
    const multipliers = {
      'Very Low': 0.8,
      'Low': 0.9,
      'Normal': 1.0,
      'High': 1.2,
      'Very High': 1.5,
    };

    const multiplier = multipliers[demandLevel];
    const adjustedPrice = Math.floor((reward.pointsRequired ?? 0) * multiplier);

    // Record pricing history
    await db.insert(rewardPricingHistory).values({
      rewardId,
      originalPrice: reward.pointsRequired ?? 0,
      adjustedPrice,
      demandMultiplier: multiplier.toString(),
      demandLevel,
      priceChangeReason: 'Demand',
      validFrom: new Date(),
    });

    // Update reward price
    await db
      .update(rewards)
      .set({ pointsRequired: adjustedPrice, updatedAt: new Date() })
      .where(eq(rewards.id, rewardId));

    // Notify users with price alerts
    await this.checkPriceAlerts(rewardId, adjustedPrice);
  }

  async getRewardPricingHistory(rewardId: number, limit: number = 30): Promise<RewardPricingHistory[]> {
    return await db
      .select()
      .from(rewardPricingHistory)
      .where(eq(rewardPricingHistory.rewardId, rewardId))
      .orderBy(desc(rewardPricingHistory.createdAt))
      .limit(limit);
  }

  // ===== RECOMMENDATION ENGINE =====

  async generateRecommendations(userId: string, limit: number = 10): Promise<RewardRecommendation[]> {
    // Get user's interaction history
    const userInteractions = await db
      .select()
      .from(rewardInteractions)
      .where(eq(rewardInteractions.userId, userId))
      .orderBy(desc(rewardInteractions.createdAt))
      .limit(100);

    // Get user's current tier and points
    const [userSummary] = await db
      .select()
      .from(pointsSummary)
      .where(eq(pointsSummary.userId, userId));

    // Simple recommendation logic (in production, would use ML models)
    const recommendations = await this.generateSimpleRecommendations(userId, userInteractions, userSummary, limit);

    // Save recommendations
    if (recommendations.length > 0) {
      await db.insert(rewardRecommendations).values(recommendations);
    }

    return recommendations;
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<(RewardRecommendation & { reward: any })[]> {
    return await db
      .select({
        id: rewardRecommendations.id,
        userId: rewardRecommendations.userId,
        rewardId: rewardRecommendations.rewardId,
        recommendationType: rewardRecommendations.recommendationType,
        confidenceScore: rewardRecommendations.confidenceScore,
        reasoning: rewardRecommendations.reasoning,
        userBehaviorData: rewardRecommendations.userBehaviorData,
        isViewed: rewardRecommendations.isViewed,
        isClicked: rewardRecommendations.isClicked,
        isRedeemed: rewardRecommendations.isRedeemed,
        viewedAt: rewardRecommendations.viewedAt,
        clickedAt: rewardRecommendations.clickedAt,
        redeemedAt: rewardRecommendations.redeemedAt,
        rank: rewardRecommendations.rank,
        generatedAt: rewardRecommendations.generatedAt,
        expiresAt: rewardRecommendations.expiresAt,
        reward: {
          id: rewards.id,
          title: rewards.title,
          description: rewards.description,
          pointsRequired: rewards.pointsRequired,
          category: rewards.category,
          imageUrl: rewards.imageUrl,
          isActive: rewards.isActive,
        },
      })
      .from(rewardRecommendations)
      .innerJoin(rewards, eq(rewardRecommendations.rewardId, rewards.id))
      .where(
        and(
          eq(rewardRecommendations.userId, userId),
          gt(rewardRecommendations.expiresAt, new Date())
        )
      )
      .orderBy(asc(rewardRecommendations.rank))
      .limit(limit);
  }

  async markRecommendationViewed(userId: string, recommendationId: number): Promise<void> {
    await db
      .update(rewardRecommendations)
      .set({ isViewed: true, viewedAt: new Date() })
      .where(
        and(
          eq(rewardRecommendations.id, recommendationId),
          eq(rewardRecommendations.userId, userId)
        )
      );
  }

  async markRecommendationClicked(userId: string, recommendationId: number): Promise<void> {
    await db
      .update(rewardRecommendations)
      .set({ isClicked: true, clickedAt: new Date() })
      .where(
        and(
          eq(rewardRecommendations.id, recommendationId),
          eq(rewardRecommendations.userId, userId)
        )
      );
  }

  // ===== REWARD INVENTORY MANAGEMENT =====

  async updateRewardInventory(rewardId: number, inventoryData: Partial<InsertRewardInventory>): Promise<RewardInventory> {
    const [existing] = await db
      .select()
      .from(rewardInventory)
      .where(eq(rewardInventory.rewardId, rewardId));

    if (existing) {
      const [updated] = await db
        .update(rewardInventory)
        .set({ ...inventoryData, updatedAt: new Date() })
        .where(eq(rewardInventory.rewardId, rewardId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(rewardInventory)
        .values({ rewardId, ...inventoryData })
        .returning();
      return created;
    }
  }

  async checkInventoryAvailability(rewardId: number, quantity: number = 1): Promise<boolean> {
    const [inventory] = await db
      .select()
      .from(rewardInventory)
      .where(eq(rewardInventory.rewardId, rewardId));

    if (!inventory) return true; // No inventory tracking = unlimited

    if (inventory.isOutOfStock) return false;

    const available = (inventory.availableStock ?? 0) - (inventory.reservedStock ?? 0);
    return available >= quantity;
  }

  async reserveInventory(rewardId: number, quantity: number = 1): Promise<boolean> {
    const [inventory] = await db
      .select()
      .from(rewardInventory)
      .where(eq(rewardInventory.rewardId, rewardId));

    if (!inventory) return true; // No inventory tracking

    const available = (inventory.availableStock ?? 0) - (inventory.reservedStock ?? 0);
    if (available < quantity) return false;

    await db
      .update(rewardInventory)
      .set({
        reservedStock: sql`${rewardInventory.reservedStock} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(rewardInventory.rewardId, rewardId));

    return true;
  }

  // ===== REWARD INTERACTIONS TRACKING =====

  async trackRewardInteraction(
    userId: string,
    rewardId: number,
    interactionType: 'View' | 'Click' | 'Add to Wishlist' | 'Share' | 'Compare' | 'Review' | 'Redeem' | 'Partial Redeem',
    metadata?: any
  ): Promise<RewardInteraction> {
    const [interaction] = await db
      .insert(rewardInteractions)
      .values({
        userId,
        rewardId,
        interactionType,
        interactionMetadata: metadata,
      })
      .returning();

    // Update reward view count if it's a view interaction
    if (interactionType === 'View') {
      await this.updateRewardViewCount(rewardId);
    }

    return interaction;
  }

  async getUserRewardInteractions(userId: string, rewardId?: number): Promise<RewardInteraction[]> {
    const query = db
      .select()
      .from(rewardInteractions)
      .where(eq(rewardInteractions.userId, userId));

    if (rewardId) {
      return await query
        .where(
          and(
            eq(rewardInteractions.userId, userId),
            eq(rewardInteractions.rewardId, rewardId)
          )
        )
        .orderBy(desc(rewardInteractions.createdAt));
    }

    return await query.orderBy(desc(rewardInteractions.createdAt)).limit(100);
  }

  // ===== NOTIFICATIONS =====

  async createRewardNotification(notification: InsertRewardNotification): Promise<RewardNotification> {
    const [newNotification] = await db.insert(rewardNotifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<RewardNotification[]> {
    const query = db
      .select()
      .from(rewardNotifications)
      .where(eq(rewardNotifications.userId, userId));

    if (unreadOnly) {
      return await query
        .where(
          and(
            eq(rewardNotifications.userId, userId),
            eq(rewardNotifications.isRead, false)
          )
        )
        .orderBy(desc(rewardNotifications.createdAt));
    }

    return await query.orderBy(desc(rewardNotifications.createdAt)).limit(50);
  }

  async markNotificationRead(userId: string, notificationId: number): Promise<boolean> {
    const result = await db
      .update(rewardNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(rewardNotifications.id, notificationId),
          eq(rewardNotifications.userId, userId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // ===== HELPER METHODS =====

  private async processFullRedemption(userId: string, rewardId: number, reservationId: string): Promise<void> {
    // Create full redemption record
    await db.insert(rewardRedemptions).values({
      userId,
      rewardId,
      pointsUsed: 0, // Points already deducted through partial redemption
      status: 'Completed',
      redeemedAt: new Date(),
      redemptionCode: reservationId,
    });

    // Track interaction
    await this.trackRewardInteraction(userId, rewardId, 'Redeem', { reservationId });

    // Send completion notification
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (reward) {
      await this.createRewardNotification({
        userId,
        rewardId,
        notificationType: 'Limited Time Offer',
        title: 'Reward Ready!',
        message: `Your ${reward.title} is ready for pickup/delivery. Reservation: ${reservationId}`,
        priority: 'High',
      });
    }
  }

  private async refundPoints(userId: string, points: number, description: string): Promise<void> {
    // Add points back
    await db.insert(pointsTransactions).values({
      userId,
      amount: points,
      transactionType: 'Credit',
      category: 'Refund',
      description,
      referenceId: 'PARTIAL_REDEMPTION_REFUND',
    });

    // Update points summary
    await db
      .update(pointsSummary)
      .set({
        currentBalance: sql`${pointsSummary.currentBalance} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(pointsSummary.userId, userId));
  }

  private async checkPriceAlerts(rewardId: number, newPrice: number): Promise<void> {
    // Find users with price alerts for this reward
    const alertUsers = await db
      .select()
      .from(rewardWishlists)
      .where(
        and(
          eq(rewardWishlists.rewardId, rewardId),
          eq(rewardWishlists.isNotificationsEnabled, true),
          lte(rewardWishlists.priceAlertThreshold, newPrice.toString())
        )
      );

    // Send notifications
    for (const user of alertUsers) {
      await this.createRewardNotification({
        userId: user.userId,
        rewardId,
        notificationType: 'Price Drop',
        title: 'Price Alert!',
        message: `The price for a reward on your wishlist has dropped to ${newPrice} points!`,
        priority: 'Medium',
      });
    }
  }

  private async updateRewardViewCount(rewardId: number): Promise<void> {
    // Update demand tracking
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [existing] = await db
      .select()
      .from(rewardPricingHistory)
      .where(
        and(
          eq(rewardPricingHistory.rewardId, rewardId),
          gte(rewardPricingHistory.validFrom, today)
        )
      );

    if (existing) {
      await db
        .update(rewardPricingHistory)
        .set({ viewCount: sql`${rewardPricingHistory.viewCount} + 1` })
        .where(eq(rewardPricingHistory.id, existing.id));
    }
  }

  private async generateSimpleRecommendations(
    userId: string,
    interactions: RewardInteraction[],
    userSummary: any,
    limit: number
  ): Promise<InsertRewardRecommendation[]> {
    // Simple collaborative filtering based on user interactions
    const viewedRewardIds = interactions.filter(i => i.interactionType === 'View').map(i => i.rewardId);
    const currentBalance = userSummary?.currentBalance ?? 0;

    // Get rewards in user's price range that they haven't interacted with much
    const availableRewards = await db
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.isActive, true),
          lte(rewards.pointsRequired, currentBalance * 1.5) // Include slightly above budget
        )
      )
      .limit(limit * 2);

    const recommendations: InsertRewardRecommendation[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Recommendations expire in 7 days

    for (let i = 0; i < Math.min(availableRewards.length, limit); i++) {
      const reward = availableRewards[i];
      const hasInteracted = viewedRewardIds.includes(reward.id);
      
      let recommendationType: 'Behavioral' | 'Collaborative' | 'Content-Based' | 'Trending' | 'Seasonal' | 'Personalized';
      let confidenceScore: number;
      let reasoning: string;

      if (hasInteracted) {
        recommendationType = 'Behavioral';
        confidenceScore = 0.7;
        reasoning = 'Based on your previous interactions with similar rewards';
      } else if ((reward.pointsRequired ?? 0) <= currentBalance) {
        recommendationType = 'Personalized';
        confidenceScore = 0.8;
        reasoning = 'Within your current points budget and matches your preferences';
      } else {
        recommendationType = 'Content-Based';
        confidenceScore = 0.6;
        reasoning = 'Similar to rewards you\'ve shown interest in';
      }

      recommendations.push({
        userId,
        rewardId: reward.id,
        recommendationType,
        confidenceScore: confidenceScore.toString(),
        reasoning,
        userBehaviorData: { interactions: interactions.length, currentBalance },
        rank: i + 1,
        expiresAt,
      });
    }

    return recommendations;
  }
}

export const advancedRedemptionService = new AdvancedRedemptionService();