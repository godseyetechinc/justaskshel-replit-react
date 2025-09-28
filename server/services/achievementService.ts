import { db } from '../db';
import { achievements, userAchievements, users, pointsTransactions, pointsSummary } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PointsService } from './pointsService';

export class AchievementService {
  private pointsService: PointsService;

  constructor() {
    this.pointsService = new PointsService();
  }

  /**
   * Default achievements configuration
   */
  private static readonly DEFAULT_ACHIEVEMENTS = [
    {
      name: "Welcome to JustAskShel",
      description: "Complete your first action on the platform",
      category: "Milestone" as const,
      icon: "trophy",
      pointsReward: 50,
      requirements: { type: "first_action" },
      sortOrder: 1
    },
    {
      name: "First Policy Purchase",
      description: "Purchase your first insurance policy",
      category: "Milestone" as const,
      icon: "shield-check",
      pointsReward: 100,
      requirements: { type: "policy_count", threshold: 1 },
      sortOrder: 2
    },
    {
      name: "Points Collector",
      description: "Earn your first 1000 points",
      category: "Milestone" as const,
      icon: "coins",
      pointsReward: 100,
      requirements: { type: "points_earned", threshold: 1000 },
      sortOrder: 3
    },
    {
      name: "Login Streak Champion",
      description: "Log in for 7 consecutive days",
      category: "Streak" as const,
      icon: "calendar-check",
      pointsReward: 150,
      requirements: { type: "login_streak", threshold: 7 },
      sortOrder: 4
    },
    {
      name: "Silver Tier Achievement",
      description: "Reach Silver tier status",
      category: "Tier" as const,
      icon: "medal",
      pointsReward: 200,
      requirements: { type: "tier_reached", threshold: "Silver" },
      sortOrder: 5
    },
    {
      name: "Gold Tier Achievement",
      description: "Reach Gold tier status",
      category: "Tier" as const,
      icon: "star",
      pointsReward: 500,
      requirements: { type: "tier_reached", threshold: "Gold" },
      sortOrder: 6
    },
    {
      name: "Referral Master",
      description: "Successfully refer 3 new users",
      category: "Referral" as const,
      icon: "users",
      pointsReward: 300,
      requirements: { type: "referrals_made", threshold: 3 },
      sortOrder: 7
    },
    {
      name: "Claims Expert",
      description: "Submit 5 insurance claims",
      category: "Activity" as const,
      icon: "file-text",
      pointsReward: 250,
      requirements: { type: "claims_submitted", threshold: 5 },
      sortOrder: 8
    }
  ];

  /**
   * Initialize default achievements in the database
   */
  async initializeDefaultAchievements(): Promise<void> {
    try {
      console.log('Initializing default achievements...');
      
      for (const achievementData of AchievementService.DEFAULT_ACHIEVEMENTS) {
        // Check if achievement already exists
        const existing = await db.select().from(achievements)
          .where(eq(achievements.name, achievementData.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(achievements).values(achievementData);
          console.log(`Created achievement: ${achievementData.name}`);
        }
      }
      
      console.log('Default achievements initialized successfully');
    } catch (error) {
      console.error('Error initializing default achievements:', error);
      throw error;
    }
  }

  /**
   * Check and unlock achievements for a user
   */
  async checkUserAchievements(userId: string): Promise<any[]> {
    try {
      const unlockedAchievements = [];

      // Get all active achievements
      const allAchievements = await db.select().from(achievements)
        .where(eq(achievements.isActive, true));

      // Get user's existing achievements
      const userExistingAchievements = await db.select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

      const existingAchievementIds = new Set(
        userExistingAchievements.map(ua => ua.achievementId)
      );

      // Check each achievement
      for (const achievement of allAchievements) {
        if (!existingAchievementIds.has(achievement.id)) {
          const isUnlocked = await this.checkAchievementRequirement(userId, achievement);
          
          if (isUnlocked) {
            // Unlock the achievement
            const unlockedAchievement = await this.unlockAchievement(userId, achievement.id, achievement.pointsReward || 0);
            unlockedAchievements.push(unlockedAchievement);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error(`Error checking achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if a specific achievement requirement is met
   */
  private async checkAchievementRequirement(userId: string, achievement: any): Promise<boolean> {
    try {
      const requirements = achievement.requirements;
      
      if (!requirements || !requirements.type) {
        return false;
      }

      switch (requirements.type) {
        case 'first_action':
          // Check if user has any points transactions (indicating activity)
          const transactions = await db.select()
            .from(pointsTransactions)
            .where(eq(pointsTransactions.userId, userId))
            .limit(1);
          return transactions.length > 0;

        case 'policy_count':
          // Check policy count (would need to import policies table)
          const policyCount = await db.select({ count: sql`count(*)` })
            .from(sql`policies`)
            .where(sql`user_id = ${userId}`);
          return (policyCount[0]?.count || 0) >= requirements.threshold;

        case 'points_earned':
          // Check total points earned
          const pointsSummaryRecord = await db.select()
            .from(pointsSummary)
            .where(eq(pointsSummary.userId, userId))
            .limit(1);
          const totalEarned = pointsSummaryRecord[0]?.totalEarned || 0;
          return totalEarned >= requirements.threshold;

        case 'login_streak':
          // This would require tracking login streaks - simplified check for now
          const loginTransactions = await db.select()
            .from(pointsTransactions)
            .where(and(
              eq(pointsTransactions.userId, userId),
              eq(pointsTransactions.category, 'Login')
            ));
          return loginTransactions.length >= requirements.threshold;

        case 'tier_reached':
          // Check if user has reached specific tier
          const userSummary = await db.select()
            .from(pointsSummary)
            .where(eq(pointsSummary.userId, userId))
            .limit(1);
          const currentTier = userSummary[0]?.tierLevel || 'Bronze';
          return currentTier === requirements.threshold;

        case 'referrals_made':
          // Check referral count (would need referral tracking)
          const referralCount = await db.select({ count: sql`count(*)` })
            .from(sql`referral_signups`)
            .where(sql`referrer_id = ${userId} AND status = 'Completed'`);
          return (referralCount[0]?.count || 0) >= requirements.threshold;

        case 'claims_submitted':
          // Check claims count
          const claimsCount = await db.select({ count: sql`count(*)` })
            .from(sql`claims`)
            .where(sql`user_id = ${userId}`);
          return (claimsCount[0]?.count || 0) >= requirements.threshold;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking achievement requirement for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Unlock achievement for user and award points
   */
  private async unlockAchievement(userId: string, achievementId: number, pointsReward: number): Promise<any> {
    try {
      // Insert user achievement record
      const [userAchievement] = await db.insert(userAchievements).values({
        userId,
        achievementId,
        pointsAwarded: pointsReward,
        unlockedAt: new Date(),
        notificationSent: false
      }).returning();

      // Award points if applicable
      if (pointsReward > 0) {
        await this.pointsService.awardPointsForActivity(
          userId, 
          'WELCOME_BONUS', // Using existing activity type
          `achievement-${achievementId}`,
          'achievement',
          pointsReward
        );
      }

      // Get achievement details for return
      const [achievement] = await db.select()
        .from(achievements)
        .where(eq(achievements.id, achievementId));

      console.log(`Achievement unlocked: ${achievement.name} for user ${userId} (+${pointsReward} points)`);

      return {
        ...userAchievement,
        achievement
      };

    } catch (error) {
      console.error(`Error unlocking achievement ${achievementId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string): Promise<any> {
    try {
      // Get unlocked achievements
      const unlockedAchievements = await db.select({
        id: userAchievements.id,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        pointsAwarded: userAchievements.pointsAwarded,
        name: achievements.name,
        description: achievements.description,
        category: achievements.category,
        icon: achievements.icon,
        pointsReward: achievements.pointsReward
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

      // Get all achievements for progress tracking
      const allAchievements = await db.select().from(achievements)
        .where(eq(achievements.isActive, true));

      const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));

      const lockedAchievements = allAchievements
        .filter(a => !unlockedIds.has(a.id))
        .map(achievement => ({
          ...achievement,
          unlocked: false,
          progress: 0 // TODO: Calculate actual progress
        }));

      return {
        unlocked: unlockedAchievements.map(ua => ({ ...ua, unlocked: true })),
        locked: lockedAchievements,
        totalUnlocked: unlockedAchievements.length,
        totalAchievements: allAchievements.length
      };

    } catch (error) {
      console.error(`Error getting achievements for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all achievements (admin view)
   */
  async getAllAchievements(): Promise<any[]> {
    try {
      return await db.select().from(achievements).orderBy(achievements.sortOrder);
    } catch (error) {
      console.error('Error getting all achievements:', error);
      throw error;
    }
  }
}