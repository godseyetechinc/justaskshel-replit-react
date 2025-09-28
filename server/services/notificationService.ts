import { db } from '../db';
import { notifications, users } from '../../shared/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';

export class NotificationService {
  
  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string, 
    type: 'Points' | 'TierUpgrade' | 'Achievement' | 'Referral' | 'Reward' | 'System',
    title: string,
    message: string,
    data?: any,
    priority: 'Low' | 'Normal' | 'High' | 'Urgent' = 'Normal'
  ): Promise<any> {
    try {
      const [notification] = await db.insert(notifications).values({
        userId,
        type,
        title,
        message,
        data,
        priority,
        isRead: false,
        createdAt: new Date()
      }).returning();

      console.log(`Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error(`Error creating notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send points earned notification
   */
  async notifyPointsEarned(userId: string, points: number, reason: string, referenceType?: string): Promise<void> {
    try {
      const title = `+${points} Points Earned!`;
      const message = `You earned ${points} points for ${reason}`;
      
      await this.createNotification(
        userId, 
        'Points', 
        title, 
        message,
        { points, reason, referenceType }
      );
    } catch (error) {
      console.error(`Error sending points notification to user ${userId}:`, error);
    }
  }

  /**
   * Send tier upgrade notification
   */
  async notifyTierUpgrade(userId: string, newTier: string, oldTier: string, pointsThreshold: number): Promise<void> {
    try {
      const title = `🎉 Tier Upgrade - Welcome to ${newTier}!`;
      const message = `Congratulations! You've been promoted from ${oldTier} to ${newTier} tier with ${pointsThreshold} points.`;
      
      await this.createNotification(
        userId, 
        'TierUpgrade', 
        title, 
        message,
        { newTier, oldTier, pointsThreshold },
        'High'
      );
    } catch (error) {
      console.error(`Error sending tier upgrade notification to user ${userId}:`, error);
    }
  }

  /**
   * Send achievement unlocked notification
   */
  async notifyAchievementUnlocked(userId: string, achievementName: string, pointsAwarded: number, description?: string): Promise<void> {
    try {
      const title = `🏆 Achievement Unlocked!`;
      const message = `You unlocked "${achievementName}"${pointsAwarded > 0 ? ` and earned ${pointsAwarded} bonus points!` : '!'}`;
      
      await this.createNotification(
        userId, 
        'Achievement', 
        title, 
        message,
        { achievementName, pointsAwarded, description },
        'High'
      );
    } catch (error) {
      console.error(`Error sending achievement notification to user ${userId}:`, error);
    }
  }

  /**
   * Send referral success notification
   */
  async notifyReferralSuccess(referrerId: string, refereeId: string, referrerPoints: number, refereeName?: string): Promise<void> {
    try {
      const title = `🤝 Referral Success!`;
      const message = `Your referral${refereeName ? ` of ${refereeName}` : ''} was successful! You earned ${referrerPoints} points.`;
      
      await this.createNotification(
        referrerId, 
        'Referral', 
        title, 
        message,
        { refereeId, referrerPoints, refereeName }
      );

      // Also notify the referee
      const refereeTitle = `Welcome Bonus!`;
      const refereeMessage = `Welcome to JustAskShel! You've received bonus points for joining through a referral.`;
      
      await this.createNotification(
        refereeId,
        'Referral',
        refereeTitle, 
        refereeMessage,
        { referrerId, type: 'referee_welcome' }
      );
    } catch (error) {
      console.error(`Error sending referral notifications:`, error);
    }
  }

  /**
   * Send reward redemption notification
   */
  async notifyRewardRedemption(userId: string, rewardName: string, pointsUsed: number, status: string): Promise<void> {
    try {
      const title = status === 'Approved' ? `✅ Reward Redeemed!` : `📋 Reward Request Received`;
      const message = status === 'Approved' 
        ? `Your ${rewardName} reward has been approved and will be delivered soon.`
        : `Your request for ${rewardName} (${pointsUsed} points) has been received and is being processed.`;
      
      await this.createNotification(
        userId, 
        'Reward', 
        title, 
        message,
        { rewardName, pointsUsed, status }
      );
    } catch (error) {
      console.error(`Error sending reward notification to user ${userId}:`, error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<any> {
    try {
      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const unreadCount = await db.select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      return {
        notifications: userNotifications,
        unreadCount: unreadCount[0]?.count || 0,
        total: userNotifications.length
      };
    } catch (error) {
      console.error(`Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: string): Promise<void> {
    try {
      await db.update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await db.update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db.delete(notifications)
        .where(sql`created_at < ${cutoffDate.toISOString()}`);

      console.log(`Cleaned up old notifications: deleted notifications older than ${daysOld} days`);
      return 0;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for admin
   */
  async getNotificationStats(): Promise<any> {
    try {
      const stats = await db.select({
        type: notifications.type,
        total: sql`count(*)`,
        unread: sql`sum(case when is_read = false then 1 else 0 end)`
      })
      .from(notifications)
      .groupBy(notifications.type);

      const totalNotifications = await db.select({ count: count() })
        .from(notifications);

      return {
        byType: stats,
        total: totalNotifications[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw error;
    }
  }
}