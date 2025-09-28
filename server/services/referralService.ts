import { db } from '../db';
import { referralCodes, referralSignups, users } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PointsService } from './pointsService';
import { NotificationService } from './notificationService';

export class ReferralService {
  private pointsService: PointsService;
  private notificationService: NotificationService;

  constructor() {
    this.pointsService = new PointsService();
    this.notificationService = new NotificationService();
  }

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has an active referral code
      const existingCode = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.userId, userId),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      if (existingCode.length > 0) {
        return existingCode[0].code;
      }

      // Generate new unique code
      let code = '';
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        code = this.generateUniqueCode(userId);
        
        // Check if code already exists
        const existing = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.code, code))
          .limit(1);

        if (existing.length === 0) {
          break;
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique referral code');
      }

      // Insert new referral code
      await db.insert(referralCodes).values({
        userId,
        code,
        isActive: true,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Generated referral code ${code} for user ${userId}`);
      return code;

    } catch (error) {
      console.error(`Error generating referral code for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a unique referral code string
   */
  private generateUniqueCode(userId: string): string {
    // Use first few characters of user ID + random suffix
    const userPrefix = userId.substring(0, 4).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${userPrefix}${randomSuffix}`;
  }

  /**
   * Process referral signup when a new user registers
   */
  async processReferralSignup(referralCode: string, newUserId: string): Promise<any> {
    try {
      console.log(`Processing referral signup with code: ${referralCode} for user: ${newUserId}`);

      // Find referral code
      const [codeRecord] = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.code, referralCode),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      if (!codeRecord) {
        console.log(`Referral code ${referralCode} not found or inactive`);
        return null;
      }

      // Check if code has usage limits
      if (codeRecord.maxUses && (codeRecord.currentUses || 0) >= codeRecord.maxUses) {
        console.log(`Referral code ${referralCode} has reached maximum uses`);
        return null;
      }

      // Check if code has expired
      if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
        console.log(`Referral code ${referralCode} has expired`);
        return null;
      }

      // Create referral signup record
      const referrerPoints = 200;
      const refereePoints = 100;

      const [referralSignup] = await db.insert(referralSignups).values({
        referralCodeId: codeRecord.id,
        referrerId: codeRecord.userId,
        refereeId: newUserId,
        referrerPoints,
        refereePoints,
        status: 'Completed',
        completedAt: new Date(),
        createdAt: new Date()
      }).returning();

      // Update referral code usage count
      await db.update(referralCodes)
        .set({ 
          currentUses: (codeRecord.currentUses || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(referralCodes.id, codeRecord.id));

      // Award points to referrer
      await this.pointsService.awardPointsForActivity(
        codeRecord.userId,
        'REFERRAL_SIGNUP',
        `referral-${referralSignup.id}`,
        'referral',
        referrerPoints
      );

      // Award points to referee (new user)
      await this.pointsService.awardPointsForActivity(
        newUserId,
        'REFERRAL_SIGNUP',
        `referral-bonus-${referralSignup.id}`,
        'referral_bonus',
        refereePoints
      );

      // Get referrer details for notification
      const referrerDetails = await db.select({ 
        email: users.email,
        profileImageUrl: users.profileImageUrl
      })
      .from(users)
      .where(eq(users.id, codeRecord.userId))
      .limit(1);

      const referrer = referrerDetails[0];

      // Send notifications
      await this.notificationService.notifyReferralSuccess(
        codeRecord.userId,
        newUserId,
        referrerPoints,
        'New Member'
      );

      console.log(`Referral processed successfully: ${referrerPoints} points to referrer, ${refereePoints} points to referee`);

      return {
        success: true,
        referralSignup,
        referrerPoints,
        refereePoints,
        referrerId: codeRecord.userId
      };

    } catch (error) {
      console.error(`Error processing referral signup:`, error);
      throw error;
    }
  }

  /**
   * Get user's referral statistics
   */
  async getUserReferralStats(userId: string): Promise<any> {
    try {
      // Get user's referral code
      const [referralCode] = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.userId, userId),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);

      // Get referral signups statistics
      const referralStats = await db.select({
        totalReferrals: sql`count(*)`,
        totalPointsEarned: sql`sum(referrer_points)`,
        completedReferrals: sql`count(case when status = 'Completed' then 1 end)`
      })
      .from(referralSignups)
      .where(eq(referralSignups.referrerId, userId));

      // Get recent referrals
      const recentReferrals = await db.select({
        id: referralSignups.id,
        refereeId: referralSignups.refereeId,
        referrerPoints: referralSignups.referrerPoints,
        status: referralSignups.status,
        completedAt: referralSignups.completedAt,
        createdAt: referralSignups.createdAt
      })
      .from(referralSignups)
      .where(eq(referralSignups.referrerId, userId))
      .limit(10);

      const stats = referralStats[0] || {
        totalReferrals: 0,
        totalPointsEarned: 0,
        completedReferrals: 0
      };

      return {
        referralCode: referralCode?.code || null,
        codeActive: !!referralCode,
        totalReferrals: parseInt(String(stats.totalReferrals)) || 0,
        totalPointsEarned: parseInt(String(stats.totalPointsEarned)) || 0,
        completedReferrals: parseInt(String(stats.completedReferrals)) || 0,
        recentReferrals
      };

    } catch (error) {
      console.error(`Error getting referral stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all referral activity (admin view)
   */
  async getAllReferralActivity(limit = 50, offset = 0): Promise<any> {
    try {
      const referralActivity = await db.select({
        id: referralSignups.id,
        referrerId: referralSignups.referrerId,
        refereeId: referralSignups.refereeId,
        referrerPoints: referralSignups.referrerPoints,
        refereePoints: referralSignups.refereePoints,
        status: referralSignups.status,
        completedAt: referralSignups.completedAt,
        createdAt: referralSignups.createdAt,
        referralCode: referralCodes.code
      })
      .from(referralSignups)
      .leftJoin(referralCodes, eq(referralSignups.referralCodeId, referralCodes.id))
      .limit(limit)
      .offset(offset);

      // Get total statistics
      const totalStats = await db.select({
        totalSignups: sql`count(*)`,
        totalReferrerPoints: sql`sum(referrer_points)`,
        totalRefereePoints: sql`sum(referee_points)`,
        completedSignups: sql`count(case when status = 'Completed' then 1 end)`
      })
      .from(referralSignups);

      return {
        referrals: referralActivity,
        stats: totalStats[0] || {
          totalSignups: 0,
          totalReferrerPoints: 0,
          totalRefereePoints: 0,
          completedSignups: 0
        }
      };

    } catch (error) {
      console.error('Error getting all referral activity:', error);
      throw error;
    }
  }

  /**
   * Deactivate referral code
   */
  async deactivateReferralCode(userId: string): Promise<boolean> {
    try {
      await db.update(referralCodes)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(referralCodes.userId, userId));

      console.log(`Deactivated referral code for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`Error deactivating referral code for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Validate referral code
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; message?: string; referrerId?: string }> {
    try {
      const [codeRecord] = await db.select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code))
        .limit(1);

      if (!codeRecord) {
        return { valid: false, message: 'Referral code not found' };
      }

      if (!codeRecord.isActive) {
        return { valid: false, message: 'Referral code is inactive' };
      }

      if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
        return { valid: false, message: 'Referral code has expired' };
      }

      if (codeRecord.maxUses && (codeRecord.currentUses || 0) >= codeRecord.maxUses) {
        return { valid: false, message: 'Referral code has reached maximum uses' };
      }

      return { 
        valid: true, 
        message: 'Referral code is valid',
        referrerId: codeRecord.userId
      };

    } catch (error) {
      console.error(`Error validating referral code ${code}:`, error);
      return { valid: false, message: 'Error validating referral code' };
    }
  }
}