import { db } from "../db";
import { pointsTransactions, pointsSummary, users, rewards, rewardRedemptions } from "../../shared/schema";
import { eq, sql, inArray, and, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface BulkAwardRequest {
  userIds: string[];
  points: number;
  reason: string;
  description?: string;
  category?: string;
  campaignId?: string;
}

export interface BulkRewardDistribution {
  userIds: string[];
  rewardId: number;
  reason: string;
  campaignId?: string;
}

export interface CampaignPointsDistribution {
  campaignName: string;
  points: number;
  reason: string;
  description?: string;
  filters: {
    role?: string;
    tierLevel?: string;
    registrationDateFrom?: Date;
    registrationDateTo?: Date;
    minPoints?: number;
    maxPoints?: number;
    organizationId?: number;
  };
}

export interface BulkOperationAuditLog {
  id: string;
  operationType: 'bulk_award' | 'bulk_reward' | 'campaign_distribution';
  adminUserId: string;
  targetCount: number;
  successCount: number;
  failCount: number;
  totalPoints?: number;
  campaignId?: string;
  reason: string;
  details: any;
  createdAt: Date;
}

export class BulkOperationsService {
  
  // Generate unique campaign/operation ID
  private generateOperationId(): string {
    return `OP-${nanoid(8).toUpperCase()}`;
  }

  // Bulk award points to multiple users
  async bulkAwardPoints(request: BulkAwardRequest, adminUserId: string): Promise<{
    operationId: string;
    successCount: number;
    failCount: number;
    errors: string[];
  }> {
    const operationId = this.generateOperationId();
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      console.log(`Starting bulk points award operation ${operationId} for ${request.userIds.length} users`);

      // Validate users exist
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, request.userIds));

      if (existingUsers.length !== request.userIds.length) {
        const existingUserIds = existingUsers.map(u => u.id);
        const missingUserIds = request.userIds.filter(id => !existingUserIds.includes(id));
        errors.push(`Users not found: ${missingUserIds.join(', ')}`);
      }

      // Process each valid user
      for (const user of existingUsers) {
        try {
          await db.transaction(async (tx) => {
            // Create points transaction
            const [pointsTransaction] = await tx
              .insert(pointsTransactions)
              .values({
                userId: user.id,
                points: request.points,
                type: "Earned",
                reason: request.reason,
                description: request.description || `Bulk award: ${request.reason}`,
                category: request.category,
                reference: request.campaignId || operationId,
                createdAt: new Date()
              })
              .returning();

            // Update points summary
            await tx
              .update(pointsSummary)
              .set({
                totalEarned: sql`${pointsSummary.totalEarned} + ${request.points}`,
                currentBalance: sql`${pointsSummary.currentBalance} + ${request.points}`,
                lifetimePoints: sql`${pointsSummary.lifetimePoints} + ${request.points}`,
                updatedAt: new Date()
              })
              .where(eq(pointsSummary.userId, user.id));

            // Create summary if it doesn't exist
            const summaryExists = await tx
              .select({ id: pointsSummary.id })
              .from(pointsSummary)
              .where(eq(pointsSummary.userId, user.id))
              .limit(1);

            if (summaryExists.length === 0) {
              await tx.insert(pointsSummary).values({
                userId: user.id,
                currentBalance: request.points,
                totalEarned: request.points,
                totalRedeemed: 0,
                lifetimePoints: request.points,
                tierLevel: "Bronze",
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          });

          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error awarding points to user ${user.id}:`, error);
          errors.push(`Failed to award points to user ${user.id}: ${error.message}`);
        }
      }

      // Log audit trail
      await this.logBulkOperation({
        id: operationId,
        operationType: 'bulk_award',
        adminUserId,
        targetCount: request.userIds.length,
        successCount,
        failCount,
        totalPoints: successCount * request.points,
        campaignId: request.campaignId,
        reason: request.reason,
        details: {
          pointsPerUser: request.points,
          category: request.category,
          userIds: request.userIds,
          errors: errors.slice(0, 10) // Limit stored errors
        },
        createdAt: new Date()
      });

      console.log(`Bulk award operation ${operationId} completed: ${successCount} success, ${failCount} failed`);

      return {
        operationId,
        successCount,
        failCount,
        errors
      };
    } catch (error) {
      console.error('Error in bulk award operation:', error);
      throw new Error('Failed to execute bulk points award');
    }
  }

  // Mass reward distribution
  async bulkDistributeRewards(request: BulkRewardDistribution, adminUserId: string): Promise<{
    operationId: string;
    successCount: number;
    failCount: number;
    errors: string[];
  }> {
    const operationId = this.generateOperationId();
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      console.log(`Starting bulk reward distribution ${operationId} for ${request.userIds.length} users`);

      // Get reward details
      const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, request.rewardId))
        .limit(1);

      if (!reward) {
        throw new Error('Reward not found');
      }

      if (!reward.isActive) {
        throw new Error('Cannot distribute inactive reward');
      }

      // Validate users have enough points
      const usersWithPoints = await db
        .select({
          userId: pointsSummary.userId,
          currentBalance: pointsSummary.currentBalance
        })
        .from(pointsSummary)
        .where(
          and(
            inArray(pointsSummary.userId, request.userIds),
            gte(pointsSummary.currentBalance, reward.pointsRequired)
          )
        );

      const eligibleUserIds = usersWithPoints.map(u => u.userId);
      const ineligibleUserIds = request.userIds.filter(id => !eligibleUserIds.includes(id));

      if (ineligibleUserIds.length > 0) {
        errors.push(`Users with insufficient points: ${ineligibleUserIds.join(', ')}`);
      }

      // Process eligible users
      for (const userWithPoints of usersWithPoints) {
        try {
          await db.transaction(async (tx) => {
            // Create redemption record
            await tx.insert(rewardRedemptions).values({
              userId: userWithPoints.userId,
              rewardId: request.rewardId,
              pointsUsed: reward.pointsRequired,
              status: 'Approved', // Auto-approve bulk distributions
              redemptionCode: `BULK-${nanoid(8).toUpperCase()}`,
              deliveryMethod: 'Account Credit',
              notes: `Bulk distribution: ${request.reason}`,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Deduct points from summary
            await tx
              .update(pointsSummary)
              .set({
                currentBalance: sql`${pointsSummary.currentBalance} - ${reward.pointsRequired}`,
                totalRedeemed: sql`${pointsSummary.totalRedeemed} + ${reward.pointsRequired}`,
                updatedAt: new Date()
              })
              .where(eq(pointsSummary.userId, userWithPoints.userId));

            // Create deduction transaction
            await tx.insert(pointsTransactions).values({
              userId: userWithPoints.userId,
              points: -reward.pointsRequired,
              type: "Redeemed",
              reason: `Bulk reward: ${reward.name}`,
              description: request.reason,
              reference: operationId,
              createdAt: new Date()
            });
          });

          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error distributing reward to user ${userWithPoints.userId}:`, error);
          errors.push(`Failed to distribute reward to user ${userWithPoints.userId}: ${error.message}`);
        }
      }

      // Log audit trail
      await this.logBulkOperation({
        id: operationId,
        operationType: 'bulk_reward',
        adminUserId,
        targetCount: request.userIds.length,
        successCount,
        failCount,
        totalPoints: successCount * reward.pointsRequired,
        campaignId: request.campaignId,
        reason: request.reason,
        details: {
          rewardId: request.rewardId,
          rewardName: reward.name,
          pointsPerReward: reward.pointsRequired,
          userIds: request.userIds,
          ineligibleUsers: ineligibleUserIds,
          errors: errors.slice(0, 10)
        },
        createdAt: new Date()
      });

      console.log(`Bulk reward distribution ${operationId} completed: ${successCount} success, ${failCount} failed`);

      return {
        operationId,
        successCount,
        failCount,
        errors
      };
    } catch (error) {
      console.error('Error in bulk reward distribution:', error);
      throw new Error('Failed to execute bulk reward distribution');
    }
  }

  // Campaign-based point distribution with user filtering
  async distributeCampaignPoints(campaign: CampaignPointsDistribution, adminUserId: string): Promise<{
    operationId: string;
    successCount: number;
    failCount: number;
    targetUsers: number;
    errors: string[];
  }> {
    const operationId = this.generateOperationId();

    try {
      console.log(`Starting campaign points distribution: ${campaign.campaignName}`);

      // Build user query with filters
      let userQuery = db.select({ id: users.id }).from(users);
      const conditions: any[] = [eq(users.isActive, true)];

      // Apply filters
      if (campaign.filters.role) {
        conditions.push(eq(users.role, campaign.filters.role));
      }

      if (campaign.filters.organizationId) {
        conditions.push(eq(users.organizationId, campaign.filters.organizationId));
      }

      if (campaign.filters.registrationDateFrom) {
        conditions.push(gte(users.createdAt, campaign.filters.registrationDateFrom));
      }

      if (campaign.filters.registrationDateTo) {
        conditions.push(lte(users.createdAt, campaign.filters.registrationDateTo));
      }

      // Add points-based filters if specified
      if (campaign.filters.minPoints || campaign.filters.maxPoints || campaign.filters.tierLevel) {
        userQuery = db
          .select({ id: users.id })
          .from(users)
          .leftJoin(pointsSummary, eq(users.id, pointsSummary.userId));

        if (campaign.filters.minPoints) {
          conditions.push(gte(pointsSummary.lifetimePoints, campaign.filters.minPoints));
        }

        if (campaign.filters.maxPoints) {
          conditions.push(lte(pointsSummary.lifetimePoints, campaign.filters.maxPoints));
        }

        if (campaign.filters.tierLevel) {
          conditions.push(eq(pointsSummary.tierLevel, campaign.filters.tierLevel));
        }
      }

      // Execute filtered user query
      const targetUsers = await userQuery.where(and(...conditions));
      const targetUserIds = targetUsers.map(u => u.id);

      console.log(`Campaign targeting ${targetUserIds.length} users`);

      // Execute bulk award
      const result = await this.bulkAwardPoints({
        userIds: targetUserIds,
        points: campaign.points,
        reason: campaign.reason,
        description: campaign.description || `Campaign: ${campaign.campaignName}`,
        category: "Campaign",
        campaignId: operationId
      }, adminUserId);

      // Additional audit log for campaign
      await this.logBulkOperation({
        id: `CAMP-${operationId}`,
        operationType: 'campaign_distribution',
        adminUserId,
        targetCount: targetUserIds.length,
        successCount: result.successCount,
        failCount: result.failCount,
        totalPoints: result.successCount * campaign.points,
        campaignId: operationId,
        reason: campaign.campaignName,
        details: {
          campaignName: campaign.campaignName,
          filters: campaign.filters,
          pointsPerUser: campaign.points,
          targetUserIds: targetUserIds.slice(0, 100), // Limit stored user IDs
          errors: result.errors.slice(0, 10)
        },
        createdAt: new Date()
      });

      return {
        operationId,
        successCount: result.successCount,
        failCount: result.failCount,
        targetUsers: targetUserIds.length,
        errors: result.errors
      };
    } catch (error) {
      console.error('Error in campaign points distribution:', error);
      throw new Error('Failed to execute campaign points distribution');
    }
  }

  // Parse CSV data for bulk operations
  async parseBulkAwardCSV(csvData: string): Promise<{
    valid: BulkAwardRequest[];
    invalid: Array<{ row: number; errors: string[]; data: any }>;
  }> {
    const valid: BulkAwardRequest[] = [];
    const invalid: Array<{ row: number; errors: string[]; data: any }> = [];

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Validate required headers
      const requiredHeaders = ['userid', 'points', 'reason'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        const errors: string[] = [];

        // Validate required fields
        if (!rowData.userid) {
          errors.push('User ID is required');
        }

        if (!rowData.points || isNaN(parseInt(rowData.points))) {
          errors.push('Valid points value is required');
        } else if (parseInt(rowData.points) <= 0) {
          errors.push('Points must be greater than 0');
        } else if (parseInt(rowData.points) > 10000) {
          errors.push('Points cannot exceed 10,000 per user');
        }

        if (!rowData.reason) {
          errors.push('Reason is required');
        }

        if (errors.length > 0) {
          invalid.push({ row: i + 1, errors, data: rowData });
        } else {
          valid.push({
            userIds: [rowData.userid],
            points: parseInt(rowData.points),
            reason: rowData.reason,
            description: rowData.description || undefined,
            category: rowData.category || 'Bulk Award'
          });
        }
      }

      return { valid, invalid };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error('Failed to parse CSV data');
    }
  }

  // Get bulk operation history
  async getBulkOperationHistory(filters?: {
    adminUserId?: string;
    operationType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Since we don't have a dedicated audit table, we'll reconstruct from transactions
      const {
        adminUserId,
        operationType,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0
      } = filters || {};

      // Query transactions with bulk operation references
      const conditions: any[] = [
        sql`${pointsTransactions.reference} LIKE 'OP-%' OR ${pointsTransactions.reference} LIKE 'CAMP-%'`
      ];

      if (dateFrom) {
        conditions.push(gte(pointsTransactions.createdAt, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(pointsTransactions.createdAt, dateTo));
      }

      const operations = await db
        .select({
          reference: pointsTransactions.reference,
          reason: pointsTransactions.reason,
          totalUsers: sql<number>`COUNT(DISTINCT ${pointsTransactions.userId})`,
          totalPoints: sql<number>`SUM(${pointsTransactions.points})`,
          operationType: sql<string>`CASE 
            WHEN ${pointsTransactions.reference} LIKE 'CAMP-%' THEN 'campaign_distribution'
            WHEN ${pointsTransactions.points} > 0 THEN 'bulk_award'
            ELSE 'bulk_reward'
          END`,
          createdAt: sql<Date>`MIN(${pointsTransactions.createdAt})`
        })
        .from(pointsTransactions)
        .where(and(...conditions))
        .groupBy(pointsTransactions.reference, pointsTransactions.reason)
        .orderBy(sql`MIN(${pointsTransactions.createdAt}) DESC`)
        .limit(limit)
        .offset(offset);

      return operations;
    } catch (error) {
      console.error('Error fetching bulk operation history:', error);
      throw new Error('Failed to fetch bulk operation history');
    }
  }

  // Log bulk operation for audit trail
  private async logBulkOperation(log: BulkOperationAuditLog): Promise<void> {
    try {
      // For now, log to console and store in points transactions reference
      console.log('Bulk Operation Audit Log:', {
        id: log.id,
        type: log.operationType,
        admin: log.adminUserId,
        targets: log.targetCount,
        success: log.successCount,
        failed: log.failCount,
        points: log.totalPoints,
        campaign: log.campaignId,
        reason: log.reason
      });

      // In a production system, you might want a dedicated audit_logs table
      // For now, the operation details are stored in the transaction references
    } catch (error) {
      console.error('Error logging bulk operation:', error);
    }
  }
}