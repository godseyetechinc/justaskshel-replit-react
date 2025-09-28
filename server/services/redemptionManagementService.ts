import { db } from "../db";
import { rewardRedemptions, rewards, users, pointsTransactions } from "../../shared/schema";
import { eq, desc, asc, and, or, sql, count, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export class RedemptionManagementService {
  
  // Generate a unique redemption code
  private generateRedemptionCode(): string {
    return `RDM-${nanoid(8).toUpperCase()}`;
  }

  // Get all redemptions with filtering for admin management
  async getAllRedemptions(filters?: {
    status?: string;
    userId?: string;
    rewardId?: number;
    deliveryMethod?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    sortBy?: 'createdAt' | 'deliveredAt' | 'pointsUsed' | 'status';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) {
    try {
      const { 
        status, 
        userId, 
        rewardId,
        deliveryMethod,
        dateFrom,
        dateTo,
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc', 
        limit = 50, 
        offset = 0 
      } = filters || {};

      // Build where conditions
      const conditions: any[] = [];
      
      if (status) {
        conditions.push(eq(rewardRedemptions.status, status));
      }
      
      if (userId) {
        conditions.push(eq(rewardRedemptions.userId, userId));
      }
      
      if (rewardId) {
        conditions.push(eq(rewardRedemptions.rewardId, rewardId));
      }

      if (deliveryMethod) {
        conditions.push(eq(rewardRedemptions.deliveryMethod, deliveryMethod));
      }

      if (dateFrom) {
        conditions.push(sql`${rewardRedemptions.createdAt} >= ${dateFrom}`);
      }

      if (dateTo) {
        conditions.push(sql`${rewardRedemptions.createdAt} <= ${dateTo}`);
      }
      
      if (search) {
        conditions.push(
          or(
            sql`${rewardRedemptions.redemptionCode} ILIKE ${`%${search}%`}`,
            sql`${users.email} ILIKE ${`%${search}%`}`,
            sql`${rewards.name} ILIKE ${`%${search}%`}`
          )
        );
      }

      // Build sort order
      const orderBy = sortOrder === 'asc' ? asc : desc;
      let sortColumn: any;
      switch (sortBy) {
        case 'deliveredAt':
          sortColumn = rewardRedemptions.deliveredAt;
          break;
        case 'pointsUsed':
          sortColumn = rewardRedemptions.pointsUsed;
          break;
        case 'status':
          sortColumn = rewardRedemptions.status;
          break;
        default:
          sortColumn = rewardRedemptions.createdAt;
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(rewardRedemptions)
        .leftJoin(users, eq(rewardRedemptions.userId, users.id))
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get redemptions with user and reward details
      const redemptions = await db
        .select({
          id: rewardRedemptions.id,
          userId: rewardRedemptions.userId,
          rewardId: rewardRedemptions.rewardId,
          pointsTransactionId: rewardRedemptions.pointsTransactionId,
          pointsUsed: rewardRedemptions.pointsUsed,
          status: rewardRedemptions.status,
          redemptionCode: rewardRedemptions.redemptionCode,
          deliveryMethod: rewardRedemptions.deliveryMethod,
          deliveryAddress: rewardRedemptions.deliveryAddress,
          deliveredAt: rewardRedemptions.deliveredAt,
          expiresAt: rewardRedemptions.expiresAt,
          notes: rewardRedemptions.notes,
          createdAt: rewardRedemptions.createdAt,
          updatedAt: rewardRedemptions.updatedAt,
          // User details - using correct field names
          userEmail: users.email,
          // Reward details - using correct field names
          rewardName: rewards.name,
          rewardDescription: rewards.description,
          rewardCategory: rewards.category
        })
        .from(rewardRedemptions)
        .leftJoin(users, eq(rewardRedemptions.userId, users.id))
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset(offset);

      return {
        redemptions,
        total: totalResult.count
      };
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      throw new Error('Failed to fetch redemptions');
    }
  }

  // Get redemption by ID with full details
  async getRedemptionById(id: number) {
    try {
      const [redemption] = await db
        .select({
          id: rewardRedemptions.id,
          userId: rewardRedemptions.userId,
          rewardId: rewardRedemptions.rewardId,
          pointsTransactionId: rewardRedemptions.pointsTransactionId,
          pointsUsed: rewardRedemptions.pointsUsed,
          status: rewardRedemptions.status,
          redemptionCode: rewardRedemptions.redemptionCode,
          deliveryMethod: rewardRedemptions.deliveryMethod,
          deliveryAddress: rewardRedemptions.deliveryAddress,
          deliveredAt: rewardRedemptions.deliveredAt,
          expiresAt: rewardRedemptions.expiresAt,
          notes: rewardRedemptions.notes,
          createdAt: rewardRedemptions.createdAt,
          updatedAt: rewardRedemptions.updatedAt,
          // User details - using correct field names
          userEmail: users.email,
          // Reward details - using correct field names
          rewardName: rewards.name,
          rewardDescription: rewards.description,
          rewardCategory: rewards.category,
          rewardPointsCost: rewards.pointsCost
        })
        .from(rewardRedemptions)
        .leftJoin(users, eq(rewardRedemptions.userId, users.id))
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(eq(rewardRedemptions.id, id))
        .limit(1);

      return redemption || null;
    } catch (error) {
      console.error('Error fetching redemption:', error);
      throw new Error('Failed to fetch redemption');
    }
  }

  // Update redemption status (Admin function)
  async updateRedemptionStatus(id: number, status: string, adminNotes?: string, deliveryData?: {
    deliveryMethod?: string;
    deliveryAddress?: string;
    deliveredAt?: Date;
  }) {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (adminNotes) {
        updateData.notes = adminNotes;
      }

      if (deliveryData) {
        if (deliveryData.deliveryMethod) {
          updateData.deliveryMethod = deliveryData.deliveryMethod;
        }
        if (deliveryData.deliveryAddress) {
          updateData.deliveryAddress = deliveryData.deliveryAddress;
        }
        if (deliveryData.deliveredAt) {
          updateData.deliveredAt = deliveryData.deliveredAt;
        }
      }

      // If status is being set to "Delivered", set deliveredAt if not provided
      if (status === "Delivered" && !deliveryData?.deliveredAt) {
        updateData.deliveredAt = new Date();
      }

      const [updatedRedemption] = await db
        .update(rewardRedemptions)
        .set(updateData)
        .where(eq(rewardRedemptions.id, id))
        .returning();

      if (!updatedRedemption) {
        throw new Error('Redemption not found');
      }

      console.log(`Updated redemption ${id} to status: ${status}`);
      return updatedRedemption;
    } catch (error) {
      console.error('Error updating redemption status:', error);
      throw new Error('Failed to update redemption status');
    }
  }

  // Generate redemption code for approved redemptions
  async generateAndAssignRedemptionCode(id: number): Promise<string> {
    try {
      const redemptionCode = this.generateRedemptionCode();
      
      const [updatedRedemption] = await db
        .update(rewardRedemptions)
        .set({
          redemptionCode,
          status: 'Approved',
          updatedAt: new Date()
        })
        .where(eq(rewardRedemptions.id, id))
        .returning();

      if (!updatedRedemption) {
        throw new Error('Redemption not found');
      }

      console.log(`Generated redemption code ${redemptionCode} for redemption ${id}`);
      return redemptionCode;
    } catch (error) {
      console.error('Error generating redemption code:', error);
      throw new Error('Failed to generate redemption code');
    }
  }

  // Bulk update redemptions status
  async bulkUpdateRedemptions(ids: number[], status: string, adminNotes?: string): Promise<number> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (adminNotes) {
        updateData.notes = adminNotes;
      }

      if (status === "Delivered") {
        updateData.deliveredAt = new Date();
      }

      const result = await db
        .update(rewardRedemptions)
        .set(updateData)
        .where(inArray(rewardRedemptions.id, ids))
        .returning();

      console.log(`Bulk updated ${result.length} redemptions to status: ${status}`);
      return result.length;
    } catch (error) {
      console.error('Error bulk updating redemptions:', error);
      throw new Error('Failed to bulk update redemptions');
    }
  }

  // Get redemption statistics for admin dashboard
  async getRedemptionStats(dateRange?: { from: Date; to: Date }) {
    try {
      const conditions: any[] = [];
      
      if (dateRange) {
        conditions.push(
          and(
            sql`${rewardRedemptions.createdAt} >= ${dateRange.from}`,
            sql`${rewardRedemptions.createdAt} <= ${dateRange.to}`
          )
        );
      }

      // Overall stats
      const [overallStats] = await db
        .select({
          totalRedemptions: count(),
          totalPointsUsed: sql<number>`COALESCE(SUM(${rewardRedemptions.pointsUsed}), 0)`,
          avgPointsUsed: sql<number>`COALESCE(AVG(${rewardRedemptions.pointsUsed}), 0)`
        })
        .from(rewardRedemptions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Status breakdown
      const statusStats = await db
        .select({
          status: rewardRedemptions.status,
          count: count(),
          totalPoints: sql<number>`COALESCE(SUM(${rewardRedemptions.pointsUsed}), 0)`
        })
        .from(rewardRedemptions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(rewardRedemptions.status)
        .orderBy(desc(count()));

      // Popular rewards
      const popularRewards = await db
        .select({
          rewardId: rewardRedemptions.rewardId,
          rewardName: rewards.name,
          redemptionCount: count(),
          totalPointsUsed: sql<number>`COALESCE(SUM(${rewardRedemptions.pointsUsed}), 0)`
        })
        .from(rewardRedemptions)
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(rewardRedemptions.rewardId, rewards.name)
        .orderBy(desc(count()))
        .limit(10);

      // Delivery method breakdown
      const deliveryStats = await db
        .select({
          deliveryMethod: rewardRedemptions.deliveryMethod,
          count: count()
        })
        .from(rewardRedemptions)
        .where(
          and(
            sql`${rewardRedemptions.deliveryMethod} IS NOT NULL`,
            ...(conditions.length > 0 ? conditions : [])
          )
        )
        .groupBy(rewardRedemptions.deliveryMethod)
        .orderBy(desc(count()));

      return {
        overall: overallStats,
        byStatus: statusStats,
        popularRewards,
        byDeliveryMethod: deliveryStats
      };
    } catch (error) {
      console.error('Error fetching redemption stats:', error);
      throw new Error('Failed to fetch redemption statistics');
    }
  }

  // Get pending redemptions queue for admin processing
  async getPendingRedemptionsQueue(limit: number = 50, offset: number = 0) {
    try {
      const pendingRedemptions = await db
        .select({
          id: rewardRedemptions.id,
          userId: rewardRedemptions.userId,
          rewardId: rewardRedemptions.rewardId,
          pointsUsed: rewardRedemptions.pointsUsed,
          status: rewardRedemptions.status,
          createdAt: rewardRedemptions.createdAt,
          expiresAt: rewardRedemptions.expiresAt,
          // User details - using correct field names
          userEmail: users.email,
          // Reward details - using correct field names
          rewardName: rewards.name,
          rewardCategory: rewards.category,
          rewardPointsCost: rewards.pointsCost
        })
        .from(rewardRedemptions)
        .leftJoin(users, eq(rewardRedemptions.userId, users.id))
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(eq(rewardRedemptions.status, 'Pending'))
        .orderBy(asc(rewardRedemptions.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(rewardRedemptions)
        .where(eq(rewardRedemptions.status, 'Pending'));

      return {
        redemptions: pendingRedemptions,
        total: totalCount.count
      };
    } catch (error) {
      console.error('Error fetching pending redemptions queue:', error);
      throw new Error('Failed to fetch pending redemptions queue');
    }
  }

  // Get expiring redemptions that need attention
  async getExpiringRedemptions(daysAhead: number = 7) {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysAhead);

      const expiringRedemptions = await db
        .select({
          id: rewardRedemptions.id,
          userId: rewardRedemptions.userId,
          status: rewardRedemptions.status,
          expiresAt: rewardRedemptions.expiresAt,
          createdAt: rewardRedemptions.createdAt,
          // User details - using correct field names
          userEmail: users.email,
          // Reward details - using correct field names
          rewardName: rewards.name,
          pointsUsed: rewardRedemptions.pointsUsed
        })
        .from(rewardRedemptions)
        .leftJoin(users, eq(rewardRedemptions.userId, users.id))
        .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(
          and(
            sql`${rewardRedemptions.expiresAt} IS NOT NULL`,
            sql`${rewardRedemptions.expiresAt} <= ${expirationDate}`,
            sql`${rewardRedemptions.status} NOT IN ('Delivered', 'Cancelled', 'Expired')`
          )
        )
        .orderBy(asc(rewardRedemptions.expiresAt));

      return expiringRedemptions;
    } catch (error) {
      console.error('Error fetching expiring redemptions:', error);
      throw new Error('Failed to fetch expiring redemptions');
    }
  }
}