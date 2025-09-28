import { db } from "../db";
import { pointsRules, pointsTransactions } from "../../shared/schema";
import { eq, desc, asc, and, gte, lte, sql, count } from "drizzle-orm";
import type { PointsRule, InsertPointsRule } from "../../shared/schema";

export class PointsRulesManagementService {
  
  // Get all points rules with optional filtering
  async getAllPointsRules(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    sortBy?: 'name' | 'category' | 'points' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ rules: PointsRule[], total: number }> {
    try {
      const { 
        category, 
        isActive, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc', 
        limit = 50, 
        offset = 0 
      } = filters || {};

      // Build where conditions
      const conditions: any[] = [];
      
      if (category) {
        conditions.push(eq(pointsRules.category, category));
      }
      
      if (typeof isActive === 'boolean') {
        conditions.push(eq(pointsRules.isActive, isActive));
      }
      
      if (search) {
        conditions.push(
          sql`(${pointsRules.name} ILIKE ${`%${search}%`} OR ${pointsRules.description} ILIKE ${`%${search}%`})`
        );
      }

      // Build sort order
      const orderBy = sortOrder === 'asc' ? asc : desc;
      let sortColumn: any;
      switch (sortBy) {
        case 'name':
          sortColumn = pointsRules.name;
          break;
        case 'category':
          sortColumn = pointsRules.category;
          break;
        case 'points':
          sortColumn = pointsRules.points;
          break;
        default:
          sortColumn = pointsRules.createdAt;
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(pointsRules)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get rules with pagination
      const rules = await db
        .select()
        .from(pointsRules)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset(offset);

      return {
        rules,
        total: totalResult.count
      };
    } catch (error) {
      console.error('Error fetching points rules:', error);
      throw new Error('Failed to fetch points rules');
    }
  }

  // Get a specific points rule by ID
  async getPointsRuleById(id: number): Promise<PointsRule | null> {
    try {
      const [rule] = await db
        .select()
        .from(pointsRules)
        .where(eq(pointsRules.id, id))
        .limit(1);

      return rule || null;
    } catch (error) {
      console.error('Error fetching points rule:', error);
      throw new Error('Failed to fetch points rule');
    }
  }

  // Create a new points rule
  async createPointsRule(data: InsertPointsRule): Promise<PointsRule> {
    try {
      const [newRule] = await db
        .insert(pointsRules)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log(`Created points rule: ${newRule.name} (${newRule.points} points)`);
      return newRule;
    } catch (error) {
      console.error('Error creating points rule:', error);
      throw new Error('Failed to create points rule');
    }
  }

  // Update an existing points rule
  async updatePointsRule(id: number, data: Partial<InsertPointsRule>): Promise<PointsRule> {
    try {
      const [updatedRule] = await db
        .update(pointsRules)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(pointsRules.id, id))
        .returning();

      if (!updatedRule) {
        throw new Error('Points rule not found');
      }

      console.log(`Updated points rule: ${updatedRule.name}`);
      return updatedRule;
    } catch (error) {
      console.error('Error updating points rule:', error);
      throw new Error('Failed to update points rule');
    }
  }

  // Delete a points rule
  async deletePointsRule(id: number): Promise<boolean> {
    try {
      const [deletedRule] = await db
        .delete(pointsRules)
        .where(eq(pointsRules.id, id))
        .returning();

      if (!deletedRule) {
        throw new Error('Points rule not found');
      }

      console.log(`Deleted points rule: ${deletedRule.name}`);
      return true;
    } catch (error) {
      console.error('Error deleting points rule:', error);
      throw new Error('Failed to delete points rule');
    }
  }

  // Bulk activate/deactivate rules
  async bulkUpdateRuleStatus(ids: number[], isActive: boolean): Promise<number> {
    try {
      const result = await db
        .update(pointsRules)
        .set({ 
          isActive,
          updatedAt: new Date()
        })
        .where(sql`${pointsRules.id} = ANY(${ids})`)
        .returning();

      console.log(`Bulk updated ${result.length} rules to ${isActive ? 'active' : 'inactive'}`);
      return result.length;
    } catch (error) {
      console.error('Error bulk updating rule status:', error);
      throw new Error('Failed to bulk update rule status');
    }
  }

  // Get rule usage statistics
  async getRuleUsageStats(ruleId?: number): Promise<any> {
    try {
      if (ruleId) {
        // Get stats for a specific rule
        const [stats] = await db
          .select({
            totalPoints: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`,
            totalTransactions: count(),
            avgPoints: sql<number>`COALESCE(AVG(${pointsTransactions.points}), 0)`,
            lastUsed: sql<Date>`MAX(${pointsTransactions.createdAt})`
          })
          .from(pointsTransactions)
          .where(eq(pointsTransactions.reason, sql`(SELECT name FROM ${pointsRules} WHERE id = ${ruleId})`));

        return stats;
      } else {
        // Get overall rule usage stats
        const stats = await db
          .select({
            ruleName: pointsRules.name,
            ruleId: pointsRules.id,
            category: pointsRules.category,
            points: pointsRules.points,
            isActive: pointsRules.isActive,
            totalUsage: sql<number>`COALESCE(COUNT(${pointsTransactions.id}), 0)`,
            totalPoints: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`
          })
          .from(pointsRules)
          .leftJoin(pointsTransactions, eq(pointsRules.name, pointsTransactions.reason))
          .groupBy(pointsRules.id, pointsRules.name, pointsRules.category, pointsRules.points, pointsRules.isActive)
          .orderBy(desc(sql`COALESCE(COUNT(${pointsTransactions.id}), 0)`));

        return stats;
      }
    } catch (error) {
      console.error('Error fetching rule usage stats:', error);
      throw new Error('Failed to fetch rule usage statistics');
    }
  }

  // Get available categories
  async getAvailableCategories(): Promise<string[]> {
    try {
      const categories = await db
        .selectDistinct({ category: pointsRules.category })
        .from(pointsRules)
        .where(eq(pointsRules.isActive, true))
        .orderBy(asc(pointsRules.category));

      return categories.map(c => c.category);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // Validate rule conflicts (e.g., duplicate rules for same category)
  async validateRule(data: InsertPointsRule, excludeId?: number): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check for duplicate names
      const conditions: any[] = [eq(pointsRules.name, data.name)];
      if (excludeId) {
        conditions.push(sql`${pointsRules.id} != ${excludeId}`);
      }

      const [existingRule] = await db
        .select()
        .from(pointsRules)
        .where(and(...conditions))
        .limit(1);

      if (existingRule) {
        errors.push('A rule with this name already exists');
      }

      // Validate point values
      if (data.points && data.points <= 0) {
        errors.push('Points value must be greater than 0');
      }

      if (data.points && data.points > 10000) {
        errors.push('Points value cannot exceed 10,000');
      }

      // Validate period limits
      if (data.maxPerPeriod && data.maxPerPeriod <= 0) {
        errors.push('Max per period must be greater than 0');
      }

      // Validate date ranges
      if (data.validFrom && data.validUntil && data.validFrom > data.validUntil) {
        errors.push('Valid from date must be before valid until date');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating rule:', error);
      return {
        isValid: false,
        errors: ['Validation failed due to system error']
      };
    }
  }
}